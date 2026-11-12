import { Router } from "express";
import { NoteController } from "../controllers/noteController";
import { requireAuth } from "../middlewares/authMiddleware";
import { validate } from "../middlewares/validateMiddleware";
import { createNoteSchema, updateNoteSchema } from "@notes/shared";

const router = Router();

// All notes routes require authentication
router.use(requireAuth);

router.get("/", NoteController.getNotes);
router.get("/tags", NoteController.getTags);
router.post("/", validate(createNoteSchema), NoteController.createNote);
router.delete("/trash/empty", NoteController.emptyTrash);
router.post("/trash/purge", NoteController.purgeOldTrash);

router.get("/:id", NoteController.getNoteById);
router.patch("/:id", validate(updateNoteSchema), NoteController.updateNote);
router.delete("/:id", NoteController.moveToTrash); // Soft delete to trash

// Specific operations
router.post("/:id/duplicate", NoteController.duplicateNote);
router.patch("/:id/pin", NoteController.togglePin);
router.patch("/:id/archive", NoteController.toggleArchive);
router.patch("/:id/restore", NoteController.restoreFromTrash);
router.delete("/:id/permanent", NoteController.permanentDelete);

export default router;
