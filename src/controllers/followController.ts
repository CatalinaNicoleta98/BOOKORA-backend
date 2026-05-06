import type { Response } from "express";
import { connect } from "../config/db";
import type { AuthenticatedRequest } from "../middleware/authMiddleware";
import { followUser, unfollowUser } from "../services/followService";

function getSingleRouteParam(value: string | string[] | undefined): string | undefined {
  if (typeof value === "string") {
    return value.trim();
  }

  if (Array.isArray(value)) {
    return value[0]?.trim();
  }

  return undefined;
}

function sendFollowError(error: unknown, res: Response): Response {
  if (error instanceof Error) {
    if (error.message === "SELF_FOLLOW_NOT_ALLOWED") {
      return res.status(400).json({ error: "You cannot follow yourself" });
    }

    if (error.message === "TARGET_NOT_FOUND") {
      return res.status(404).json({ error: "Reader not found" });
    }
  }

  return res.status(500).json({ error: "FOLLOW_REQUEST_FAILED" });
}

export async function followReader(req: AuthenticatedRequest, res: Response) {
  try {
    await connect();

    const actorUserId = req.userId;
    const targetUserId = getSingleRouteParam(req.params.targetUserId);

    if (!actorUserId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!targetUserId) {
      return res.status(404).json({ error: "Reader not found" });
    }

    const result = await followUser(actorUserId, targetUserId);

    return res.status(200).json({
      error: null,
      data: result
    });
  } catch (error) {
    return sendFollowError(error, res);
  }
}

export async function unfollowReader(req: AuthenticatedRequest, res: Response) {
  try {
    await connect();

    const actorUserId = req.userId;
    const targetUserId = getSingleRouteParam(req.params.targetUserId);

    if (!actorUserId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!targetUserId) {
      return res.status(404).json({ error: "Reader not found" });
    }

    const result = await unfollowUser(actorUserId, targetUserId);

    return res.status(200).json({
      error: null,
      data: result
    });
  } catch (error) {
    return sendFollowError(error, res);
  }
}
