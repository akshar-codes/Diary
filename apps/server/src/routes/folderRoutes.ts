import { Router } from "express";
import { FolderController } from "../controllers/folderController";
import { requireAuth } from "../middlewares/authMiddleware";
import { validate } from "../middlewares/validateMiddleware";
import { createFolderSchema, updateFolderSchema } from "@notes/shared";

const router = Router();

router.use(requireAuth);

router.get("/", FolderController.getFolders);
router.post("/", validate(createFolderSchema), FolderController.createFolder);
router.patch(
  "/:id",
  validate(updateFolderSchema),
  FolderController.updateFolder,
);
router.delete("/:id", FolderController.deleteFolder);

export default router;
