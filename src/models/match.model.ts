import mongoose, { Document, Schema, Model } from "mongoose";

// 아이템 인터페이스
export interface IItem {
  id: string;
  name: string | null;
}

// 룬 슬롯 인터페이스
export interface IRuneSlot {
  id: string;
  name: string;
}

// 룬 스타일 인터페이스
export interface IRuneStyle {
  id: string;
  name: string;
}

// 주 룬 인터페이스
export interface IPrimaryStyle {
  style: IRuneStyle;
  keystone: IRuneSlot;
  slots: IRuneSlot[];
}

// 보조 룬 인터페이스
export interface ISubStyle {
  style: IRuneStyle;
  slots: IRuneSlot[];
}

// 룬 전체 인터페이스
export interface IPerks {
  primaryStyle: IPrimaryStyle;
  subStyle: ISubStyle;
  statPerks: string[];
}

// 소환사 주문 인터페이스
export interface ISummonerSpell {
  id: string;
  name: string;
}

// 매치 메타데이터 인터페이스
export interface IMatchMetadata {
  gameLength: number;
  gameDuration: number;
  winTeam: "BLUE" | "RED";
  playTime: string;
}

// 플레이어 스탯 인터페이스
export interface IPlayerStats extends Document {
  matchId: mongoose.Types.ObjectId;
  playerId: mongoose.Types.ObjectId; // 매핑된 Player 문서의 _id

  // 플레이어 정보 (원본 - 참고용)
  riotIdGameName: string;
  riotIdTagLine: string;
  champion: string;
  team: "BLUE" | "RED";
  position: "TOP" | "JUNGLE" | "MIDDLE" | "BOTTOM" | "UTILITY";
  win: boolean;
  level: string;

  // KDA
  kills: string;
  deaths: string;
  assists: string;

  // 멀티킬
  doubleKills: string;
  tripleKills: string;
  quadraKills: string;
  pentaKills: string;

  // 골드 및 CS
  goldEarned: string;
  creepScore: string;

  // 데미지 (마법)
  magicDamageDealt: string;
  magicDamageToChampions: string;
  magicDamageTaken: string;

  // 데미지 (물리)
  physicalDamageDealt: string;
  physicalDamageToChampions: string;
  physicalDamageTaken: string;

  // 데미지 (고정)
  trueDamageDealt: string;
  trueDamageToChampions: string;
  trueDamageTaken: string;

  // 데미지 (총합)
  totalDamageDealt: string;
  totalDamageToChampions: string;
  totalDamageTaken: string;

  // 시야
  visionScore: string;
  controlWardsBought: string;
  wardsKilled: string;
  wardsPlaced: string;

  // 아이템
  items: IItem[];

  // 룬
  perks: IPerks;

  // 소환사 주문
  summonerSpells: ISummonerSpell[];

  createdAt: Date;
  updatedAt: Date;
}

export interface IMatch extends Document {
  metadata: IMatchMetadata;
  playedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// 스키마 정의
const itemSchema = new Schema<IItem>(
  {
    id: { type: String, required: true },
    name: { type: String, default: null },
  },
  { _id: false }
);

const runeSlotSchema = new Schema<IRuneSlot>(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
  },
  { _id: false }
);

const runeStyleSchema = new Schema<IRuneStyle>(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
  },
  { _id: false }
);

const primaryStyleSchema = new Schema<IPrimaryStyle>(
  {
    style: { type: runeStyleSchema, required: true },
    keystone: { type: runeSlotSchema, required: true },
    slots: { type: [runeSlotSchema], required: true },
  },
  { _id: false }
);

const subStyleSchema = new Schema<ISubStyle>(
  {
    style: { type: runeStyleSchema, required: true },
    slots: { type: [runeSlotSchema], required: true },
  },
  { _id: false }
);

const perksSchema = new Schema<IPerks>(
  {
    primaryStyle: { type: primaryStyleSchema, required: true },
    subStyle: { type: subStyleSchema, required: true },
    statPerks: { type: [String], required: true },
  },
  { _id: false }
);

const summonerSpellSchema = new Schema<ISummonerSpell>(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
  },
  { _id: false }
);

const matchMetadataSchema = new Schema<IMatchMetadata>(
  {
    gameLength: { type: Number, required: true },
    gameDuration: { type: Number, required: true },
    winTeam: { type: String, enum: ["BLUE", "RED"], required: true },
    playTime: { type: String, required: true },
  },
  { _id: false }
);

const playerStatsSchema = new Schema<IPlayerStats>(
  {
    matchId: {
      type: Schema.Types.ObjectId,
      ref: "Match",
      required: true,
    },
    playerId: {
      type: Schema.Types.ObjectId,
      ref: "Player",
      required: true,
    },

    // 플레이어 정보 (원본 - 참고용)
    riotIdGameName: { type: String, required: true },
    riotIdTagLine: { type: String, required: true },
    champion: { type: String, required: true },
    team: { type: String, enum: ["BLUE", "RED"], required: true },
    position: {
      type: String,
      enum: ["TOP", "JUNGLE", "MIDDLE", "BOTTOM", "UTILITY"],
      required: true,
    },
    win: { type: Boolean, required: true },
    level: { type: String, required: true },

    // KDA
    kills: { type: String, required: true },
    deaths: { type: String, required: true },
    assists: { type: String, required: true },

    // 멀티킬
    doubleKills: { type: String, default: "0" },
    tripleKills: { type: String, default: "0" },
    quadraKills: { type: String, default: "0" },
    pentaKills: { type: String, default: "0" },

    // 골드 및 CS
    goldEarned: { type: String, required: true },
    creepScore: { type: String, required: true },

    // 데미지 (마법)
    magicDamageDealt: { type: String, default: "0" },
    magicDamageToChampions: { type: String, default: "0" },
    magicDamageTaken: { type: String, default: "0" },

    // 데미지 (물리)
    physicalDamageDealt: { type: String, default: "0" },
    physicalDamageToChampions: { type: String, default: "0" },
    physicalDamageTaken: { type: String, default: "0" },

    // 데미지 (고정)
    trueDamageDealt: { type: String, default: "0" },
    trueDamageToChampions: { type: String, default: "0" },
    trueDamageTaken: { type: String, default: "0" },

    // 데미지 (총합)
    totalDamageDealt: { type: String, default: "0" },
    totalDamageToChampions: { type: String, default: "0" },
    totalDamageTaken: { type: String, default: "0" },

    // 시야
    visionScore: { type: String, default: "0" },
    controlWardsBought: { type: String, default: "0" },
    wardsKilled: { type: String, default: "0" },
    wardsPlaced: { type: String, default: "0" },

    // 아이템
    items: { type: [itemSchema], default: [] },

    // 룬
    perks: { type: perksSchema, required: true },

    // 소환사 주문
    summonerSpells: { type: [summonerSpellSchema], required: true },
  },
  { timestamps: true }
);

const matchSchema = new Schema<IMatch>(
  {
    metadata: { type: matchMetadataSchema, required: true },
    playedAt: { type: Date },
  },
  { timestamps: true }
);

// 인덱스 설정
playerStatsSchema.index({ matchId: 1 });
playerStatsSchema.index({ riotIdGameName: 1, riotIdTagLine: 1 });
playerStatsSchema.index({ champion: 1 });
playerStatsSchema.index({ team: 1, position: 1 });

const Match: Model<IMatch> = mongoose.model<IMatch>("Match", matchSchema);
const PlayerStats: Model<IPlayerStats> = mongoose.model<IPlayerStats>(
  "PlayerStats",
  playerStatsSchema
);

export { Match, PlayerStats };
export default Match;
