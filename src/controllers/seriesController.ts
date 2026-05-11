import { Request, Response } from "express";
import { getOpenLibrarySeriesByKey } from "../services/openLibraryService";

export const getSeriesByKey = async (req: Request, res: Response) => {
  try {
    const { seriesKey } = req.params;
    const normalizedSeriesKey = Array.isArray(seriesKey) ? seriesKey[0]?.trim() : seriesKey?.trim();

    if (!normalizedSeriesKey) {
      return res.status(400).json({
        error: "INVALID_SERIES_KEY",
        message: "Series key is required",
      });
    }

    const series = await getOpenLibrarySeriesByKey(normalizedSeriesKey);

    return res.status(200).json({
      error: null,
      data: series,
    });
  } catch (error) {
    console.error("Series details controller error", error);

    if (error instanceof Error && error.message === "Series not found.") {
      return res.status(404).json({
        error: "SERIES_NOT_FOUND",
        message: error.message,
      });
    }

    if (error instanceof Error) {
      return res.status(500).json({
        error: "SERIES_DETAILS_FAILED",
        message: error.message,
      });
    }

    return res.status(500).json({
      error: "SERIES_DETAILS_FAILED",
      message: "Failed to fetch series details",
    });
  }
};
