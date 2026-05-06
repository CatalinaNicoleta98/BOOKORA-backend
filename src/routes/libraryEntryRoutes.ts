import { Router } from "express";
import { verifyToken } from "../middleware/authMiddleware";
import {
  createLibraryEntry,
  getMyLibrary,
  updateLibraryEntry,
  deleteLibraryEntry
} from "../controllers/libraryEntryController";

const router = Router();

router.post("/", verifyToken, createLibraryEntry);
router.get("/", verifyToken, getMyLibrary);
router.put("/:id", verifyToken, updateLibraryEntry);
router.delete("/:id", verifyToken, deleteLibraryEntry);

export default router;