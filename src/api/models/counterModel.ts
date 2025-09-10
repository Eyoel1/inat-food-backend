import mongoose, { Schema, Document } from "mongoose";

/**
 * @interface ICounter
 * @description Manages a global counter for entities like orders.
 */
export interface ICounter extends Document {
  _id: string; // The name of the counter, e.g., 'orderNumber'
  seq: number; // The current sequence value
}

const CounterSchema: Schema = new Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 },
});

const Counter = mongoose.model<ICounter>("Counter", CounterSchema);

/**
 * @function getNextSequence
 * @description Atomically finds the counter for the given name, increments its sequence, and returns the new value.
 * This guarantees that even if multiple orders are created at the exact same time, each will get a unique number.
 * @param {string} name - The name of the counter (e.g., 'orderNumber').
 * @returns {Promise<number>} The next number in the sequence.
 */
export async function getNextSequence(name: string): Promise<number> {
  const counter = await Counter.findByIdAndUpdate(
    name,
    { $inc: { seq: 1 } },
    { new: true, upsert: true } // `new` returns the updated doc, `upsert` creates it if it doesn't exist
  );
  return counter.seq;
}
