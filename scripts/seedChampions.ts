/**
 * 챔피언 데이터 시드 스크립트
 * Data Dragon에서 챔피언 정보를 가져와 MongoDB에 저장합니다.
 * 각 챔피언의 상세 정보(스킬, 패시브, 스킨)도 함께 저장합니다.
 *
 * 실행: npx tsx scripts/seedChampions.ts
 */

import mongoose from "mongoose";
import dotenv from "dotenv";

// 환경 변수 로드
dotenv.config({ path: ".env.development" });

import Champion from "../src/models/champion.model";

const DDRAGON_VERSION = "15.24.1";
const DDRAGON_BASE_URL = `https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VERSION}/data/ko_KR`;
const CHAMPION_LIST_URL = `${DDRAGON_BASE_URL}/champion.json`;

const getChampionDetailUrl = (championId: string) =>
  `${DDRAGON_BASE_URL}/champion/${championId}.json`;

// 기본 챔피언 목록 타입
interface DDragonChampionBasic {
  id: string;
  key: string;
  name: string;
}

// 상세 챔피언 타입
interface DDragonChampionDetail {
  version: string;
  id: string;
  key: string;
  name: string;
  title: string;
  lore: string;
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
    leveltip: {
      label: string[];
      effect: string[];
    };
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

interface DDragonListResponse {
  data: Record<string, DDragonChampionBasic>;
}

interface DDragonDetailResponse {
  version: string;
  data: Record<string, DDragonChampionDetail>;
}

interface ChampionDetailResult {
  version: string;
  champion: DDragonChampionDetail;
}

// 딜레이 함수 (Rate Limit 방지)
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchChampionList(): Promise<string[]> {
  console.log("📥 챔피언 목록 가져오는 중...");
  const response = await fetch(CHAMPION_LIST_URL);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  const data: DDragonListResponse = await response.json();
  return Object.keys(data.data);
}

async function fetchChampionDetail(
  championId: string
): Promise<ChampionDetailResult> {
  const response = await fetch(getChampionDetailUrl(championId));
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  const data: DDragonDetailResponse = await response.json();
  return {
    version: data.version,
    champion: data.data[championId],
  };
}

async function seedChampions(): Promise<void> {
  try {
    // MongoDB 연결
    console.log("🔌 MongoDB 연결 중...");
    await mongoose.connect(process.env.MONGO_URI as string);
    console.log("✅ MongoDB 연결 성공\n");

    // 챔피언 목록 가져오기
    const championIds = await fetchChampionList();
    console.log(`📊 총 ${championIds.length}개의 챔피언 발견\n`);

    // 기존 데이터 삭제
    const existingCount = await Champion.countDocuments();
    if (existingCount > 0) {
      console.log(`🗑️  기존 ${existingCount}개의 챔피언 데이터 삭제 중...`);
      await Champion.deleteMany({});
    }

    // 개별 챔피언 저장
    let savedCount = 0;
    let errorCount = 0;

    console.log("📥 각 챔피언 상세 정보 가져오는 중...\n");

    for (const championId of championIds) {
      try {
        // 상세 정보 가져오기
        const { version, champion: champ } = await fetchChampionDetail(
          championId
        );

        const championDoc = new Champion({
          version: version,
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
        });

        await championDoc.save();
        savedCount++;

        // 진행 상황 표시
        console.log(
          `💾 [${savedCount}/${championIds.length}] ${champ.name} 저장 완료`
        );

        // Rate Limit 방지 (50ms 딜레이)
        await delay(50);
      } catch (error) {
        errorCount++;
        console.error(`❌ ${championId} 저장 실패:`, (error as Error).message);
      }
    }

    console.log("\n========== 시드 완료 ==========");
    console.log(`✅ 성공: ${savedCount}개`);
    console.log(`❌ 실패: ${errorCount}개`);
    console.log(`📊 총 챔피언: ${championIds.length}개`);
  } catch (error) {
    console.error("❌ 시드 실패:", (error as Error).message);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log("🔌 MongoDB 연결 종료");
  }
}

// 실행
seedChampions()
  .then(() => {
    console.log("🎉 시드 스크립트 완료!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 시드 스크립트 오류:", error);
    process.exit(1);
  });
