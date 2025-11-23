const mongoose = require("mongoose");

const matchSchema = new mongoose.Schema(
  {
    playerId: {
      type: mongoose.Schema.Types.ObjectId,
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

module.exports = mongoose.model("Match", matchSchema);
