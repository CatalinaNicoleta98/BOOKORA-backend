import { Router } from "express";
import { getBookById, searchBooks } from "../controllers/bookController";

const router = Router();

router.get("/search", searchBooks);
router.get("/:id", getBookById);

export default router;
