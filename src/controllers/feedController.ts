import type { Response } from "express";
import { connect } from "../config/db";
import type { AuthenticatedRequest } from "../middleware/authMiddleware";
import { getHomeFeed as getHomeFeedData } from "../services/feedService";

const parseLimit = (value: unknown): number | undefined => {
  if (typeof value !== "string") {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const parseIncludeSelf = (value: unknown): boolean => {
  if (typeof value !== "string") {
    return true;
  }

  return value.trim().toLowerCase() !== "false";
};

export async function getHomeFeed(req: AuthenticatedRequest, res: Response) {
  try {
    await connect();

    const actorUserId = req.userId;

    if (!actorUserId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const data = await getHomeFeedData(actorUserId, {
      limit: parseLimit(req.query.limit),
      cursor: typeof req.query.cursor === "string" ? req.query.cursor : undefined,
      includeSelf: parseIncludeSelf(req.query.includeSelf)
    });

    return res.status(200).json({
      error: null,
      data
    });
  } catch (error) {
    return res.status(500).json({
      error: "HOME_FEED_FAILED",
      message: error instanceof Error ? error.message : "Failed to fetch home feed"
    });
  }
}
