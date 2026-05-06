import { Schema, model, type Document, type Types } from "mongoose";

export interface FollowDocument extends Document {
  followerId: Types.ObjectId;
  followingId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const followSchema = new Schema<FollowDocument>(
  {
    followerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    followingId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    }
  },
  {
    timestamps: true
  }
);

followSchema.index({ followerId: 1, followingId: 1 }, { unique: true });

export const followModel = model<FollowDocument>("Follow", followSchema);
