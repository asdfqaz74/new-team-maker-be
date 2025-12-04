/**
 * 챔피언 동기화 스크립트
 * 최신 버전을 자동으로 가져와서 챔피언 데이터 업데이트 + 히스토리 기록을 한번에 처리합니다.
 *
 * 실행: npx tsx scripts/syncChampions.ts
 * 옵션:
 *   --dry-run     : 실제 저장 없이 확인만
 *   --force       : 변경사항 없어도 강제 업데이트
 *   --skip-history: 히스토리 기록 건너뛰기
 */

import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config({ path: ".env.development" });

import Champion from "../src/models/champion.model";
import ChampionHistory, {
  ISpellChange,
  IStatChange,
} from "../src/models/championHistory.model";

// API URLs
const VERSIONS_URL = "https://ddragon.leagueoflegends.com/api/versions.json";

const getChampionListUrl = (version: string) =>
  `https://ddragon.leagueoflegends.com/cdn/${version}/data/ko_KR/champion.json`;

const getChampionDetailUrl = (version: string, championId: string) =>
  `https://ddragon.leagueoflegends.com/cdn/${version}/data/ko_KR/champion/${championId}.json`;

// 타입 정의
interface ChampionData {
  id: string;
  key: string;
  name: string;
  title: string;
  lore: string;
  info: Record<string, number>;
  image: {
    full: string;
    sprite: string;
    group: string;
    x: number;
    y: number;
    w: number;
    h: number;
  };
  tags: string[];
  partype: string;
  stats: Record<string, number>;
  spells: {
    id: string;
    name: string;
    description: string;
    tooltip: string;
    leveltip: { label: string[]; effect: string[] };
    maxrank: number;
    cooldown: number[];
    cooldownBurn: string;
    cost: number[];
    costBurn: string;
    effect: (number[] | null)[];
    effectBurn: (string | null)[];
    costType: string;
    maxammo: string;
    range: number[];
    rangeBurn: string;
    image: {
      full: string;
      sprite: string;
      group: string;
      x: number;
      y: number;
      w: number;
      h: number;
    };
    resource: string;
  }[];
  passive: {
    name: string;
    description: string;
    image: {
      full: string;
      sprite: string;
      group: string;
      x: number;
      y: number;
      w: number;
      h: number;
    };
  };
  skins: {
    id: string;
    num: number;
    name: string;
    chromas: boolean;
  }[];
  allytips: string[];
  enemytips: string[];
}

interface ChampionDetailResponse {
  version: string;
  data: Record<string, ChampionData>;
}

// CLI 옵션
const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const force = args.includes("--force");
const skipHistory = args.includes("--skip-history");

// 유틸리티
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const SPELL_KEYS: ("Q" | "W" | "E" | "R")[] = ["Q", "W", "E", "R"];

/**
 * 최신 버전 가져오기
 */
async function getLatestVersion(): Promise<string> {
  const response = await fetch(VERSIONS_URL);
  const versions: string[] = await response.json();
  // 정식 패치 버전만 (lolpatch_ 등 제외)
  const validVersions = versions.filter((v) => /^\d+\.\d+\.\d+$/.test(v));
  return validVersions[0];
}

/**
 * 현재 DB에 저장된 버전 확인
 */
async function getCurrentDbVersion(): Promise<string | null> {
  const champ = await Champion.findOne().sort({ version: -1 });
  return champ?.version || null;
}

/**
 * 챔피언 목록 가져오기
 */
async function fetchChampionList(version: string): Promise<string[]> {
  const response = await fetch(getChampionListUrl(version));
  if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
  const data = await response.json();
  return Object.keys(data.data);
}

/**
 * 챔피언 상세 정보 가져오기
 */
async function fetchChampionDetail(
  version: string,
  championId: string
): Promise<{ version: string; champion: ChampionData }> {
  const response = await fetch(getChampionDetailUrl(version, championId));
  if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
  const data: ChampionDetailResponse = await response.json();
  return {
    version: data.version,
    champion: data.data[championId],
  };
}

/**
 * 스킬 변경사항 감지
 */
function detectSpellChanges(
  oldSpells: ChampionData["spells"],
  newSpells: ChampionData["spells"],
  oldPassive: ChampionData["passive"],
  newPassive: ChampionData["passive"]
): ISpellChange[] {
  const changes: ISpellChange[] = [];

  // 패시브 비교
  if (oldPassive && newPassive) {
    if (
      oldPassive.description !== newPassive.description ||
      oldPassive.name !== newPassive.name
    ) {
      changes.push({
        spellKey: "P",
        spellId: "passive",
        spellName: newPassive.name,
        changeType: "adjust",
        before: { description: oldPassive.description },
        after: { description: newPassive.description },
      });
    }
  }

  // Q, W, E, R 비교
  for (let i = 0; i < 4; i++) {
    const oldSpell = oldSpells?.[i];
    const newSpell = newSpells?.[i];

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
          oldSpell.cooldown.reduce((a, b) => a + b, 0) /
          oldSpell.cooldown.length;
        const avgNew =
          newSpell.cooldown.reduce((a, b) => a + b, 0) /
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
 * 메인 동기화 함수
 */
async function syncChampions(): Promise<void> {
  console.log("🎮 챔피언 동기화 스크립트");
  console.log("========================\n");

  if (dryRun) console.log("🔍 [DRY RUN 모드]\n");
  if (force) console.log("💪 [FORCE 모드]\n");
  if (skipHistory) console.log("⏭️  [히스토리 건너뛰기]\n");

  try {
    // MongoDB 연결
    console.log("🔌 MongoDB 연결 중...");
    await mongoose.connect(process.env.MONGO_URI as string);
    console.log("✅ MongoDB 연결 성공\n");

    // 버전 확인
    console.log("📥 버전 정보 확인 중...");
    const latestVersion = await getLatestVersion();
    const currentDbVersion = await getCurrentDbVersion();

    console.log(`   📌 최신 DDragon 버전: ${latestVersion}`);
    console.log(`   📌 현재 DB 버전: ${currentDbVersion || "없음"}\n`);

    // 업데이트 필요 여부 확인
    if (currentDbVersion === latestVersion && !force) {
      console.log("✅ 이미 최신 버전입니다. 업데이트가 필요하지 않습니다.");
      console.log("   (강제 업데이트: --force 옵션 사용)");
      await mongoose.disconnect();
      return;
    }

    // 챔피언 목록 가져오기
    console.log("📥 챔피언 목록 가져오는 중...");
    const championIds = await fetchChampionList(latestVersion);
    console.log(`   📊 총 ${championIds.length}개의 챔피언\n`);

    // 통계
    let updatedCount = 0;
    let newCount = 0;
    let historyCount = 0;
    let errorCount = 0;

    console.log("🔄 챔피언 데이터 동기화 중...\n");

    for (let i = 0; i < championIds.length; i++) {
      const championId = championIds[i];

      try {
        // 상세 정보 가져오기
        const { version, champion: champ } = await fetchChampionDetail(
          latestVersion,
          championId
        );

        // 기존 데이터 확인
        const existingChamp = await Champion.findOne({ championId });

        // 히스토리 기록 (기존 데이터가 있고, 히스토리 건너뛰기가 아닌 경우)
        if (
          existingChamp &&
          !skipHistory &&
          existingChamp.version !== version
        ) {
          const spellChanges = detectSpellChanges(
            existingChamp.spells as unknown as ChampionData["spells"],
            champ.spells,
            existingChamp.passive as unknown as ChampionData["passive"],
            champ.passive
          );
          const statChanges = detectStatChanges(
            existingChamp.stats as unknown as Record<string, number>,
            champ.stats
          );

          if (spellChanges.length > 0 || statChanges.length > 0) {
            if (!dryRun) {
              // 이미 존재하는지 확인
              const historyExists = await ChampionHistory.findOne({
                championId,
                toVersion: version,
              });

              if (!historyExists) {
                const history = new ChampionHistory({
                  championId,
                  championName: champ.name,
                  fromVersion: existingChamp.version,
                  toVersion: version,
                  patchDate: new Date(),
                  spellChanges,
                  statChanges,
                  snapshot: {
                    spells: champ.spells,
                    passive: champ.passive,
                    stats: champ.stats,
                  },
                });
                await history.save();
                historyCount++;
              }
            } else {
              console.log(
                `   📝 ${champ.name}: 스킬 ${spellChanges.length}개, 스탯 ${statChanges.length}개 변경 감지`
              );
              historyCount++;
            }
          }
        }

        // 챔피언 데이터 업데이트/생성
        const championData = {
          version,
          championId: champ.id,
          key: champ.key,
          name: champ.name,
          title: champ.title,
          lore: champ.lore,
          info: champ.info,
          image: champ.image,
          tags: champ.tags,
          partype: champ.partype,
          stats: champ.stats,
          spells: champ.spells,
          passive: champ.passive,
          skins: champ.skins,
          allytips: champ.allytips,
          enemytips: champ.enemytips,
        };

        if (!dryRun) {
          if (existingChamp) {
            await Champion.updateOne({ championId }, championData);
            updatedCount++;
          } else {
            await new Champion(championData).save();
            newCount++;
          }
        } else {
          if (existingChamp) {
            updatedCount++;
          } else {
            newCount++;
          }
        }

        // 진행 상황 표시
        const progress = Math.round(((i + 1) / championIds.length) * 100);
        process.stdout.write(
          `\r   💾 진행: ${i + 1}/${championIds.length} (${progress}%) - ${
            champ.name
          }`
        );

        // Rate limit 방지
        if ((i + 1) % 10 === 0) {
          await delay(100);
        }
      } catch (error) {
        errorCount++;
        console.error(`\n   ❌ ${championId} 처리 실패:`, error);
      }
    }

    console.log("\n");

    // 결과 출력
    console.log("=".repeat(40));
    console.log("📊 동기화 결과");
    console.log("=".repeat(40));
    console.log(`   📌 버전: ${currentDbVersion || "없음"} → ${latestVersion}`);
    console.log(`   ✨ 신규 챔피언: ${newCount}개`);
    console.log(`   🔄 업데이트: ${updatedCount}개`);
    console.log(`   📝 히스토리 기록: ${historyCount}개`);
    if (errorCount > 0) {
      console.log(`   ❌ 오류: ${errorCount}개`);
    }
    console.log("=".repeat(40));

    if (dryRun) {
      console.log("\n⚠️  DRY RUN 모드로 실행되어 실제 저장되지 않았습니다.");
      console.log("   실제 저장하려면 --dry-run 옵션을 제거하세요.");
    }
  } catch (error) {
    console.error("❌ 오류 발생:", error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log("\n🔌 MongoDB 연결 해제");
  }
}

// 실행
syncChampions()
  .then(() => {
    console.log("\n✅ 동기화 완료!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ 동기화 실패:", error);
    process.exit(1);
  });
