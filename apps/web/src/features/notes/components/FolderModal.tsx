import React, { useState, useEffect } from "react";
import { Modal } from "../../../components/ui/Modal";
import { Input } from "../../../components/ui/Input";
import { Button } from "../../../components/ui/Button";
import { useCreateFolder, useUpdateFolder } from "../hooks/useFolders";
import { NoteFolder } from "@notes/shared";

interface FolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  folderToEdit?: NoteFolder | null;
}

export const FolderModal: React.FC<FolderModalProps> = ({
  isOpen,
  onClose,
  folderToEdit,
}) => {
  const [name, setName] = useState("");
  const createMutation = useCreateFolder();
  const updateMutation = useUpdateFolder();

  useEffect(() => {
    if (folderToEdit) {
      setName(folderToEdit.name);
    } else {
      setName("");
    }
  }, [folderToEdit, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (folderToEdit) {
      await updateMutation.mutateAsync({
        id: folderToEdit.id,
        data: { name: name.trim() },
      });
    } else {
      await createMutation.mutateAsync({ name: name.trim() });
    }
    onClose();
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={folderToEdit ? "Rename Folder" : "New Folder"}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Folder Name"
          placeholder="e.g. Work, Personal, Ideas"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
          required
        />
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isPending}>
            {folderToEdit ? "Save Changes" : "Create Folder"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
