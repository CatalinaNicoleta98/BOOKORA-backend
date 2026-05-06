import { Router } from "express";
import { followReader, unfollowReader } from "../controllers/followController";
import { verifyToken } from "../middleware/authMiddleware";

const router = Router();

router.post("/:targetUserId", verifyToken, followReader);
router.delete("/:targetUserId", verifyToken, unfollowReader);

export default router;
