import mongoose, { Document, Schema, Model } from "mongoose";

export interface ISubAccount {
  subId: string;
  password: string;
  isEnabled: boolean;
}

export interface IUser extends Document {
  realName: string;
  userId: string;
  email: string;
  password: string;
  subAccount?: ISubAccount;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    realName: { type: String, required: true },
    userId: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    subAccount: {
      subId: { type: String },
      password: { type: String },
      isEnabled: { type: Boolean, default: false },
    },
  },
  { timestamps: true }
);

const User: Model<IUser> = mongoose.model<IUser>("User", userSchema);

export default User;
