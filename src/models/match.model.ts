import mongoose, { Document, Schema, Model } from "mongoose";

export interface IMatch extends Document {
  playerId: mongoose.Types.ObjectId;
  champion?: string;
  kills?: number;
  deaths?: number;
  assists?: number;
  totalDamageDealt?: number;
  totalDamageTaken?: number;
  wardsPlaced?: number;
  wardsKilled?: number;
  minionsKilled?: number;
  team?: string;
  win?: boolean;
  gameDuration?: number;
  playedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const matchSchema = new Schema<IMatch>(
  {
    playerId: {
      type: Schema.Types.ObjectId,
      ref: "Player",
      required: true,
    },
    champion: String,
    kills: Number,
    deaths: Number,
    assists: Number,
    totalDamageDealt: Number,
    totalDamageTaken: Number,
    wardsPlaced: Number,
    wardsKilled: Number,
    minionsKilled: Number,
    team: String,
    win: Boolean,
    gameDuration: Number,
    playedAt: Date,
  },
  { timestamps: true }
);

const Match: Model<IMatch> = mongoose.model<IMatch>("Match", matchSchema);

export default Match;
