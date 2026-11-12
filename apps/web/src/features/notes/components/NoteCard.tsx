import React from "react";
import { Pin, Folder, Tag } from "lucide-react";
import { Note, extractPreviewText, formatShortDate } from "@notes/shared";

interface NoteCardProps {
  note: Note;
  isSelected: boolean;
  onSelect: () => void;
  onTogglePin?: (e: React.MouseEvent) => void;
}

export const NoteCard: React.FC<NoteCardProps> = ({
  note,
  isSelected,
  onSelect,
  onTogglePin,
}) => {
  const preview = extractPreviewText(note.content, 90);

  return (
    <div
      onClick={onSelect}
      className={`group relative p-3.5 rounded-xl border transition-all cursor-pointer select-none ${
        isSelected
          ? "bg-amber-50/70 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/60 shadow-xs"
          : "bg-white dark:bg-zinc-900 border-zinc-200/80 dark:border-zinc-800/80 hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-xs"
      }`}
    >
      {/* Header: Title & Pin */}
      <div className="flex items-start justify-between gap-2">
        <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate flex-1">
          {note.title || "Untitled Note"}
        </h4>

        {note.isPinned && (
          <Pin className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0 mt-0.5" />
        )}
      </div>

      {/* Content preview */}
      <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 leading-relaxed">
        {preview || <span className="italic text-zinc-400">Empty note</span>}
      </p>

      {/* Footer: Date, Folder & Tags */}
      <div className="mt-3 flex flex-wrap items-center gap-2 text-[10px] text-zinc-400">
        <span>{formatShortDate(note.updatedAt.split("T")[0])}</span>

        {note.folder && (
          <>
            <span>•</span>
            <span className="flex items-center gap-1 text-zinc-500 dark:text-zinc-400 truncate max-w-[100px]">
              <Folder className="w-2.5 h-2.5 shrink-0" />
              <span className="truncate">{note.folder.name}</span>
            </span>
          </>
        )}

        {note.tags.length > 0 && (
          <div className="flex items-center gap-1 overflow-hidden">
            <span>•</span>
            {note.tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="px-1.5 py-0.2 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 text-[10px]"
              >
                #{tag}
              </span>
            ))}
            {note.tags.length > 2 && <span>+{note.tags.length - 2}</span>}
          </div>
        )}
      </div>
    </div>
  );
};
