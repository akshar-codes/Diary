import { Router } from "express";
import {
  AttachmentController,
  uploadMiddleware,
} from "../controllers/attachmentController";
import { requireAuth } from "../middlewares/authMiddleware";

const router = Router();

router.use(requireAuth);

router.post(
  "/upload",
  uploadMiddleware.single("file"),
  AttachmentController.upload,
);
router.get("/note/:noteId", AttachmentController.getNoteAttachments);
router.delete("/:id", AttachmentController.deleteAttachment);

export default router;
