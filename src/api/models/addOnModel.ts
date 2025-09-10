import mongoose, { Schema, Document } from "mongoose";

export interface IAddOn extends Document {
  name: {
    en: string;
    am: string;
  };
  price: number;
}

const addOnSchema: Schema = new Schema({
  name: {
    en: { type: String, required: true },
    am: { type: String, required: true },
  },
  price: {
    type: Number,
    required: true,
  },
});

export default mongoose.model<IAddOn>("AddOn", addOnSchema);
