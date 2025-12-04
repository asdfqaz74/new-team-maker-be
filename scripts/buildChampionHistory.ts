/**
 * 챔피언 히스토리 빌드 스크립트
 * 특정 버전부터 현재까지 모든 패치의 변경사항을 순차적으로 기록합니다.
 *
 * 실행: npx tsx scripts/buildChampionHistory.ts
 * 옵션:
 *   --from=13.1.1  : 시작 버전 (기본값: 13.1.1)
 *   --to=15.24.1   : 종료 버전 (기본값: 최신)
 *   --dry-run      : 실제 저장 없이 확인만
 */

import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config({ path: ".env.development" });

import Champion, { IChampion, ISpell } from "../src/models/champion.model";
import ChampionHistory, {
  ISpellChange,
  IStatChange,
} from "../src/models/championHistory.model";

const VERSIONS_URL = "https://ddragon.leagueoflegends.com/api/versions.json";

const getChampionListUrl = (version: string) =>
  `https://ddragon.leagueoflegends.com/cdn/${version}/data/ko_KR/champion.json`;

const getChampionDetailUrl = (version: string, championId: string) =>
  `https://ddragon.leagueoflegends.com/cdn/${version}/data/ko_KR/champion/${championId}.json`;

// 타입 정의
interface ChampionData {
  version: string;
  id: string;
  key: string;
  name: string;
  title: string;
  lore: string;
  blurb: string;
  info: Record<string, number>;
  image: Record<string, unknown>;
  tags: string[];
  partype: string;
  stats: Record<string, number>;
  spells: {
    id: string;
    name: string;
    description: string;
    tooltip: string;
    cooldown: number[];
    cost: number[];
    effect: (number[] | null)[];
  }[];
  passive: {
    name: string;
    description: string;
  };
  skins: unknown[];
  allytips: string[];
  enemytips: string[];
}

// CLI 옵션 파싱
const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");

const fromArg = args.find((a) => a.startsWith("--from="));
const toArg = args.find((a) => a.startsWith("--to="));

const FROM_VERSION = fromArg?.split("=")[1] || "13.1.1";
const TO_VERSION = toArg?.split("=")[1] || null; // null이면 최신

// 유틸리티 함수
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const SPELL_KEYS: ("Q" | "W" | "E" | "R")[] = ["Q", "W", "E", "R"];

/**
 * 버전 비교 함수
 */
function compareVersions(a: string, b: string): number {
  const partsA = a.split(".").map(Number);
  const partsB = b.split(".").map(Number);

  for (let i = 0; i < Math.max(partsA.length, partsB.length); i++) {
    const numA = partsA[i] || 0;
    const numB = partsB[i] || 0;
    if (numA !== numB) return numA - numB;
  }
  return 0;
}

/**
 * 모든 버전 가져오기
 */
async function getAllVersions(): Promise<string[]> {
  const response = await fetch(VERSIONS_URL);
  const versions: string[] = await response.json();
  return versions;
}

/**
 * 범위 내 버전 필터링
 */
function filterVersions(
  versions: string[],
  from: string,
  to: string | null
): string[] {
  // 정식 패치 버전만 (lolpatch_ 등 제외)
  const validVersions = versions.filter((v) => /^\d+\.\d+\.\d+$/.test(v));

  let filtered = validVersions.filter((v) => compareVersions(v, from) >= 0);

  if (to) {
    filtered = filtered.filter((v) => compareVersions(v, to) <= 0);
  }

  // 오래된 버전부터 정렬
  return filtered.sort(compareVersions);
}

/**
 * 챔피언 목록 가져오기
 */
async function fetchChampionList(
  version: string
): Promise<Record<string, { id: string; name: string }> | null> {
  try {
    const response = await fetch(getChampionListUrl(version));
    if (!response.ok) return null;
    const data = await response.json();
    return data.data;
  } catch {
    return null;
  }
}

/**
 * 챔피언 상세 정보 가져오기
 */
async function fetchChampionDetail(
  version: string,
  championId: string
): Promise<ChampionData | null> {
  try {
    const response = await fetch(getChampionDetailUrl(version, championId));
    if (!response.ok) return null;
    const data = await response.json();
    return data.data[championId];
  } catch {
    return null;
  }
}

/**
 * 스킬 변경사항 감지
 */
function detectSpellChanges(
  oldData: ChampionData,
  newData: ChampionData
): ISpellChange[] {
  const changes: ISpellChange[] = [];

  // 패시브 비교
  if (oldData.passive && newData.passive) {
    if (
      oldData.passive.description !== newData.passive.description ||
      oldData.passive.name !== newData.passive.name
    ) {
      changes.push({
        spellKey: "P",
        spellId: "passive",
        spellName: newData.passive.name,
        changeType: "adjust",
        before: { description: oldData.passive.description },
        after: { description: newData.passive.description },
      });
    }
  }

  // Q, W, E, R 비교
  for (let i = 0; i < 4; i++) {
    const oldSpell = oldData.spells?.[i];
    const newSpell = newData.spells?.[i];

    if (!oldSpell || !newSpell) continue;

    const hasTooltipChange = oldSpell.tooltip !== newSpell.tooltip;
    const hasCooldownChange =
      JSON.stringify(oldSpell.cooldown) !== JSON.stringify(newSpell.cooldown);
    const hasCostChange =
      JSON.stringify(oldSpell.cost) !== JSON.stringify(newSpell.cost);
    const hasEffectChange =
      JSON.stringify(oldSpell.effect) !== JSON.stringify(newSpell.effect);
    const hasDescChange = oldSpell.description !== newSpell.description;

    if (
      hasTooltipChange ||
      hasCooldownChange ||
      hasCostChange ||
      hasEffectChange ||
      hasDescChange
    ) {
      let changeType: ISpellChange["changeType"] = "adjust";

      if (hasCooldownChange && newSpell.cooldown && oldSpell.cooldown) {
        const avgOld =
          oldSpell.cooldown.reduce((a: number, b: number) => a + b, 0) /
          oldSpell.cooldown.length;
        const avgNew =
          newSpell.cooldown.reduce((a: number, b: number) => a + b, 0) /
          newSpell.cooldown.length;
        changeType =
          avgNew < avgOld ? "buff" : avgNew > avgOld ? "nerf" : "adjust";
      }

      changes.push({
        spellKey: SPELL_KEYS[i],
        spellId: newSpell.id,
        spellName: newSpell.name,
        changeType,
        before: {
          tooltip: oldSpell.tooltip,
          cooldown: oldSpell.cooldown,
          cost: oldSpell.cost,
          effect: oldSpell.effect,
          description: oldSpell.description,
        },
        after: {
          tooltip: newSpell.tooltip,
          cooldown: newSpell.cooldown,
          cost: newSpell.cost,
          effect: newSpell.effect,
          description: newSpell.description,
        },
      });
    }
  }

  return changes;
}

/**
 * 스탯 변경사항 감지
 */
function detectStatChanges(
  oldStats: Record<string, number>,
  newStats: Record<string, number>
): IStatChange[] {
  const changes: IStatChange[] = [];
  const statsToTrack = [
    "hp",
    "hpperlevel",
    "mp",
    "armor",
    "armorperlevel",
    "spellblock",
    "attackdamage",
    "attackdamageperlevel",
    "attackspeed",
    "movespeed",
    "hpregen",
    "mpregen",
  ];

  for (const stat of statsToTrack) {
    const oldVal = oldStats[stat];
    const newVal = newStats[stat];

    if (oldVal !== newVal && oldVal !== undefined && newVal !== undefined) {
      changes.push({
        statName: stat,
        before: oldVal,
        after: newVal,
        changeType: newVal > oldVal ? "buff" : "nerf",
      });
    }
  }

  return changes;
}

/**
 * 메인 함수
 */
async function buildHistory(): Promise<void> {
  console.log("🎮 챔피언 히스토리 빌드 스크립트");
  console.log("================================\n");

  if (dryRun) console.log("🔍 [DRY RUN 모드]\n");

  try {
    // MongoDB 연결
    console.log("🔌 MongoDB 연결 중...");
    await mongoose.connect(process.env.MONGO_URI as string);
    console.log("✅ MongoDB 연결 성공\n");

    // 모든 버전 가져오기
    console.log("📥 버전 목록 가져오는 중...");
    const allVersions = await getAllVersions();
    const latestVersion = allVersions[0];

    const targetTo = TO_VERSION || latestVersion;
    const versions = filterVersions(allVersions, FROM_VERSION, targetTo);

    console.log(`📌 시작 버전: ${FROM_VERSION}`);
    console.log(`📌 종료 버전: ${targetTo}`);
    console.log(`📊 처리할 버전: ${versions.length}개\n`);

    if (versions.length === 0) {
      console.log("❌ 처리할 버전이 없습니다.");
      return;
    }

    // 통계
    let totalHistoryCount = 0;
    let totalChangedChampions = 0;
    const versionStats: { version: string; changes: number }[] = [];

    // 이전 버전 데이터 캐시
    let prevVersionData: Map<string, ChampionData> = new Map();

    // 각 버전 처리
    for (let vIdx = 0; vIdx < versions.length; vIdx++) {
      const version = versions[vIdx];
      const prevVersion = vIdx > 0 ? versions[vIdx - 1] : null;

      console.log(
        `\n📦 [${vIdx + 1}/${versions.length}] 버전 ${version} 처리 중...`
      );

      // 챔피언 목록 가져오기
      const championList = await fetchChampionList(version);
      if (!championList) {
        console.log(`   ⚠️ 버전 ${version} 데이터 없음, 건너뜀`);
        continue;
      }

      const championIds = Object.keys(championList);
      let versionChangeCount = 0;

      // 현재 버전 데이터 캐시
      const currentVersionData: Map<string, ChampionData> = new Map();

      // 각 챔피언 처리
      for (const championId of championIds) {
        const champData = await fetchChampionDetail(version, championId);
        if (!champData) continue;

        currentVersionData.set(championId, champData);

        // 이전 버전 데이터가 있으면 비교
        const prevData = prevVersionData.get(championId);

        if (prevData && prevVersion) {
          const spellChanges = detectSpellChanges(prevData, champData);
          const statChanges = detectStatChanges(
            prevData.stats,
            champData.stats
          );

          if (spellChanges.length > 0 || statChanges.length > 0) {
            versionChangeCount++;

            if (!dryRun) {
              // 이미 존재하는지 확인
              const exists = await ChampionHistory.findOne({
                championId,
                toVersion: version,
              });

              if (!exists) {
                const history = new ChampionHistory({
                  championId,
                  championName: champData.name,
                  fromVersion: prevVersion,
                  toVersion: version,
                  patchDate: new Date(),
                  spellChanges,
                  statChanges,
                  snapshot: {
                    spells: champData.spells,
                    passive: champData.passive,
                    stats: champData.stats,
                  },
                });
                await history.save();
                totalHistoryCount++;
              }
            } else {
              console.log(
                `   📝 ${champData.name}: 스킬 ${spellChanges.length}개, 스탯 ${statChanges.length}개 변경`
              );
              totalHistoryCount++;
            }
          }
        }

        // Rate limit 방지
        await delay(30);
      }

      versionStats.push({ version, changes: versionChangeCount });
      totalChangedChampions += versionChangeCount;

      console.log(`   ✅ ${versionChangeCount}개 챔피언 변경 감지`);

      // 현재 버전 데이터를 이전 버전으로 이동
      prevVersionData = currentVersionData;

      // 버전당 잠깐 대기
      await delay(100);
    }

    // 마지막 버전 데이터로 Champion 컬렉션 업데이트
    if (!dryRun && prevVersionData.size > 0) {
      console.log("\n📤 최신 챔피언 데이터 저장 중...");

      // 기존 데이터 삭제
      await Champion.deleteMany({});

      let savedCount = 0;
      let skipCount = 0;
      for (const [championId, champData] of prevVersionData) {
        // version 필드가 없으면 건너뛰기
        if (!champData.version) {
          console.log(`   ⚠️ ${championId}: version 없음, 건너뜀`);
          skipCount++;
          continue;
        }

        try {
          const championDoc = new Champion({
            version: champData.version,
            championId: champData.id,
            key: champData.key,
            name: champData.name,
            title: champData.title,
            lore: champData.lore,
            blurb: champData.blurb,
            info: champData.info,
            image: champData.image,
            tags: champData.tags,
            partype: champData.partype,
            stats: champData.stats,
            spells: champData.spells,
            passive: champData.passive,
            skins: champData.skins,
            allytips: champData.allytips,
            enemytips: champData.enemytips,
          });
          await championDoc.save();
          savedCount++;
        } catch (err) {
          console.log(
            `   ❌ ${championId} 저장 실패: ${(err as Error).message}`
          );
          skipCount++;
        }
      }
      console.log(`   ✅ ${savedCount}개 챔피언 저장 완료`);
      if (skipCount > 0) {
        console.log(`   ⚠️ ${skipCount}개 챔피언 건너뜀`);
      }
    }

    // 결과 출력
    console.log("\n========== 빌드 완료 ==========");
    console.log(`📊 처리된 버전: ${versions.length}개`);
    console.log(`📜 저장된 히스토리: ${totalHistoryCount}개`);
    console.log(`👥 변경된 챔피언 (총): ${totalChangedChampions}회`);

    // 버전별 변경 수 (상위 10개)
    const topVersions = versionStats
      .filter((v) => v.changes > 0)
      .sort((a, b) => b.changes - a.changes)
      .slice(0, 10);

    if (topVersions.length > 0) {
      console.log("\n🏆 변경이 많았던 버전 (Top 10):");
      topVersions.forEach((v, i) => {
        console.log(`   ${i + 1}. ${v.version}: ${v.changes}개 챔피언`);
      });
    }
  } catch (error) {
    console.error("❌ 빌드 실패:", (error as Error).message);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log("\n🔌 MongoDB 연결 종료");
  }
}

// 실행
buildHistory()
  .then(() => {
    console.log("\n🎉 히스토리 빌드 완료!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 빌드 오류:", error);
    process.exit(1);
  });
