import { Router } from "express";
import {
  getReaderFollowersByHandle,
  getReaderFollowingByHandle,
  getReaderProfileByHandle
} from "../controllers/readerController";
import { attachOptionalUser } from "../middleware/authMiddleware";

const router = Router();

router.get("/:handle/followers", getReaderFollowersByHandle);
router.get("/:handle/following", getReaderFollowingByHandle);
router.get("/:handle", attachOptionalUser, getReaderProfileByHandle);

export default router;
