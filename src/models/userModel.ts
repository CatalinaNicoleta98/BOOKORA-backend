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

  // Preferred avatar field used across the app
  avatarUrl: {
    type: String,
    trim: true
  },

  // Backward compatibility (can be removed later)
  profilePicture: {
    type: String,
    trim: true
  },

  // Profile cover/banner image
  coverImageUrl: {
    type: String,
    trim: true
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
  }
}, {
  timestamps: true
});

export const userModel = model<User>("User", userSchema);