import { Router } from "express";
import { getAuthorByKey } from "../controllers/authorController";

const router = Router();

router.get("/:authorKey", getAuthorByKey);

export default router;
