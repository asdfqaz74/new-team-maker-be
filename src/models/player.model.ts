import mongoose, { Document, Schema, Model } from "mongoose";

export interface IRecentStats {
  games: number;
  wins: number;
  losses: number;
  kdaAvg: number;
  dmgAvg: number;
}

export interface IPlayer extends Document {
  realName: string;
  lolNickname: string;
  mainPosition: string;
  subPositions: string[];
  owner: mongoose.Types.ObjectId;
  recentStats: IRecentStats;
  createdAt: Date;
  updatedAt: Date;
}

const playerSchema = new Schema<IPlayer>(
  {
    realName: { type: String, required: true },
    lolNickname: { type: String, required: true },
    mainPosition: { type: String, required: true },
    subPositions: [{ type: String }],
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    recentStats: {
      games: { type: Number, default: 0 },
      wins: { type: Number, default: 0 },
      losses: { type: Number, default: 0 },
      kdaAvg: { type: Number, default: 0 },
      dmgAvg: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

const Player: Model<IPlayer> = mongoose.model<IPlayer>("Player", playerSchema);

export default Player;
