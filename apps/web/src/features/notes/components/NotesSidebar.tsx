import React, { useState } from "react";
import {
  FileText,
  Folder as FolderIcon,
  Plus,
  Tag as TagIcon,
  Archive,
  Trash2,
  Pin,
  MoreVertical,
  Edit2,
  Trash,
} from "lucide-react";
import { NoteFolder, NoteStatusFilter } from "@notes/shared";
import { useFolders, useDeleteFolder } from "../hooks/useFolders";
import { useTags, useEmptyTrash } from "../hooks/useNotes";
import { FolderModal } from "./FolderModal";

interface NotesSidebarProps {
  currentStatus: NoteStatusFilter;
  selectedFolderId?: string | null;
  selectedTag?: string;
  isPinnedFilter?: boolean;
  onSelectView: (opts: {
    status?: NoteStatusFilter;
    folderId?: string | null;
    tag?: string;
    isPinned?: boolean;
  }) => void;
}

export const NotesSidebar: React.FC<NotesSidebarProps> = ({
  currentStatus,
  selectedFolderId,
  selectedTag,
  isPinnedFilter,
  onSelectView,
}) => {
  const { data: folders = [] } = useFolders();
  const { data: tags = [] } = useTags();
  const deleteFolderMutation = useDeleteFolder();
  const emptyTrashMutation = useEmptyTrash();

  const [folderModalOpen, setFolderModalOpen] = useState(false);
  const [folderToEdit, setFolderToEdit] = useState<NoteFolder | null>(null);
  const [activeFolderMenu, setActiveFolderMenu] = useState<string | null>(null);

  const handleDeleteFolder = async (
    e: React.MouseEvent,
    folder: NoteFolder,
  ) => {
    e.stopPropagation();
    if (
      confirm(
        `Delete folder "${folder.name}"? Notes inside will not be deleted.`,
      )
    ) {
      await deleteFolderMutation.mutateAsync(folder.id);
      setActiveFolderMenu(null);
    }
  };

  const handleEmptyTrash = async () => {
    if (
      confirm(
        "Permanently delete all notes currently in Trash? This cannot be undone.",
      )
    ) {
      await emptyTrashMutation.mutateAsync();
    }
  };

  return (
    <aside className="w-56 border-r border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/50 flex flex-col h-full shrink-0 select-none overflow-y-auto p-3 space-y-5 text-xs">
      {/* Primary Section */}
      <div className="space-y-1">
        <button
          onClick={() =>
            onSelectView({
              status: "active",
              folderId: undefined,
              tag: undefined,
              isPinned: undefined,
            })
          }
          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg font-medium transition-colors ${
            currentStatus === "active" &&
            !selectedFolderId &&
            !selectedTag &&
            isPinnedFilter === undefined
              ? "bg-zinc-200/80 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-semibold"
              : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/60"
          }`}
        >
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-zinc-400" />
            <span>All Notes</span>
          </div>
        </button>

        <button
          onClick={() =>
            onSelectView({
              status: "active",
              folderId: undefined,
              tag: undefined,
              isPinned: true,
            })
          }
          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg font-medium transition-colors ${
            isPinnedFilter
              ? "bg-zinc-200/80 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-semibold"
              : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/60"
          }`}
        >
          <div className="flex items-center gap-2">
            <Pin className="w-4 h-4 text-amber-500" />
            <span>Pinned</span>
          </div>
        </button>
      </div>

      {/* Folders Section */}
      <div>
        <div className="flex items-center justify-between px-2.5 py-1 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
          <span>Folders</span>
          <button
            onClick={() => {
              setFolderToEdit(null);
              setFolderModalOpen(true);
            }}
            className="p-1 rounded hover:bg-zinc-200/60 dark:hover:bg-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
            title="Create Folder"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="mt-1 space-y-0.5">
          {folders.length === 0 ? (
            <p className="px-2.5 py-1.5 text-zinc-400 italic text-[11px]">
              No folders
            </p>
          ) : (
            folders.map((folder) => {
              const isSelected = selectedFolderId === folder.id;
              return (
                <div
                  key={folder.id}
                  onClick={() =>
                    onSelectView({
                      status: "active",
                      folderId: folder.id,
                      tag: undefined,
                      isPinned: undefined,
                    })
                  }
                  className={`group relative flex items-center justify-between px-2.5 py-1.5 rounded-lg cursor-pointer transition-colors ${
                    isSelected
                      ? "bg-zinc-200/80 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-semibold"
                      : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/60"
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <FolderIcon className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                    <span className="truncate">{folder.name}</span>
                  </div>

                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-zinc-400">
                      {folder.noteCount || 0}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveFolderMenu(
                          activeFolderMenu === folder.id ? null : folder.id,
                        );
                      }}
                      className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-zinc-300 dark:hover:bg-zinc-700 rounded text-zinc-500"
                    >
                      <MoreVertical className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Context menu for folder */}
                  {activeFolderMenu === folder.id && (
                    <div
                      className="absolute right-2 top-8 z-30 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-lg py-1 w-28"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => {
                          setFolderToEdit(folder);
                          setFolderModalOpen(true);
                          setActiveFolderMenu(null);
                        }}
                        className="w-full flex items-center gap-1.5 px-3 py-1.5 text-left text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                      >
                        <Edit2 className="w-3 h-3" />
                        <span>Rename</span>
                      </button>
                      <button
                        onClick={(e) => handleDeleteFolder(e, folder)}
                        className="w-full flex items-center gap-1.5 px-3 py-1.5 text-left text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                      >
                        <Trash className="w-3 h-3" />
                        <span>Delete</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Tags Section */}
      {tags.length > 0 && (
        <div>
          <div className="px-2.5 py-1 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
            Tags
          </div>
          <div className="mt-1 flex flex-wrap gap-1 px-2.5">
            {tags.map((tag) => {
              const isSelected = selectedTag === tag;
              return (
                <button
                  key={tag}
                  onClick={() =>
                    onSelectView({
                      status: "active",
                      folderId: undefined,
                      tag: isSelected ? undefined : tag,
                      isPinned: undefined,
                    })
                  }
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium transition-colors ${
                    isSelected
                      ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                      : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                  }`}
                >
                  <TagIcon className="w-2.5 h-2.5" />
                  <span>{tag}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Archive & Trash Section */}
      <div className="pt-2 border-t border-zinc-200/80 dark:border-zinc-800/80 space-y-1">
        <button
          onClick={() =>
            onSelectView({
              status: "archived",
              folderId: undefined,
              tag: undefined,
              isPinned: undefined,
            })
          }
          className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg font-medium transition-colors ${
            currentStatus === "archived"
              ? "bg-zinc-200/80 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-semibold"
              : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/60"
          }`}
        >
          <Archive className="w-4 h-4 text-zinc-400" />
          <span>Archive</span>
        </button>

        <div className="flex items-center justify-between">
          <button
            onClick={() =>
              onSelectView({
                status: "trash",
                folderId: undefined,
                tag: undefined,
                isPinned: undefined,
              })
            }
            className={`flex-1 flex items-center gap-2 px-2.5 py-1.5 rounded-lg font-medium transition-colors ${
              currentStatus === "trash"
                ? "bg-zinc-200/80 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-semibold"
                : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/60"
            }`}
          >
            <Trash2 className="w-4 h-4 text-zinc-400" />
            <span>Trash</span>
          </button>

          {currentStatus === "trash" && (
            <button
              onClick={handleEmptyTrash}
              className="px-2 py-1 text-[10px] font-medium text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded"
              title="Empty Trash"
            >
              Empty
            </button>
          )}
        </div>
      </div>

      <FolderModal
        isOpen={folderModalOpen}
        onClose={() => setFolderModalOpen(false)}
        folderToEdit={folderToEdit}
      />
    </aside>
  );
};
