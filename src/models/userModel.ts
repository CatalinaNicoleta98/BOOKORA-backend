import { Schema, model } from "mongoose";
import { User } from "../interfaces/user";
import { isReservedHandle, isValidHandleFormat } from "../services/userHandleService";

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

  handle: {
    type: String,
    trim: true,
    validate: {
      validator: (value: string | undefined): boolean => {
        if (typeof value === "undefined") {
          return true;
        }

        return isValidHandleFormat(value) && !isReservedHandle(value);
      },
      message: "Handle must be 3-30 characters, use only letters, numbers, or underscores, and not be reserved"
    }
  },

  handleLower: {
    type: String,
    trim: true,
    lowercase: true
  },

  // Preferred avatar field used across the app
  avatarUrl: {
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
  },

  passwordResetTokenHash: {
    type: String,
    trim: true
  },

  passwordResetExpiresAt: {
    type: Date
  }
}, {
  timestamps: true
});

userSchema.index(
  { handleLower: 1 },
  {
    unique: true,
    partialFilterExpression: {
      handleLower: {
        $type: "string"
      }
    }
  }
);

export const userModel = model<User>("User", userSchema);
