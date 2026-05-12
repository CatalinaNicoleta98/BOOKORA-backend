import type { Response } from "express";
import { connect } from "../config/db";
import type { AuthenticatedRequest } from "../middleware/authMiddleware";
import {
  getPublicReaderFollowersByHandle,
  getPublicReaderFollowingByHandle,
  getPublicReaderProfile,
  searchPublicReaders
} from "../services/publicReaderProfileService";

function getSingleRouteParam(value: string | string[] | undefined): string | undefined {
  if (typeof value === "string") {
    return value.trim();
  }

  if (Array.isArray(value)) {
    return value[0]?.trim();
  }

  return undefined;
}

export async function getReaderProfileByHandle(req: AuthenticatedRequest, res: Response) {
  try {
    await connect();

    const rawHandle = Array.isArray(req.params.handle) ? req.params.handle[0] : req.params.handle;
    const handle = rawHandle?.trim();

    if (!handle) {
      return res.status(404).json({ error: "Reader not found" });
    }

    const profile = await getPublicReaderProfile(handle, req.userId);

    if (!profile) {
      return res.status(404).json({ error: "Reader not found" });
    }

    return res.status(200).json({
      error: null,
      data: profile
    });
  } catch (error) {
    return res.status(500).json({
      error: "READER_PROFILE_FAILED",
      message: error instanceof Error ? error.message : "Failed to fetch reader profile"
    });
  }
}

export async function getReaderFollowersByHandle(req: AuthenticatedRequest, res: Response) {
  try {
    await connect();

    const handle = getSingleRouteParam(req.params.handle);

    if (!handle) {
      return res.status(404).json({ error: "Reader not found" });
    }

    const followers = await getPublicReaderFollowersByHandle(handle);

    if (!followers) {
      return res.status(404).json({ error: "Reader not found" });
    }

    return res.status(200).json({
      error: null,
      data: {
        followers
      }
    });
  } catch (error) {
    return res.status(500).json({
      error: "READER_FOLLOWERS_FAILED",
      message: error instanceof Error ? error.message : "Failed to fetch followers"
    });
  }
}

export async function getReaderFollowingByHandle(req: AuthenticatedRequest, res: Response) {
  try {
    await connect();

    const handle = getSingleRouteParam(req.params.handle);

    if (!handle) {
      return res.status(404).json({ error: "Reader not found" });
    }

    const following = await getPublicReaderFollowingByHandle(handle);

    if (!following) {
      return res.status(404).json({ error: "Reader not found" });
    }

    return res.status(200).json({
      error: null,
      data: {
        following
      }
    });
  } catch (error) {
    return res.status(500).json({
      error: "READER_FOLLOWING_FAILED",
      message: error instanceof Error ? error.message : "Failed to fetch following"
    });
  }
}

export async function searchReaders(req: AuthenticatedRequest, res: Response) {
  try {
    await connect();

    const rawQuery = Array.isArray(req.query.q) ? req.query.q[0] : req.query.q;
    const q = typeof rawQuery === "string" ? rawQuery.trim() : "";
    const rawLimit = Array.isArray(req.query.limit) ? req.query.limit[0] : req.query.limit;
    const limit = typeof rawLimit === "string" ? Number(rawLimit) : undefined;

    if (!q) {
      return res.status(400).json({
        error: "INVALID_READER_SEARCH",
        message: "Query parameter q is required"
      });
    }

    const readers = await searchPublicReaders(q, limit);

    return res.status(200).json({
      error: null,
      data: {
        readers,
        query: q
      }
    });
  } catch (error) {
    return res.status(500).json({
      error: "READER_SEARCH_FAILED",
      message: error instanceof Error ? error.message : "Failed to search readers"
    });
  }
}
