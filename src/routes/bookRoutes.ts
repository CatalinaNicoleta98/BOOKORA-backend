import { Router } from "express";
import { getBookById, searchBooks } from "../controllers/bookController";

const router = Router();

router.get("/:id", getBookById);
router.get("/search", searchBooks);

export default router;
