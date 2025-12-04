import mongoose, { Document, Schema, Model } from "mongoose";

export interface IChampionInfo {
  attack: number;
  defense: number;
  magic: number;
  difficulty: number;
}

export interface IChampionImage {
  full: string;
  sprite: string;
  group: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface IChampionStats {
  hp: number;
  hpperlevel: number;
  mp: number;
  mpperlevel: number;
  movespeed: number;
  armor: number;
  armorperlevel: number;
  spellblock: number;
  spellblockperlevel: number;
  attackrange: number;
  hpregen: number;
  hpregenperlevel: number;
  mpregen: number;
  mpregenperlevel: number;
  crit: number;
  critperlevel: number;
  attackdamage: number;
  attackdamageperlevel: number;
  attackspeedperlevel: number;
  attackspeed: number;
}

// 스킬 레벨업 팁
export interface ILevelTip {
  label: string[];
  effect: string[];
}

// 스킬 정보
export interface ISpell {
  id: string; // "AatroxQ"
  name: string; // "다르킨의 검"
  description: string;
  tooltip: string;
  leveltip: ILevelTip;
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
  image: IChampionImage;
  resource: string;
}

// 패시브 정보
export interface IPassive {
  name: string;
  description: string;
  image: IChampionImage;
}

// 스킨 정보
export interface ISkin {
  id: string;
  num: number;
  name: string;
  chromas: boolean;
}

export interface IChampion extends Document {
  version: string;
  championId: string; // "Aatrox" (원본 id)
  key: string; // "266"
  name: string; // "아트록스"
  title: string; // "다르킨의 검"
  lore: string; // 전체 스토리
  info: IChampionInfo;
  image: IChampionImage;
  tags: string[];
  partype: string;
  stats: IChampionStats;
  spells: ISpell[]; // Q, W, E, R
  passive: IPassive;
  skins: ISkin[];
  allytips: string[];
  enemytips: string[];
}

const SpellSchema = new Schema<ISpell>(
  {
    id: String,
    name: String,
    description: String,
    tooltip: String,
    leveltip: {
      label: [String],
      effect: [String],
    },
    maxrank: Number,
    cooldown: [Number],
    cooldownBurn: String,
    cost: [Number],
    costBurn: String,
    effect: { type: Schema.Types.Mixed },
    effectBurn: [Schema.Types.Mixed],
    costType: String,
    maxammo: String,
    range: [Number],
    rangeBurn: String,
    image: {
      full: String,
      sprite: String,
      group: String,
      x: Number,
      y: Number,
      w: Number,
      h: Number,
    },
    resource: String,
  },
  { _id: false }
);

const PassiveSchema = new Schema<IPassive>(
  {
    name: String,
    description: String,
    image: {
      full: String,
      sprite: String,
      group: String,
      x: Number,
      y: Number,
      w: Number,
      h: Number,
    },
  },
  { _id: false }
);

const SkinSchema = new Schema<ISkin>(
  {
    id: String,
    num: Number,
    name: String,
    chromas: Boolean,
  },
  { _id: false }
);

const ChampionSchema = new Schema<IChampion>(
  {
    version: { type: String, required: true },
    championId: { type: String, required: true, unique: true },
    key: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    title: { type: String, required: true },
    lore: { type: String },
    info: {
      attack: Number,
      defense: Number,
      magic: Number,
      difficulty: Number,
    },
    image: {
      full: String,
      sprite: String,
      group: String,
      x: Number,
      y: Number,
      w: Number,
      h: Number,
    },
    tags: [{ type: String }],
    partype: { type: String },
    stats: {
      hp: Number,
      hpperlevel: Number,
      mp: Number,
      mpperlevel: Number,
      movespeed: Number,
      armor: Number,
      armorperlevel: Number,
      spellblock: Number,
      spellblockperlevel: Number,
      attackrange: Number,
      hpregen: Number,
      hpregenperlevel: Number,
      mpregen: Number,
      mpregenperlevel: Number,
      crit: Number,
      critperlevel: Number,
      attackdamage: Number,
      attackdamageperlevel: Number,
      attackspeedperlevel: Number,
      attackspeed: Number,
    },
    spells: [SpellSchema],
    passive: PassiveSchema,
    skins: [SkinSchema],
    allytips: [String],
    enemytips: [String],
  },
  { timestamps: true }
);

// 인덱스 추가
ChampionSchema.index({ name: 1 });
ChampionSchema.index({ tags: 1 });

const Champion: Model<IChampion> = mongoose.model<IChampion>(
  "Champion",
  ChampionSchema
);

export default Champion;
