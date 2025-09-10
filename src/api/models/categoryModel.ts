import mongoose, { Schema, Document } from "mongoose";

// This is where we will link categories to preparation stations!
export enum PreparationStation {
  Kitchen = "Kitchen",
  JuiceBar = "JuiceBar",
}

export interface ICategory extends Document {
  name: {
    en: string;
    am: string;
  };
  station: PreparationStation;
}

const categorySchema: Schema = new Schema({
  name: {
    en: { type: String, required: true },
    am: { type: String, required: true },
  },
  station: {
    type: String,
    enum: Object.values(PreparationStation),
    required: [true, "A category must be assigned to a preparation station."],
  },
});

export default mongoose.model<ICategory>("Category", categorySchema);
