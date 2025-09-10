import mongoose, { Schema, Document } from "mongoose";
import bcrypt from "bcryptjs";

export enum UserRole {
  Waitress = "Waitress",
  Kitchen = "Kitchen",
  JuiceBar = "JuiceBar",
  Owner = "Owner",
}

export interface IUser extends Document {
  name: string;
  username: string;
  pin: string;
  role: UserRole;
}

const userSchema: Schema = new Schema({
  name: { type: String, required: [true, "Please provide a name"] },
  username: {
    type: String,
    required: [true, "Please provide a username"],
    unique: true,
  },
  pin: {
    type: String,
    required: [true, "Please provide a PIN"],
    minlength: 4,
    maxlength: 4,
    select: false, // Don't send the PIN back in queries
  },
  role: {
    type: String,
    enum: Object.values(UserRole),
    default: UserRole.Waitress,
  },
});

// Middleware to hash the PIN before saving
userSchema.pre<IUser>("save", async function (next) {
  if (!this.isModified("pin")) return next();
  this.pin = await bcrypt.hash(this.pin, 12);
  next();
});

export default mongoose.model<IUser>("User", userSchema);
