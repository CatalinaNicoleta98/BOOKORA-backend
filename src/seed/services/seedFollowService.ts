import { followUser } from "../../services/followService";
import type { DemoFollowSeed } from "../types";

export async function createDemoFollows(
  follows: DemoFollowSeed[],
  userIdsByKey: Map<string, string>
): Promise<void> {
  for (const follow of follows) {
    const followerId = userIdsByKey.get(follow.followerKey);
    const followingId = userIdsByKey.get(follow.followingKey);

    if (!followerId || !followingId) {
      throw new Error(`Missing follow users for ${follow.followerKey} -> ${follow.followingKey}`);
    }

    await followUser(followerId, followingId);
  }
}
