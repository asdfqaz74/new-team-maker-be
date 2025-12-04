/**
 * 챔피언 데이터 업데이트 스크립트
 * Data Dragon에서 최신 챔피언 정보를 가져와 MongoDB를 업데이트합니다.
 * - 새로운 챔피언: 추가 (스킬, 패시브, 스킨 포함)
 * - 기존 챔피언: 버전/스탯 변경 시 업데이트 + 히스토리 저장
 * - 삭제된 챔피언: 유지 (수동 삭제 필요)
 *
 * 실행: npx tsx scripts/updateChampions.ts
 * 옵션:
 *   --force: 버전 상관없이 전체 업데이트
 *   --dry-run: 실제 저장 없이 변경사항만 확인
 *   --no-history: 히스토리 저장 안 함
 */

import mongoose from "mongoose";
import dotenv from "dotenv";

// 환경 변수 로드
dotenv.config({ path: ".env.development" });

import Champion, { IChampion, ISpell } from "../src/models/champion.model";
import ChampionHistory, {
  ISpellChange,
  IStatChange,
} from "../src/models/championHistory.model";

// 최신 버전 자동 감지 URL
const VERSIONS_URL = "https://ddragon.leagueoflegends.com/api/versions.json";

const getChampionListUrl = (version: string) =>
  `https://ddragon.leagueoflegends.com/cdn/${version}/data/ko_KR/champion.json`;

const getChampionDetailUrl = (version: string, championId: string) =>
  `https://ddragon.leagueoflegends.com/cdn/${version}/data/ko_KR/champion/${championId}.json`;

// 기본 챔피언 정보 (목록용)
interface DDragonChampionBasic {
  version: string;
  id: string;
  key: string;
  name: string;
}

// 상세 챔피언 정보
interface DDragonChampionDetail {
  version: string;
  id: string;
  key: string;
  name: string;
  title: string;
  lore: string;
  blurb: string;
  info: {
    attack: number;
    defense: number;
    magic: number;
    difficulty: number;
  };
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

interface DDragonListResponse {
  data: Record<string, DDragonChampionBasic>;
}

interface DDragonDetailResponse {
  data: Record<string, DDragonChampionDetail>;
}

interface UpdateResult {
  added: string[];
  updated: string[];
  unchanged: string[];
  errors: string[];
  historyCount: number;
}

// CLI 옵션 파싱
const args = process.argv.slice(2);
const forceUpdate = args.includes("--force");
const dryRun = args.includes("--dry-run");
const noHistory = args.includes("--no-history");

// 딜레이 함수
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// 스킬 키 매핑
const SPELL_KEYS: ("Q" | "W" | "E" | "R")[] = ["Q", "W", "E", "R"];

/**
 * 스킬 변경사항 감지
 */
function detectSpellChanges(
  oldSpells: ISpell[],
  newSpells: DDragonChampionDetail["spells"],
  oldPassive: IChampion["passive"],
  newPassive: DDragonChampionDetail["passive"]
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
    const oldSpell = oldSpells[i];
    const newSpell = newSpells[i];

    if (!oldSpell || !newSpell) continue;

    const hasTooltipChange = oldSpell.tooltip !== newSpell.tooltip;
    const hasCooldownChange =
      JSON.stringify(oldSpell.cooldown) !== JSON.stringify(newSpell.cooldown);
    const hasCostChange =
      JSON.stringify(oldSpell.cost) !== JSON.stringify(newSpell.cost);
    const hasEffectChange =
      JSON.stringify(oldSpell.effect) !== JSON.stringify(newSpell.effect);

    if (
      hasTooltipChange ||
      hasCooldownChange ||
      hasCostChange ||
      hasEffectChange
    ) {
      // 변경 타입 결정 (간단한 휴리스틱)
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
        },
        after: {
          tooltip: newSpell.tooltip,
          cooldown: newSpell.cooldown,
          cost: newSpell.cost,
          effect: newSpell.effect,
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
  oldStats: IChampion["stats"],
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
  ];

  for (const stat of statsToTrack) {
    const oldVal = oldStats[stat as keyof typeof oldStats] as number;
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

async function getLatestVersion(): Promise<string> {
  console.log("🔍 최신 버전 확인 중...");
  const response = await fetch(VERSIONS_URL);
  const versions: string[] = await response.json();
  return versions[0];
}

async function fetchChampionList(
  version: string
): Promise<Record<string, DDragonChampionBasic>> {
  console.log(`📥 Data Dragon v${version}에서 챔피언 목록 가져오는 중...`);
  const response = await fetch(getChampionListUrl(version));
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  const data: DDragonListResponse = await response.json();
  return data.data;
}

async function fetchChampionDetail(
  version: string,
  championId: string
): Promise<DDragonChampionDetail> {
  const response = await fetch(getChampionDetailUrl(version, championId));
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  const data: DDragonDetailResponse = await response.json();
  return data.data[championId];
}

function hasChanges(
  existing: IChampion,
  newData: DDragonChampionBasic
): boolean {
  // 버전이 다르면 변경된 것
  if (existing.version !== newData.version) return true;
  return false;
}

async function updateChampions(): Promise<void> {
  const result: UpdateResult = {
    added: [],
    updated: [],
    unchanged: [],
    errors: [],
    historyCount: 0,
  };

  try {
    // MongoDB 연결
    console.log("🔌 MongoDB 연결 중...");
    await mongoose.connect(process.env.MONGO_URI as string);
    console.log("✅ MongoDB 연결 성공\n");

    // 최신 버전 확인
    const latestVersion = await getLatestVersion();
    console.log(`📌 최신 DDragon 버전: ${latestVersion}`);

    // 현재 DB 버전 확인
    const existingChamp = await Champion.findOne().sort({ updatedAt: -1 });
    const currentVersion = existingChamp?.version || "없음";
    console.log(`📌 현재 DB 버전: ${currentVersion}\n`);

    if (currentVersion === latestVersion && !forceUpdate) {
      console.log("✨ 이미 최신 버전입니다!");
      console.log("💡 강제 업데이트: --force 옵션 사용");
      return;
    }

    // 챔피언 목록 가져오기
    const championList = await fetchChampionList(latestVersion);
    const championIds = Object.keys(championList);

    console.log(`📊 총 ${championIds.length}개의 챔피언 처리 중...`);
    if (dryRun) {
      console.log("🔍 [DRY RUN] 실제 저장 없이 변경사항만 확인합니다.\n");
    }

    // 기존 챔피언 맵 생성
    const existingChampions = await Champion.find();
    const championMap = new Map<string, IChampion>();
    existingChampions.forEach((c) => championMap.set(c.championId, c));

    // 각 챔피언 처리
    for (const championId of championIds) {
      try {
        const basicInfo = championList[championId];
        const existing = championMap.get(championId);

        if (!existing) {
          // 새로운 챔피언 - 상세 정보 가져오기
          const champ = await fetchChampionDetail(latestVersion, championId);

          if (!dryRun) {
            const newChampion = new Champion({
              version: champ.version,
              championId: champ.id,
              key: champ.key,
              name: champ.name,
              title: champ.title,
              lore: champ.lore,
              blurb: champ.blurb,
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
            });
            await newChampion.save();
          }
          result.added.push(`${basicInfo.name} (${championId})`);
          console.log(`🆕 ${basicInfo.name} 추가`);
          await delay(50);
        } else if (hasChanges(existing, basicInfo) || forceUpdate) {
          // 변경된 챔피언 - 상세 정보 가져와서 업데이트
          const champ = await fetchChampionDetail(latestVersion, championId);

          if (!dryRun) {
            await Champion.updateOne(
              { championId: champ.id },
              {
                $set: {
                  version: champ.version,
                  key: champ.key,
                  name: champ.name,
                  title: champ.title,
                  lore: champ.lore,
                  blurb: champ.blurb,
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
                },
              }
            );

            // 히스토리 저장
            if (!noHistory) {
              const spellChanges = detectSpellChanges(
                existing.spells,
                champ.spells,
                existing.passive,
                champ.passive
              );
              const statChanges = detectStatChanges(
                existing.stats,
                champ.stats
              );

              if (spellChanges.length > 0 || statChanges.length > 0) {
                const history = new ChampionHistory({
                  championId: champ.id,
                  championName: champ.name,
                  fromVersion: existing.version,
                  toVersion: champ.version,
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
                result.historyCount++;
              }
            }
          }
          result.updated.push(`${basicInfo.name} (${championId})`);
          console.log(`🔄 ${basicInfo.name} 업데이트`);
          await delay(50);
        } else {
          // 변경 없음
          result.unchanged.push(championId);
        }
      } catch (error) {
        result.errors.push(`${championId}: ${(error as Error).message}`);
        console.error(`❌ ${championId} 실패: ${(error as Error).message}`);
      }
    }

    // 결과 출력
    console.log("\n========== 업데이트 결과 ==========");
    if (dryRun) {
      console.log("🔍 [DRY RUN 모드]\n");
    }

    if (result.added.length > 0) {
      console.log(`\n🆕 새로운 챔피언 (${result.added.length}개):`);
      result.added.forEach((name) => console.log(`   + ${name}`));
    }

    if (result.updated.length > 0) {
      console.log(`\n🔄 업데이트된 챔피언 (${result.updated.length}개):`);
      result.updated.forEach((name) => console.log(`   ~ ${name}`));
    }

    if (result.historyCount > 0) {
      console.log(`\n📜 히스토리 저장: ${result.historyCount}개`);
    }

    if (result.errors.length > 0) {
      console.log(`\n❌ 오류 (${result.errors.length}개):`);
      result.errors.forEach((err) => console.log(`   ! ${err}`));
    }

    console.log(`\n📊 요약:`);
    console.log(`   추가: ${result.added.length}개`);
    console.log(`   업데이트: ${result.updated.length}개`);
    console.log(`   히스토리: ${result.historyCount}개`);
    console.log(`   변경없음: ${result.unchanged.length}개`);
    console.log(`   오류: ${result.errors.length}개`);
  } catch (error) {
    console.error("❌ 업데이트 실패:", (error as Error).message);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log("\n🔌 MongoDB 연결 종료");
  }
}

// 실행
console.log("🎮 챔피언 데이터 업데이트 스크립트");
console.log("================================\n");

if (forceUpdate) console.log("⚡ 강제 업데이트 모드");
if (dryRun) console.log("🔍 Dry Run 모드");
console.log("");

updateChampions()
  .then(() => {
    console.log("\n🎉 업데이트 스크립트 완료!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 업데이트 스크립트 오류:", error);
    process.exit(1);
  });
