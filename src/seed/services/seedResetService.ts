import { activityModel } from "../../models/activityModel";
import { followModel } from "../../models/followModel";
import LibraryEntryModel from "../../models/libraryEntryModel";
import { userModel } from "../../models/userModel";
import { demoUsers } from "../data/demoUsers";

export async function clearDemoSeedData(): Promise<void> {
  const demoEmails = demoUsers.map((user) => user.email);
  const demoUsersInDb = await userModel.find({ email: { $in: demoEmails } }).select("_id");
  const demoUserIds = demoUsersInDb.map((user) => user._id);

  if (demoUserIds.length === 0) {
    return;
  }

  await activityModel.deleteMany({
    actorUserId: { $in: demoUserIds }
  });

  await LibraryEntryModel.deleteMany({
    userId: { $in: demoUserIds }
  });

  await followModel.deleteMany({
    $or: [
      { followerId: { $in: demoUserIds } },
      { followingId: { $in: demoUserIds } }
    ]
  });

  await userModel.deleteMany({
    _id: { $in: demoUserIds }
  });
}
