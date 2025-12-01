import mongoose, { Document, Schema, Model } from "mongoose";

export interface IRecentStats {
  games: number;
  wins: number;
  losses: number;
  winAvg: number;
  kills: number;
  deaths: number;
  assists: number;
  kdaAvg: number;
}

export interface IPlayer extends Document {
  realName: string;
  gameName: string;
  tagLine: string;
  mainPosition: string;
  subPositions: string;
  subPositions2: string;
  owner: mongoose.Types.ObjectId;
  recentStats: IRecentStats;
  createdAt: Date;
  updatedAt: Date;
}

const playerSchema = new Schema<IPlayer>(
  {
    realName: { type: String, required: true },
    gameName: { type: String, required: true },
    tagLine: { type: String, required: true },
    mainPosition: { type: String, required: true },
    subPositions: { type: String, required: true },
    subPositions2: { type: String },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    recentStats: {
      games: { type: Number, default: 0 },
      wins: { type: Number, default: 0 },
      losses: { type: Number, default: 0 },
      winAvg: { type: Number, default: 0 },
      kills: { type: Number, default: 0 },
      deaths: { type: Number, default: 0 },
      assists: { type: Number, default: 0 },
      kdaAvg: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

const Player: Model<IPlayer> = mongoose.model<IPlayer>("Player", playerSchema);

export default Player;
