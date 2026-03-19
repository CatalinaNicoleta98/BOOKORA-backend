import { Schema, model } from "mongoose";
import { User } from "../interfaces/user";

const userSchema = new Schema<User>({
  name: {
    type: String,
    required: true,
    min: 2,
    max: 100
  },

  email: {
    type: String,
    required: true,
    min: 6,
    max: 255,
    unique: true
  },

  password: {
    type: String,
    required: true,
    min: 6,
    max: 1024
  },

  profilePicture: {
    type: String
  },

  bio: {
    type: String,
    max: 500
  },

  isProfilePublic: {
    type: Boolean,
    default: true
  },

  role: {
    type: String,
    default: "user"
  },

  createdAt: {
    type: Date,
    required: true,
    default: Date.now
  },

  updatedAt: {
    type: Date
  }
});

export const userModel = model<User>("User", userSchema);