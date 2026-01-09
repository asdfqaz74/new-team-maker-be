import mongoose, { Document, Model, Schema } from "mongoose";

export interface IInitData extends Document {
  version: string;
}

const initSchema = new Schema<IInitData>({
  version: { type: String, required: true },
});

const Init: Model<IInitData> = mongoose.model<IInitData>("Init", initSchema);

export default Init;
