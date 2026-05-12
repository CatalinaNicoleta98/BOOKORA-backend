import crypto from "crypto";
import bcrypt from "bcrypt";
import { userModel } from "../models/userModel";

const RESET_TOKEN_BYTES = 32;
const RESET_TOKEN_TTL_MINUTES = 30;

export interface PasswordResetTokenPayload {
  token: string;
  expiresAt: Date;
}

export function getPasswordResetExpiryMinutes(): number {
  return RESET_TOKEN_TTL_MINUTES;
}

export function hashPasswordResetToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function createPasswordResetToken(userId: string): Promise<PasswordResetTokenPayload> {
  const token = crypto.randomBytes(RESET_TOKEN_BYTES).toString("hex");
  const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MINUTES * 60 * 1000);

  await userModel.findByIdAndUpdate(userId, {
    $set: {
      passwordResetTokenHash: hashPasswordResetToken(token),
      passwordResetExpiresAt: expiresAt
    }
  });

  return {
    token,
    expiresAt
  };
}

export async function resetPasswordWithToken(token: string, nextPassword: string): Promise<boolean> {
  const tokenHash = hashPasswordResetToken(token);
  const user = await userModel.findOne({
    passwordResetTokenHash: tokenHash,
    passwordResetExpiresAt: { $gt: new Date() }
  });

  if (!user) {
    return false;
  }

  const passwordHashed = await bcrypt.hash(nextPassword, 10);

  user.password = passwordHashed;
  user.passwordResetTokenHash = undefined;
  user.passwordResetExpiresAt = undefined;
  await user.save();

  return true;
}
