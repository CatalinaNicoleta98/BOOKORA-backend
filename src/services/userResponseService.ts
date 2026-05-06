import type { HydratedDocument } from "mongoose";
import type { User } from "../interfaces/user";

export interface SafeUserResponse {
  id: string;
  name: string;
  email: string;
  handle?: string;
  avatarUrl?: string;
  coverImageUrl?: string;
  bio?: string;
  isProfilePublic?: boolean;
  role?: string;
}

export function toSafeUserResponse(user: HydratedDocument<User>): SafeUserResponse {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    handle: user.handle,
    avatarUrl: user.avatarUrl,
    coverImageUrl: user.coverImageUrl,
    bio: user.bio,
    isProfilePublic: user.isProfilePublic,
    role: user.role
  };
}
