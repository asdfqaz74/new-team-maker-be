import mongoose, { Document, Schema, Model } from "mongoose";

/**
 * 챔피언 패치 히스토리
 * 버전이 변경될 때마다 변경된 내용을 기록합니다.
 */

// 변경된 스킬 정보
export interface ISpellChange {
  spellKey: "P" | "Q" | "W" | "E" | "R"; // 패시브 또는 Q/W/E/R
  spellId: string;
  spellName: string;
  changeType: "buff" | "nerf" | "adjust" | "rework" | "new";
  before: {
    tooltip?: string;
    cooldown?: number[];
    cost?: number[];
    effect?: (number[] | null)[];
    description?: string;
  };
  after: {
    tooltip?: string;
    cooldown?: number[];
    cost?: number[];
    effect?: (number[] | null)[];
    description?: string;
  };
}

// 변경된 스탯 정보
export interface IStatChange {
  statName: string;
  before: number;
  after: number;
  changeType: "buff" | "nerf";
}

export interface IChampionHistory extends Document {
  championId: string; // "Aatrox"
  championName: string; // "아트록스"
  fromVersion: string; // 이전 버전 "15.23.1"
  toVersion: string; // 새 버전 "15.24.1"
  patchDate: Date;
  spellChanges: ISpellChange[];
  statChanges: IStatChange[];
  // 전체 스냅샷 (선택적)
  snapshot?: {
    spells: unknown[];
    passive: unknown;
    stats: Record<string, number>;
  };
}

const SpellChangeSchema = new Schema<ISpellChange>(
  {
    spellKey: {
      type: String,
      enum: ["P", "Q", "W", "E", "R"],
      required: true,
    },
    spellId: String,
    spellName: String,
    changeType: {
      type: String,
      enum: ["buff", "nerf", "adjust", "rework", "new"],
      required: true,
    },
    before: {
      tooltip: String,
      cooldown: [Number],
      cost: [Number],
      effect: Schema.Types.Mixed,
      description: String,
    },
    after: {
      tooltip: String,
      cooldown: [Number],
      cost: [Number],
      effect: Schema.Types.Mixed,
      description: String,
    },
  },
  { _id: false }
);

const StatChangeSchema = new Schema<IStatChange>(
  {
    statName: { type: String, required: true },
    before: { type: Number, required: true },
    after: { type: Number, required: true },
    changeType: {
      type: String,
      enum: ["buff", "nerf"],
      required: true,
    },
  },
  { _id: false }
);

const ChampionHistorySchema = new Schema<IChampionHistory>(
  {
    championId: { type: String, required: true, index: true },
    championName: { type: String, required: true },
    fromVersion: { type: String, required: true },
    toVersion: { type: String, required: true, index: true },
    patchDate: { type: Date, default: Date.now },
    spellChanges: [SpellChangeSchema],
    statChanges: [StatChangeSchema],
    snapshot: {
      spells: Schema.Types.Mixed,
      passive: Schema.Types.Mixed,
      stats: Schema.Types.Mixed,
    },
  },
  { timestamps: true }
);

// 복합 인덱스
ChampionHistorySchema.index({ championId: 1, toVersion: 1 }, { unique: true });
ChampionHistorySchema.index({ toVersion: 1, patchDate: -1 });

const ChampionHistory: Model<IChampionHistory> =
  mongoose.model<IChampionHistory>("ChampionHistory", ChampionHistorySchema);

export default ChampionHistory;
