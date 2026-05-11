import { Router } from "express";
import { getSeriesByKey } from "../controllers/seriesController";

const router = Router();

router.get("/:seriesKey", getSeriesByKey);

export default router;
