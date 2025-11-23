const mongoose = require("mongoose");

const playerSchema = new mongoose.Schema(
  {
    realName: { type: String, required: true },
    lolNickname: { type: String, required: true },
    mainPosition: { type: String, required: true },
    subPositions: [{ type: String }],
    owner: {
      type: mongoose.Schema.Types.ObjectId,
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

module.exports = mongoose.model("Player", playerSchema);
