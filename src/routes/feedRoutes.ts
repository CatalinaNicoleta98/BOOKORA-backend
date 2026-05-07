import { Router } from "express";
import { getHomeFeed } from "../controllers/feedController";
import { verifyToken } from "../middleware/authMiddleware";

const router = Router();

router.get("/home", verifyToken, getHomeFeed);

export default router;
