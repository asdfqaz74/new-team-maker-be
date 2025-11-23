const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    realName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    players: [{ type: mongoose.Schema.Types.ObjectId, ref: "Player" }],
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
