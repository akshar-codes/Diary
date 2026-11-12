import React, { useState, useEffect, useRef } from "react";
import {
  Pin,
  Archive,
  Trash2,
  Copy,
  Paperclip,
  Folder,
  Tag,
  Plus,
  X,
  RotateCcw,
  FileText,
  Download,
} from "lucide-react";
import { Note, NoteFolder, NoteAttachment } from "@notes/shared";
import {
  useNoteDetail,
  useUpdateNote,
  useTrashNote,
  useRestoreNote,
  usePermanentDeleteNote,
  useTogglePin,
  useToggleArchive,
  useDuplicateNote,
} from "../hooks/useNotes";
import { useFolders } from "../hooks/useFolders";
import { FormattingToolbar } from "./FormattingToolbar";
import { MarkdownRenderer } from "./MarkdownRenderer";
import {
  AutosaveBadge,
  SaveStatus,
} from "../../../components/common/AutosaveBadge";
import { apiClient } from "../../../lib/api/client";

interface NoteEditorProps {
  noteId: string;
  onClose?: () => void;
  onSelectDuplicate?: (id: string) => void;
}

export const NoteEditor: React.FC<NoteEditorProps> = ({
  noteId,
  onClose,
  onSelectDuplicate,
}) => {
  const { data: note, isLoading } = useNoteDetail(noteId);
  const { data: folders = [] } = useFolders();

  const updateMutation = useUpdateNote();
  const trashMutation = useTrashNote();
  const restoreMutation = useRestoreNote();
  const permanentDeleteMutation = usePermanentDeleteNote();
  const togglePinMutation = useTogglePin();
  const toggleArchiveMutation = useToggleArchive();
  const duplicateMutation = useDuplicateNote();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [folderId, setFolderId] = useState<string | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [newTagInput, setNewTagInput] = useState("");
  const [showTagInput, setShowTagInput] = useState(false);
  const [attachments, setAttachments] = useState<NoteAttachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const [mode, setMode] = useState<"edit" | "preview">("edit");

  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (note) {
      setTitle(note.title || "");
      setContent(note.content || "");
      setFolderId(note.folderId || null);
      setTags(note.tags || []);
      setAttachments(note.attachments || []);
      setSaveStatus("idle");
    }
  }, [note]);

  const triggerAutosave = (updatedFields: {
    title?: string;
    content?: string;
    folderId?: string | null;
    tags?: string[];
  }) => {
    setSaveStatus("unsaved");
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

    debounceTimerRef.current = setTimeout(async () => {
      setSaveStatus("saving");
      try {
        await updateMutation.mutateAsync({
          id: noteId,
          data: {
            title: updatedFields.title ?? title,
            content: updatedFields.content ?? content,
            folderId:
              updatedFields.folderId !== undefined
                ? updatedFields.folderId
                : folderId,
            tags: updatedFields.tags ?? tags,
          },
        });
        setSaveStatus("saved");
        setLastSavedAt(new Date());
      } catch {
        setSaveStatus("error");
      }
    }, 800);
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTitle(val);
    triggerAutosave({ title: val });
  };

  const handleContentChange = (val: string) => {
    setContent(val);
    triggerAutosave({ content: val });
  };

  const handleFolderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value === "" ? null : e.target.value;
    setFolderId(val);
    triggerAutosave({ folderId: val });
  };

  const handleAddTag = (e: React.KeyboardEvent | React.MouseEvent) => {
    if ("key" in e && e.key !== "Enter") return;
    e.preventDefault();
    const clean = newTagInput.trim().toLowerCase();
    if (clean && !tags.includes(clean)) {
      const updated = [...tags, clean];
      setTags(updated);
      setNewTagInput("");
      setShowTagInput(false);
      triggerAutosave({ tags: updated });
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const updated = tags.filter((t) => t !== tagToRemove);
    setTags(updated);
    triggerAutosave({ tags: updated });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("noteId", noteId);

    setUploading(true);
    try {
      const res = await apiClient.post("/attachments/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (res.data.success) {
        setAttachments((prev) => [...prev, res.data.data]);
      }
    } catch {
      alert("Failed to upload file. Maximum size is 10MB.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleDeleteAttachment = async (attachmentId: string) => {
    try {
      await apiClient.delete(`/attachments/${attachmentId}`);
      setAttachments((prev) => prev.filter((a) => a.id !== attachmentId));
    } catch {
      alert("Failed to delete attachment.");
    }
  };

  const handleDuplicate = async () => {
    const copy = await duplicateMutation.mutateAsync(noteId);
    if (onSelectDuplicate) onSelectDuplicate(copy.id);
  };

  const isTrashed = Boolean(note?.deletedAt);
  const isArchived = Boolean(note?.archivedAt);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 text-zinc-400">
        Loading note...
      </div>
    );
  }

  if (!note) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 text-zinc-400">
        Select a note to view or edit.
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-white dark:bg-zinc-900 overflow-hidden">
      {/* Top action toolbar */}
      <div className="h-12 border-b border-zinc-200/80 dark:border-zinc-800/80 px-4 sm:px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          {/* Folder picker dropdown */}
          <div className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-400">
            <Folder className="w-3.5 h-3.5" />
            <select
              value={folderId || ""}
              onChange={handleFolderChange}
              disabled={isTrashed}
              className="bg-transparent border-none text-xs font-medium text-zinc-800 dark:text-zinc-200 focus:outline-none cursor-pointer"
            >
              <option value="">No Folder</option>
              {folders.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </div>

          {/* Edit / Preview Tabs */}
          <div className="flex items-center rounded-lg border border-zinc-200 dark:border-zinc-800 p-0.5 bg-zinc-100 dark:bg-zinc-800 text-xs">
            <button
              type="button"
              onClick={() => setMode("edit")}
              className={`px-2 py-0.5 rounded font-medium transition-colors ${
                mode === "edit"
                  ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-xs"
                  : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300"
              }`}
            >
              Edit
            </button>
            <button
              type="button"
              onClick={() => setMode("preview")}
              className={`px-2 py-0.5 rounded font-medium transition-colors ${
                mode === "preview"
                  ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-xs"
                  : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300"
              }`}
            >
              Preview
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <AutosaveBadge status={saveStatus} lastSavedAt={lastSavedAt} />

          {/* Action buttons */}
          {!isTrashed ? (
            <>
              <button
                onClick={() => togglePinMutation.mutate(noteId)}
                className={`p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors ${
                  note.isPinned
                    ? "text-amber-500 fill-amber-500"
                    : "text-zinc-400"
                }`}
                title={note.isPinned ? "Unpin Note" : "Pin Note"}
              >
                <Pin className="w-4 h-4" />
              </button>

              <button
                onClick={() => toggleArchiveMutation.mutate(noteId)}
                className={`p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors ${
                  isArchived ? "text-indigo-500" : "text-zinc-400"
                }`}
                title={isArchived ? "Unarchive Note" : "Archive Note"}
              >
                <Archive className="w-4 h-4" />
              </button>

              <button
                onClick={handleDuplicate}
                className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 transition-colors"
                title="Duplicate Note"
              >
                <Copy className="w-4 h-4" />
              </button>

              <label
                className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 cursor-pointer transition-colors"
                title="Attach file"
              >
                <Paperclip className="w-4 h-4" />
                <input
                  type="file"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={uploading}
                />
              </label>

              <button
                onClick={() => trashMutation.mutate(noteId)}
                className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 text-zinc-400 hover:text-rose-500 transition-colors"
                title="Move to Trash"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => restoreMutation.mutate(noteId)}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restore</span>
              </button>

              <button
                onClick={() => {
                  if (
                    confirm(
                      "Permanently delete this note? This cannot be undone.",
                    )
                  ) {
                    permanentDeleteMutation.mutate(noteId);
                  }
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 hover:bg-rose-100 dark:hover:bg-rose-900/40"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Forever</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Trashed Banner */}
      {isTrashed && (
        <div className="bg-rose-50 dark:bg-rose-950/30 border-b border-rose-200/60 dark:border-rose-900/40 px-4 py-2 text-xs text-rose-600 dark:text-rose-400 flex items-center justify-between">
          <span>This note is in the Trash. Restore it to make edits.</span>
        </div>
      )}

      {/* Title & Tags Header */}
      <div className="px-6 pt-5 pb-2 space-y-3">
        <input
          type="text"
          value={title}
          onChange={handleTitleChange}
          disabled={isTrashed}
          placeholder="Note Title"
          className="w-full text-2xl font-bold tracking-tight bg-transparent text-zinc-900 dark:text-zinc-50 focus:outline-none placeholder-zinc-300 dark:placeholder-zinc-700"
        />

        {/* Tags bar */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          {tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
            >
              <Tag className="w-2.5 h-2.5 text-zinc-400" />
              <span>{tag}</span>
              {!isTrashed && (
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  className="hover:text-rose-500 ml-0.5"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              )}
            </span>
          ))}

          {!isTrashed &&
            (showTagInput ? (
              <div className="inline-flex items-center gap-1">
                <input
                  type="text"
                  placeholder="tag name"
                  value={newTagInput}
                  onChange={(e) => setNewTagInput(e.target.value)}
                  onKeyDown={handleAddTag}
                  className="px-2 py-0.5 text-xs rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 w-24 focus:outline-none"
                  autoFocus
                />
                <button
                  onClick={handleAddTag}
                  className="text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                >
                  Add
                </button>
                <button
                  onClick={() => setShowTagInput(false)}
                  className="text-xs text-zinc-400"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowTagInput(true)}
                className="inline-flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 py-0.5 px-1.5 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <Plus className="w-3 h-3" />
                <span>Add Tag</span>
              </button>
            ))}
        </div>
      </div>

      {/* Formatting Toolbar */}
      {mode === "edit" && !isTrashed && (
        <FormattingToolbar
          textareaRef={textareaRef}
          content={content}
          onChange={handleContentChange}
        />
      )}

      {/* Main Text Content Area */}
      <div className="flex-1 flex flex-col p-6 min-h-0 overflow-y-auto">
        {mode === "edit" ? (
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => handleContentChange(e.target.value)}
            disabled={isTrashed}
            placeholder="Start typing your note here... Use markdown or the toolbar above for formatting."
            className="w-full flex-1 min-h-[300px] resize-none bg-transparent text-sm sm:text-base leading-relaxed text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none font-sans"
          />
        ) : (
          <div className="flex-1 min-h-[300px]">
            <MarkdownRenderer content={content} />
          </div>
        )}

        {/* Attachments Section */}
        {attachments.length > 0 && (
          <div className="mt-8 pt-4 border-t border-zinc-200/80 dark:border-zinc-800/80 space-y-2">
            <h5 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
              Attachments ({attachments.length})
            </h5>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {attachments.map((att) => {
                const isImage = att.fileType.startsWith("image/");
                return (
                  <div
                    key={att.id}
                    className="group relative p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40 flex items-center gap-2 overflow-hidden"
                  >
                    {isImage ? (
                      <img
                        src={att.url}
                        alt={att.fileName}
                        className="w-8 h-8 rounded object-cover shrink-0"
                      />
                    ) : (
                      <FileText className="w-6 h-6 text-zinc-400 shrink-0" />
                    )}
                    <div className="truncate flex-1">
                      <p className="text-xs font-medium text-zinc-800 dark:text-zinc-200 truncate">
                        {att.fileName}
                      </p>
                      <p className="text-[10px] text-zinc-400">
                        {(att.fileSize / 1024).toFixed(1)} KB
                      </p>
                    </div>
                    {!isTrashed && (
                      <button
                        onClick={() => handleDeleteAttachment(att.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:text-rose-500 rounded"
                        title="Delete attachment"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
