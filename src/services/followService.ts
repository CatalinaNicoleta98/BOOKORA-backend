import mongoose from "mongoose";
import { followModel } from "../models/followModel";
import { userModel } from "../models/userModel";
import { ensureUserHandle } from "./userHandleService";

export interface FollowMutationResult {
  targetUserId: string;
  following: boolean;
  followerCount: number;
  followingCount: number;
}

export interface PublicReaderCard {
  id: string;
  handle?: string;
  name: string;
  avatarUrl?: string;
  bio?: string;
}

export async function followUser(
  actorUserId: string,
  targetUserId: string
): Promise<FollowMutationResult> {
  if (!mongoose.isValidObjectId(targetUserId)) {
    throw new Error("TARGET_NOT_FOUND");
  }

  if (actorUserId === targetUserId) {
    throw new Error("SELF_FOLLOW_NOT_ALLOWED");
  }

  const targetUser = await userModel.findOne({
    _id: targetUserId,
    isProfilePublic: true
  }).select("_id");

  if (!targetUser) {
    throw new Error("TARGET_NOT_FOUND");
  }

  const followerObjectId = new mongoose.Types.ObjectId(actorUserId);
  const followingObjectId = new mongoose.Types.ObjectId(targetUserId);

  await followModel.updateOne(
    {
      followerId: followerObjectId,
      followingId: followingObjectId
    },
    {
      $setOnInsert: {
        followerId: followerObjectId,
        followingId: followingObjectId
      }
    },
    {
      upsert: true
    }
  );

  const [followerCount, followingCount] = await Promise.all([
    followModel.countDocuments({ followingId: followingObjectId }),
    followModel.countDocuments({ followerId: followerObjectId })
  ]);

  return {
    targetUserId,
    following: true,
    followerCount,
    followingCount
  };
}

export async function unfollowUser(
  actorUserId: string,
  targetUserId: string
): Promise<FollowMutationResult> {
  if (!mongoose.isValidObjectId(targetUserId)) {
    throw new Error("TARGET_NOT_FOUND");
  }

  if (actorUserId === targetUserId) {
    throw new Error("SELF_FOLLOW_NOT_ALLOWED");
  }

  const targetUser = await userModel.findOne({
    _id: targetUserId,
    isProfilePublic: true
  }).select("_id");

  if (!targetUser) {
    throw new Error("TARGET_NOT_FOUND");
  }

  await followModel.deleteOne({
    followerId: new mongoose.Types.ObjectId(actorUserId),
    followingId: new mongoose.Types.ObjectId(targetUserId)
  });

  const followerObjectId = new mongoose.Types.ObjectId(actorUserId);
  const followingObjectId = new mongoose.Types.ObjectId(targetUserId);
  const [followerCount, followingCount] = await Promise.all([
    followModel.countDocuments({ followingId: followingObjectId }),
    followModel.countDocuments({ followerId: followerObjectId })
  ]);

  return {
    targetUserId,
    following: false,
    followerCount,
    followingCount
  };
}

async function buildPublicReaderCards(userIds: mongoose.Types.ObjectId[]): Promise<PublicReaderCard[]> {
  if (userIds.length === 0) {
    return [];
  }

  const uniqueUserIds = userIds
    .map((id) => id.toString())
    .filter((userId, index, values) => values.indexOf(userId) === index);

  const publicCards: PublicReaderCard[] = [];

  for (const userId of uniqueUserIds) {
    const user = await userModel.findOne({
      _id: userId,
      isProfilePublic: true
    });

    if (!user) {
      continue;
    }

    const safeUser = await ensureUserHandle(user);

    publicCards.push({
      id: safeUser._id.toString(),
      handle: safeUser.handle,
      name: safeUser.name,
      avatarUrl: safeUser.avatarUrl,
      bio: safeUser.bio
    });
  }

  return publicCards;
}

export async function getReaderFollowers(userId: string): Promise<PublicReaderCard[]> {
  const followerRelations = await followModel
    .find({ followingId: userId })
    .sort({ createdAt: -1 })
    .select("followerId");

  return buildPublicReaderCards(followerRelations.map((relation) => relation.followerId));
}

export async function getReaderFollowing(userId: string): Promise<PublicReaderCard[]> {
  const followingRelations = await followModel
    .find({ followerId: userId })
    .sort({ createdAt: -1 })
    .select("followingId");

  return buildPublicReaderCards(followingRelations.map((relation) => relation.followingId));
}
