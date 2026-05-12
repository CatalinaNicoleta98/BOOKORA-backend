import bcrypt from "bcrypt";
import { userModel } from "../../models/userModel";
import { buildHandleFields } from "../../services/userHandleService";
import { DEMO_SEED_PASSWORD } from "../data/demoUsers";
import type { DemoUserSeed } from "../types";

export async function createDemoUsers(
  users: DemoUserSeed[]
): Promise<Map<string, string>> {
  const passwordHash = await bcrypt.hash(DEMO_SEED_PASSWORD, 10);
  const userIdsByKey = new Map<string, string>();

  for (const user of users) {
    const createdUser = await userModel.create({
      name: user.name,
      email: user.email,
      password: passwordHash,
      ...buildHandleFields(user.handle),
      avatarUrl: user.avatarUrl,
      coverImageUrl: user.coverImageUrl,
      bio: user.bio,
      isProfilePublic: user.isProfilePublic,
      role: "user"
    });

    userIdsByKey.set(user.key, createdUser._id.toString());
  }

  return userIdsByKey;
}
