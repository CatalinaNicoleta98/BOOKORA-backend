

import { Request, Response } from "express";
import { userModel } from "../models/userModel";
import { connect } from "../config/db";

// Get current authenticated user
export async function getCurrentUser(req: Request, res: Response) {
    try {
        await connect();

        const userId = (req as any).userId;

        if (!userId) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }

        const user = await userModel.findById(userId);

        if (!user) {
            res.status(404).json({ error: "User not found" });
            return;
        }

        res.status(200).json({
            error: null,
            data: {
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    avatarUrl: user.avatarUrl,
                    coverImageUrl: user.coverImageUrl,
                    bio: user.bio,
                    isProfilePublic: user.isProfilePublic,
                    role: user.role
                }
            }
        });
    } catch (error) {
        res.status(500).send("Error fetching current user. Error: " + error);
    }
}

// Update current authenticated user profile
export async function updateUserProfile(req: Request, res: Response) {
    try {
        await connect();

        const userId = (req as any).userId;

        if (!userId) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }

        const { avatarUrl, coverImageUrl, bio, name } = req.body;

        const updatePayload: any = {};

        if (typeof avatarUrl === "string") {
            updatePayload.avatarUrl = avatarUrl.trim();
        }

        if (typeof coverImageUrl === "string") {
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

        res.status(200).json({
            error: null,
            data: {
                user: {
                    id: updatedUser._id,
                    name: updatedUser.name,
                    email: updatedUser.email,
                    avatarUrl: updatedUser.avatarUrl,
                    coverImageUrl: updatedUser.coverImageUrl,
                    bio: updatedUser.bio,
                    isProfilePublic: updatedUser.isProfilePublic,
                    role: updatedUser.role
                }
            }
        });

    } catch (error) {
        res.status(500).send("Error updating user profile. Error: " + error);
    }
}