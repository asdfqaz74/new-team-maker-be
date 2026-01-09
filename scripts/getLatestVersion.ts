/**
 * DDragon 최신 버전 확인 및 DB 저장 스크립트
 * Data Dragon API에서 최신 버전을 가져와 Init 컬렉션에 저장합니다.
 *
 * 실행: npx tsx scripts/getLatestVersion.ts
 */

import mongoose from "mongoose";
import dotenv from "dotenv";

// 환경 변수 로드
dotenv.config({ path: ".env.development" });

import Init from "../src/models/init.model";

// 최신 버전 자동 감지 URL
const VERSIONS_URL = "https://ddragon.leagueoflegends.com/api/versions.json";

/**
 * DDragon API에서 최신 버전 가져오기
 */
async function fetchLatestVersion(): Promise<string> {
  console.log("🔍 DDragon API에서 최신 버전 확인 중...");
  const response = await fetch(VERSIONS_URL);

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const versions: string[] = await response.json();
  return versions[0]; // 첫 번째가 최신 버전
}

/**
 * DB에서 현재 저장된 버전 가져오기
 */
async function getCurrentVersion(): Promise<string | null> {
  const result = await Init.findOne()
    .sort({ createdAt: -1 })
    .select({ version: 1 });

  return result?.version || null;
}

/**
 * 최신 버전을 DB에 저장
 */
async function saveVersion(version: string): Promise<void> {
  const newInit = new Init({ version });
  await newInit.save();
  console.log(`✅ 버전 ${version} 저장 완료`);
}

/**
 * 메인 실행 함수
 */
async function main(): Promise<void> {
  try {
    // MongoDB 연결
    console.log("🔌 MongoDB 연결 중...");
    await mongoose.connect(process.env.MONGO_URI as string);
    console.log("✅ MongoDB 연결 성공\n");

    // 현재 DB 버전 확인
    const currentVersion = await getCurrentVersion();
    console.log(`📌 현재 DB 버전: ${currentVersion || "없음"}`);

    // 최신 버전 가져오기
    const latestVersion = await fetchLatestVersion();
    console.log(`📌 최신 DDragon 버전: ${latestVersion}\n`);

    // 버전 비교 및 저장
    if (currentVersion === latestVersion) {
      console.log("✨ 이미 최신 버전입니다!");
    } else {
      console.log(
        `🔄 버전 업데이트: ${currentVersion || "없음"} → ${latestVersion}`
      );
      await saveVersion(latestVersion);
      console.log("🎉 버전 업데이트 완료!");
    }
  } catch (error) {
    console.error("❌ 스크립트 실행 실패:", (error as Error).message);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log("\n🔌 MongoDB 연결 종료");
  }
}

// 실행
console.log("🎮 DDragon 최신 버전 확인 스크립트");
console.log("================================\n");

main()
  .then(() => {
    console.log("\n✅ 스크립트 완료!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 스크립트 오류:", error);
    process.exit(1);
  });
