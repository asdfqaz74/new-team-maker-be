import mongoose, { Document, Schema, Model } from "mongoose";

export interface IUser extends Document {
  realName: string;
  userId: string;
  email: string;
  password: string;
  players: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    realName: { type: String, required: true },
    userId: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    players: [{ type: Schema.Types.ObjectId, ref: "Player" }],
  },
  { timestamps: true }
);

const User: Model<IUser> = mongoose.model<IUser>("User", userSchema);

export default User;
