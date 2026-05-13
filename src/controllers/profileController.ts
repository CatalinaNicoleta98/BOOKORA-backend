import { Response } from "express";
import { userModel } from "../models/userModel";
import { connect } from "../config/db";
import path from "path";
import { type AuthenticatedRequest } from "../middleware/authMiddleware";
import { ensureUserHandle } from "../services/userHandleService";
import { toSafeUserResponse } from "../services/userResponseService";

interface ProfileUpdatePayload {
    avatarUrl?: string;
    coverImageUrl?: string;
    bio?: string;
    name?: string;
}

function logProfileError(action: "fetch" | "update", error: unknown) {
    console.error(`[profile] Failed to ${action} profile`, error);
}

// Get current authenticated user
export async function getCurrentUser(req: AuthenticatedRequest, res: Response) {
    try {
        await connect();

        const userId = req.userId;

        if (!userId) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }

        const user = await userModel.findById(userId);

        if (!user) {
            res.status(404).json({ error: "User not found" });
            return;
        }

        const userWithHandle = await ensureUserHandle(user);

        res.status(200).json({
            error: null,
            data: {
                user: toSafeUserResponse(userWithHandle)
            }
        });
    } catch (error) {
        logProfileError("fetch", error);
        res.status(500).json({ error: "Failed to fetch current user" });
    }
}

// Update current authenticated user profile
export async function updateUserProfile(req: AuthenticatedRequest, res: Response) {
    try {
        await connect();

        const userId = req.userId;

        const files = req.files as {
          avatar?: Express.Multer.File[];
          cover?: Express.Multer.File[];
        } | undefined;

        if (!userId) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }

        const { avatarUrl, coverImageUrl, bio, name } = req.body;

        const updatePayload: ProfileUpdatePayload = {};

        // Handle uploaded files (preferred over raw URLs)
        if (files?.avatar?.[0]) {
            const fileName = files.avatar[0].filename;
            updatePayload.avatarUrl = path.join("/uploads/profiles", fileName).replace(/\\/g, "/");
        } else if (typeof avatarUrl === "string") {
            updatePayload.avatarUrl = avatarUrl.trim();
        }

        if (files?.cover?.[0]) {
            const fileName = files.cover[0].filename;
            updatePayload.coverImageUrl = path.join("/uploads/profiles", fileName).replace(/\\/g, "/");
        } else if (typeof coverImageUrl === "string") {
            updatePayload.coverImageUrl = coverImageUrl.trim();
        }

        if (typeof bio === "string") {
            updatePayload.bio = bio.trim();
        }

        if (typeof name === "string" && name.trim().length >= 2) {
            updatePayload.name = name.trim();
        }

        const updatedUser = await userModel.findByIdAndUpdate(
            userId,
            { $set: updatePayload },
            { new: true }
        );

        if (!updatedUser) {
            res.status(404).json({ error: "User not found" });
            return;
        }

        const userWithHandle = await ensureUserHandle(updatedUser);

        res.status(200).json({
            error: null,
            data: {
                user: toSafeUserResponse(userWithHandle)
            }
        });

    } catch (error) {
        logProfileError("update", error);
        res.status(500).json({ error: "Failed to update user profile" });
    }
}
