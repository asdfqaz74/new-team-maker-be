import mongoose, { Document, Schema, Model } from "mongoose";

// ============================================
// 1. 챔피언 통계 (ChampionStats)
// - 모스트 챔피언, 승률, 밴률, 포지션별 통계
// ============================================
export interface IPositionStats {
  games: number;
  wins: number;
  winRate: number;
}

export interface IChampionStats extends Document {
  championId: string; // "Aatrox"
  championName: string; // "아트록스"

  // 기본 통계
  totalGames: number; // 총 픽 횟수
  wins: number;
  losses: number;
  winRate: number; // 승률 (%)
  pickRate: number; // 픽률 (%)
  banCount: number; // 밴 횟수
  banRate: number; // 밴률 (%)

  // 포지션별 통계
  byPosition: {
    TOP: IPositionStats;
    JUNGLE: IPositionStats;
    MIDDLE: IPositionStats;
    BOTTOM: IPositionStats;
    UTILITY: IPositionStats;
  };

  updatedAt: Date;
}

// ============================================
// 2. 전체 게임 메타 통계 (GlobalStats)
// - 픽률/밴률 계산을 위한 전체 수치
// ============================================
export interface IGlobalStats extends Document {
  totalMatches: number; // 전체 게임 수
  totalBans: number; // 전체 밴 수 (게임당 10개)
  updatedAt: Date;
}

// ============================================
// 3. 플레이어 통계 (PlayerStats) - 승률 랭킹용
// ============================================
export interface IPlayerRankStats extends Document {
  playerId: mongoose.Types.ObjectId;
  gameName: string;
  tagLine: string;
  realName: string; // 실명

  totalGames: number;
  wins: number;
  losses: number;
  winRate: number;

  updatedAt: Date;
}

// ============================================
// 스키마 정의
// ============================================

const positionStatsSchema = new Schema<IPositionStats>(
  {
    games: { type: Number, default: 0 },
    wins: { type: Number, default: 0 },
    winRate: { type: Number, default: 0 },
  },
  { _id: false }
);

const championStatsSchema = new Schema<IChampionStats>(
  {
    championId: { type: String, required: true, unique: true },
    championName: { type: String, required: true },
    totalGames: { type: Number, default: 0 },
    wins: { type: Number, default: 0 },
    losses: { type: Number, default: 0 },
    winRate: { type: Number, default: 0 },
    pickRate: { type: Number, default: 0 },
    banCount: { type: Number, default: 0 },
    banRate: { type: Number, default: 0 },
    byPosition: {
      TOP: { type: positionStatsSchema, default: () => ({}) },
      JUNGLE: { type: positionStatsSchema, default: () => ({}) },
      MIDDLE: { type: positionStatsSchema, default: () => ({}) },
      BOTTOM: { type: positionStatsSchema, default: () => ({}) },
      UTILITY: { type: positionStatsSchema, default: () => ({}) },
    },
  },
  { timestamps: true }
);

const globalStatsSchema = new Schema<IGlobalStats>(
  {
    totalMatches: { type: Number, default: 0 },
    totalBans: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const playerRankStatsSchema = new Schema<IPlayerRankStats>(
  {
    playerId: {
      type: Schema.Types.ObjectId,
      ref: "Player",
      required: true,
      unique: true,
    },
    gameName: { type: String, required: true },
    tagLine: { type: String, required: true },
    realName: { type: String, required: true },
    totalGames: { type: Number, default: 0 },
    wins: { type: Number, default: 0 },
    losses: { type: Number, default: 0 },
    winRate: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// 인덱스 설정 (조회 성능 최적화)
championStatsSchema.index({ winRate: -1 });
championStatsSchema.index({ pickRate: -1 });
championStatsSchema.index({ banRate: -1 });
championStatsSchema.index({ totalGames: -1 });
playerRankStatsSchema.index({ winRate: -1 });

// 모델 export
export const ChampionStats: Model<IChampionStats> =
  mongoose.model<IChampionStats>("ChampionStats", championStatsSchema);

export const GlobalStats: Model<IGlobalStats> = mongoose.model<IGlobalStats>(
  "GlobalStats",
  globalStatsSchema
);

export const PlayerRankStats: Model<IPlayerRankStats> =
  mongoose.model<IPlayerRankStats>("PlayerRankStats", playerRankStatsSchema);
