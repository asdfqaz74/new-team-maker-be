import fs from "fs";
import path from "path";
import {
  getItemName,
  getSummonerSpellName,
  getRuneStyleName,
  getRuneName,
} from "./ddragon/ddragonMapper";

// ============================================
// Types
// ============================================

// Raw metadata from rofl file
interface RawRoflMetadata {
  gameLength: number;
  gameVersion: string;
  lastGameChunkId: number;
  lastKeyFrameId: number;
  statsJson?: string;
  [key: string]: unknown;
}

// 정제된 메타데이터 (필요한 것만)
export interface GameMetadata {
  gameLength: number; // 밀리초 단위
  gameDuration: number; // 초 단위로 변환
  winTeam: "BLUE" | "RED";
  playTime: number; // 초 단위
}

export interface RawPlayerStats {
  CHAMPIONS_KILLED: string;
  NUM_DEATHS: string;
  ASSISTS: string;
  DOUBLE_KILLS: string;
  TRIPLE_KILLS: string;
  QUADRA_KILLS: string;
  PENTA_KILLS: string;
  GOLD_EARNED: string;
  ITEM0: string;
  ITEM1: string;
  ITEM2: string;
  ITEM3: string;
  ITEM4: string;
  ITEM5: string;
  ITEM6: string;
  LEVEL: string;
  MAGIC_DAMAGE_DEALT_PLAYER: string;
  MAGIC_DAMAGE_DEALT_TO_CHAMPIONS: string;
  MAGIC_DAMAGE_TAKEN: string;
  PHYSICAL_DAMAGE_DEALT_PLAYER: string;
  PHYSICAL_DAMAGE_DEALT_TO_CHAMPIONS: string;
  PHYSICAL_DAMAGE_TAKEN: string;
  TRUE_DAMAGE_DEALT_PLAYER: string;
  TRUE_DAMAGE_DEALT_TO_CHAMPIONS: string;
  TRUE_DAMAGE_TAKEN: string;
  TOTAL_DAMAGE_DEALT: string;
  TOTAL_DAMAGE_DEALT_TO_CHAMPIONS: string;
  TOTAL_DAMAGE_TAKEN: string;
  Missions_CreepScore: string;
  VISION_SCORE: string;
  VISION_WARDS_BOUGHT_IN_GAME: string;
  WARD_KILLED: string;
  WARD_PLACED: string;
  PERK0: string;
  PERK1: string;
  PERK2: string;
  PERK3: string;
  PERK4: string;
  PERK5: string;
  STAT_PERK_0: string;
  STAT_PERK_1: string;
  STAT_PERK_2: string;
  PERK_PRIMARY_STYLE: string;
  PERK_SUB_STYLE: string;
  SUMMONER_SPELL_1: string;
  SUMMONER_SPELL_2: string;
  RIOT_ID_GAME_NAME: string;
  RIOT_ID_TAG_LINE: string;
  SKIN: string;
  TEAM: string;
  TEAM_POSITION: string;
  TIME_PLAYED: string;
  WIN: string;
  [key: string]: unknown;
}

// ID + 한글 이름을 함께 담는 타입
export interface MappedValue {
  id: string;
  name: string | null;
}

// 변환된 플레이어 스탯 타입
export interface PlayerStats {
  // KDA
  kills: string;
  deaths: string;
  assists: string;

  // KILL_EVENT
  doubleKills: string;
  tripleKills: string;
  quadraKills: string;
  pentaKills: string;

  // ITEM
  goldEarned: string;
  items: MappedValue[];

  // STATS
  level: string;
  magicDamageDealt: string;
  magicDamageToChampions: string;
  magicDamageTaken: string;
  physicalDamageDealt: string;
  physicalDamageToChampions: string;
  physicalDamageTaken: string;
  trueDamageDealt: string;
  trueDamageToChampions: string;
  trueDamageTaken: string;
  totalDamageDealt: string;
  totalDamageToChampions: string;
  totalDamageTaken: string;
  creepScore: string;

  // WARD
  visionScore: string;
  controlWardsBought: string;
  wardsKilled: string;
  wardsPlaced: string;

  // PERK (계층적 구조)
  perks: {
    primaryStyle: {
      style: MappedValue;
      keystone: MappedValue;
      slots: MappedValue[];
    };
    subStyle: {
      style: MappedValue;
      slots: MappedValue[];
    };
    statPerks: string[];
  };

  // SUMMONER_SPELL
  summonerSpells: MappedValue[];

  // GAME_INFO
  riotIdGameName: string;
  riotIdTagLine: string;
  champion: string;
  team: "BLUE" | "RED";
  position: string;
  win: boolean;
}

export interface ParsedRoflData {
  metadata: GameMetadata;
  stats: PlayerStats[] | null;
}

// ============================================
// Helper Functions
// ============================================

/**
 * 팀 코드를 팀 이름으로 변환
 */
const convertTeam = (team: string): "BLUE" | "RED" => {
  return team === "100" ? "BLUE" : "RED";
};

/**
 * 승리 여부 변환
 */
const convertWin = (win: string): boolean => {
  return win === "Win";
};

/**
 * ID와 한글 이름을 함께 반환하는 헬퍼
 */
const mapItem = (id: string): MappedValue => ({
  id,
  name: getItemName(id),
});

const mapSummonerSpell = (id: string): MappedValue => ({
  id,
  name: getSummonerSpellName(id),
});

const mapRuneStyle = (id: string): MappedValue => ({
  id,
  name: getRuneStyleName(parseInt(id, 10)),
});

const mapRune = (id: string): MappedValue => ({
  id,
  name: getRuneName(parseInt(id, 10)),
});

/**
 * Raw 스탯을 정제된 PlayerStats로 변환
 */
const transformPlayerStats = (raw: RawPlayerStats): PlayerStats => {
  return {
    // KDA
    kills: raw.CHAMPIONS_KILLED || "0",
    deaths: raw.NUM_DEATHS || "0",
    assists: raw.ASSISTS || "0",

    // KILL_EVENT
    doubleKills: raw.DOUBLE_KILLS || "0",
    tripleKills: raw.TRIPLE_KILLS || "0",
    quadraKills: raw.QUADRA_KILLS || "0",
    pentaKills: raw.PENTA_KILLS || "0",

    // ITEM
    goldEarned: raw.GOLD_EARNED || "0",
    items: [
      mapItem(raw.ITEM0 || "0"),
      mapItem(raw.ITEM1 || "0"),
      mapItem(raw.ITEM2 || "0"),
      mapItem(raw.ITEM3 || "0"),
      mapItem(raw.ITEM4 || "0"),
      mapItem(raw.ITEM5 || "0"),
      mapItem(raw.ITEM6 || "0"),
    ],

    // STATS
    level: raw.LEVEL || "0",
    magicDamageDealt: raw.MAGIC_DAMAGE_DEALT_PLAYER || "0",
    magicDamageToChampions: raw.MAGIC_DAMAGE_DEALT_TO_CHAMPIONS || "0",
    magicDamageTaken: raw.MAGIC_DAMAGE_TAKEN || "0",
    physicalDamageDealt: raw.PHYSICAL_DAMAGE_DEALT_PLAYER || "0",
    physicalDamageToChampions: raw.PHYSICAL_DAMAGE_DEALT_TO_CHAMPIONS || "0",
    physicalDamageTaken: raw.PHYSICAL_DAMAGE_TAKEN || "0",
    trueDamageDealt: raw.TRUE_DAMAGE_DEALT_PLAYER || "0",
    trueDamageToChampions: raw.TRUE_DAMAGE_DEALT_TO_CHAMPIONS || "0",
    trueDamageTaken: raw.TRUE_DAMAGE_TAKEN || "0",
    totalDamageDealt: raw.TOTAL_DAMAGE_DEALT || "0",
    totalDamageToChampions: raw.TOTAL_DAMAGE_DEALT_TO_CHAMPIONS || "0",
    totalDamageTaken: raw.TOTAL_DAMAGE_TAKEN || "0",
    creepScore: raw.Missions_CreepScore || "0",

    // WARD
    visionScore: raw.VISION_SCORE || "0",
    controlWardsBought: raw.VISION_WARDS_BOUGHT_IN_GAME || "0",
    wardsKilled: raw.WARD_KILLED || "0",
    wardsPlaced: raw.WARD_PLACED || "0",

    // PERK (계층적 구조)
    perks: {
      primaryStyle: {
        style: mapRuneStyle(raw.PERK_PRIMARY_STYLE || "0"),
        keystone: mapRune(raw.PERK0 || "0"),
        slots: [
          mapRune(raw.PERK1 || "0"),
          mapRune(raw.PERK2 || "0"),
          mapRune(raw.PERK3 || "0"),
        ],
      },
      subStyle: {
        style: mapRuneStyle(raw.PERK_SUB_STYLE || "0"),
        slots: [mapRune(raw.PERK4 || "0"), mapRune(raw.PERK5 || "0")],
      },
      statPerks: [
        raw.STAT_PERK_0 || "0",
        raw.STAT_PERK_1 || "0",
        raw.STAT_PERK_2 || "0",
      ],
    },

    // SUMMONER_SPELL
    summonerSpells: [
      mapSummonerSpell(raw.SUMMONER_SPELL_1 || "0"),
      mapSummonerSpell(raw.SUMMONER_SPELL_2 || "0"),
    ],

    // GAME_INFO
    riotIdGameName: raw.RIOT_ID_GAME_NAME || "",
    riotIdTagLine: raw.RIOT_ID_TAG_LINE || "",
    champion: raw.SKIN || "",
    team: convertTeam(raw.TEAM),
    position: raw.TEAM_POSITION || "",
    win: convertWin(raw.WIN),
  };
};

// ============================================
// Parser Functions
// ============================================

/**
 * Buffer에서 Raw 메타데이터를 추출합니다.
 */
const extractRawMetadata = (buffer: Buffer): RawRoflMetadata => {
  const metadataSizeBuffer = buffer.subarray(buffer.length - 4);
  const metadataSize = metadataSizeBuffer.readUInt32LE(0);

  const metadataPosition = buffer.length - metadataSize - 4;
  const rawMetadata = buffer.subarray(metadataPosition, buffer.length - 4);

  return JSON.parse(rawMetadata.toString());
};

/**
 * Raw 메타데이터를 정제된 GameMetadata로 변환합니다.
 */
const transformMetadata = (
  raw: RawRoflMetadata,
  rawStats: RawPlayerStats[] | null
): GameMetadata => {
  // 승리 팀 찾기
  const winner = rawStats?.find((p) => p.WIN === "Win");
  const winTeam = winner ? convertTeam(winner.TEAM) : "BLUE";

  // playTime은 첫 번째 플레이어의 TIME_PLAYED 사용
  const playTime = rawStats?.[0]?.TIME_PLAYED
    ? parseInt(rawStats[0].TIME_PLAYED, 10)
    : 0;

  return {
    gameLength: raw.gameLength,
    gameDuration: Math.floor(raw.gameLength / 1000), // 밀리초 → 초
    winTeam,
    playTime,
  };
};

/**
 * .rofl 파일을 파싱하여 메타데이터와 스탯을 반환합니다.
 */
export const parseRoflFile = (filePath: string): ParsedRoflData => {
  const resolvedPath = path.resolve(filePath);

  if (!fs.existsSync(resolvedPath)) {
    throw new Error(`File not found: ${resolvedPath}`);
  }

  const buffer = fs.readFileSync(resolvedPath);
  const rawMetadata = extractRawMetadata(buffer);

  const rawStats: RawPlayerStats[] | null = rawMetadata.statsJson
    ? JSON.parse(rawMetadata.statsJson)
    : null;

  const metadata = transformMetadata(rawMetadata, rawStats);
  const stats = rawStats ? rawStats.map(transformPlayerStats) : null;

  return { metadata, stats };
};

/**
 * Buffer에서 직접 .rofl 데이터를 파싱합니다. (파일 업로드 시 사용)
 */
export const parseRoflBuffer = (buffer: Buffer): ParsedRoflData => {
  const rawMetadata = extractRawMetadata(buffer);

  const rawStats: RawPlayerStats[] | null = rawMetadata.statsJson
    ? JSON.parse(rawMetadata.statsJson)
    : null;

  const metadata = transformMetadata(rawMetadata, rawStats);
  const stats = rawStats ? rawStats.map(transformPlayerStats) : null;

  return { metadata, stats };
};

/**
 * 파싱된 데이터를 JSON 파일로 저장합니다.
 */
export const saveToJson = (
  data: ParsedRoflData,
  outputPath: string = "rofl_dump.json"
): void => {
  fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
};

// ============================================
// CLI 실행 (직접 실행 시)
// ============================================

const isMainModule = require.main === module;

if (isMainModule) {
  const fileName = process.argv[2] || "test.rofl";

  try {
    const data = parseRoflFile(fileName);
    saveToJson(data);
    console.log("✅ Successfully parsed ROFL file");
    console.log(`📁 Saved to rofl_dump.json`);
    console.log(`👥 Players: ${data.stats?.length || 0}`);
  } catch (error) {
    console.error("❌ Error:", (error as Error).message);
  }
}
