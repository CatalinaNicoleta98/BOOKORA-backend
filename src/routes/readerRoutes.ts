import { Router } from "express";
import { getReaderProfileByHandle } from "../controllers/readerController";

const router = Router();

router.get("/:handle", getReaderProfileByHandle);

export default router;
