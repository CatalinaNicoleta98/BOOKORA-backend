import type { Request, Response } from "express";
import { getPublicReaderProfile } from "../services/publicReaderProfileService";

export async function getReaderProfileByHandle(req: Request, res: Response) {
  try {
    const rawHandle = Array.isArray(req.params.handle) ? req.params.handle[0] : req.params.handle;
    const handle = rawHandle?.trim();

    if (!handle) {
      return res.status(404).json({ error: "Reader not found" });
    }

    const profile = await getPublicReaderProfile(handle);

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
