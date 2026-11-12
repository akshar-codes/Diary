import React, { useState } from "react";
import {
  Plus,
  Search,
  LayoutGrid,
  List as ListIcon,
  ArrowUpDown,
  Pin,
  Menu,
} from "lucide-react";
import { NoteStatusFilter, NoteSortOption } from "@notes/shared";
import { useNotes, useCreateNote } from "../hooks/useNotes";
import { NotesSidebar } from "../components/NotesSidebar";
import { NoteCard } from "../components/NoteCard";
import { NoteEditor } from "../components/NoteEditor";
import { Button } from "../../../components/ui/Button";

export const NotesPage: React.FC = () => {
  const [status, setStatus] = useState<NoteStatusFilter>("active");
  const [folderId, setFolderId] = useState<string | null | undefined>(
    undefined,
  );
  const [tag, setTag] = useState<string | undefined>(undefined);
  const [isPinnedFilter, setIsPinnedFilter] = useState<boolean | undefined>(
    undefined,
  );
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<NoteSortOption>("updated_desc");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { data: notesData, isLoading } = useNotes({
    status,
    folderId,
    tag,
    isPinned: isPinnedFilter,
    search,
    sort,
  });

  const createNoteMutation = useCreateNote();

  const handleCreateNote = async () => {
    const newNote = await createNoteMutation.mutateAsync({
      title: "Untitled Note",
      content: "",
      folderId: folderId && folderId !== "none" ? folderId : null,
      tags: tag ? [tag] : [],
      isPinned: false,
    });
    setSelectedNoteId(newNote.id);
  };

  const notes = notesData?.items || [];
  const pinnedNotes = notes.filter((n) => n.isPinned);
  const unpinnedNotes = notes.filter((n) => !n.isPinned);

  const handleSelectView = (opts: {
    status?: NoteStatusFilter;
    folderId?: string | null;
    tag?: string;
    isPinned?: boolean;
  }) => {
    if (opts.status) setStatus(opts.status);
    setFolderId(opts.folderId);
    setTag(opts.tag);
    setIsPinnedFilter(opts.isPinned);
    setSidebarOpen(false);
  };

  return (
    <div className="flex-1 flex h-full overflow-hidden bg-zinc-50 dark:bg-zinc-950">
      {/* Desktop Notes Sidebar */}
      <div className="hidden md:block">
        <NotesSidebar
          currentStatus={status}
          selectedFolderId={folderId}
          selectedTag={tag}
          isPinnedFilter={isPinnedFilter}
          onSelectView={handleSelectView}
        />
      </div>

      {/* Mobile Drawer */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-xs flex">
          <div className="w-64 bg-white dark:bg-zinc-900 h-full shadow-xl">
            <NotesSidebar
              currentStatus={status}
              selectedFolderId={folderId}
              selectedTag={tag}
              isPinnedFilter={isPinnedFilter}
              onSelectView={handleSelectView}
            />
          </div>
          <div className="flex-1" onClick={() => setSidebarOpen(false)} />
        </div>
      )}

      {/* Notes Middle Column: Notes List */}
      <div
        className={`w-full ${
          selectedNoteId ? "hidden lg:flex lg:w-80 xl:w-96" : "flex"
        } flex-col h-full border-r border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/70 dark:bg-zinc-950/70 shrink-0 overflow-hidden`}
      >
        {/* Notes Top Action Bar */}
        <div className="p-4 border-b border-zinc-200/80 dark:border-zinc-800/80 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300"
            >
              <Menu className="w-4 h-4" />
            </button>
            <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100 capitalize">
              {status === "trash"
                ? "Trash"
                : status === "archived"
                  ? "Archive"
                  : tag
                    ? `#${tag}`
                    : isPinnedFilter
                      ? "Pinned Notes"
                      : "All Notes"}
            </h2>
          </div>

          {status !== "trash" && (
            <Button size="sm" variant="primary" onClick={handleCreateNote}>
              <Plus className="w-3.5 h-3.5 mr-1" />
              <span>New</span>
            </Button>
          )}
        </div>

        {/* Search & Sort Controls */}
        <div className="px-4 py-2 space-y-2 border-b border-zinc-200/60 dark:border-zinc-800/60 bg-white/40 dark:bg-zinc-900/40">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Search title, content, or tags..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400"
            />
          </div>

          <div className="flex items-center justify-between text-xs text-zinc-500">
            {/* Sort Dropdown */}
            <div className="flex items-center gap-1">
              <ArrowUpDown className="w-3 h-3 text-zinc-400" />
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as NoteSortOption)}
                className="bg-transparent text-[11px] font-medium text-zinc-600 dark:text-zinc-300 focus:outline-none cursor-pointer"
              >
                <option value="updated_desc">Recently Modified</option>
                <option value="created_desc">Recently Created</option>
                <option value="title_asc">Title (A-Z)</option>
                <option value="title_desc">Title (Z-A)</option>
              </select>
            </div>

            {/* Grid / List toggle */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-1 rounded ${
                  viewMode === "grid"
                    ? "bg-zinc-200/80 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                    : "text-zinc-400"
                }`}
                title="Grid View"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-1 rounded ${
                  viewMode === "list"
                    ? "bg-zinc-200/80 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                    : "text-zinc-400"
                }`}
                title="List View"
              >
                <ListIcon className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Note Cards List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {isLoading ? (
            <div className="text-center py-12 text-xs text-zinc-400">
              Loading notes...
            </div>
          ) : notes.length === 0 ? (
            <div className="text-center py-16 space-y-2">
              <p className="text-xs text-zinc-400">No notes found</p>
              {status === "active" && (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={handleCreateNote}
                >
                  Create your first note
                </Button>
              )}
            </div>
          ) : (
            <>
              {/* Pinned section (if any and not filtering pinned already) */}
              {!isPinnedFilter && pinnedNotes.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-1 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                    <Pin className="w-3 h-3 text-amber-500 fill-amber-500" />
                    <span>Pinned ({pinnedNotes.length})</span>
                  </div>
                  <div
                    className={
                      viewMode === "grid"
                        ? "grid grid-cols-1 gap-2"
                        : "space-y-2"
                    }
                  >
                    {pinnedNotes.map((note) => (
                      <NoteCard
                        key={note.id}
                        note={note}
                        isSelected={selectedNoteId === note.id}
                        onSelect={() => setSelectedNoteId(note.id)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* All / Unpinned section */}
              <div className="space-y-2">
                {!isPinnedFilter && pinnedNotes.length > 0 && (
                  <div className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                    Notes
                  </div>
                )}
                <div
                  className={
                    viewMode === "grid" ? "grid grid-cols-1 gap-2" : "space-y-2"
                  }
                >
                  {(isPinnedFilter ? pinnedNotes : unpinnedNotes).map(
                    (note) => (
                      <NoteCard
                        key={note.id}
                        note={note}
                        isSelected={selectedNoteId === note.id}
                        onSelect={() => setSelectedNoteId(note.id)}
                      />
                    ),
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Note Editor Area */}
      <div
        className={`flex-1 h-full ${
          !selectedNoteId ? "hidden lg:flex" : "flex"
        } flex-col overflow-hidden bg-white dark:bg-zinc-900`}
      >
        {selectedNoteId ? (
          <div className="flex-1 flex flex-col h-full relative">
            <button
              onClick={() => setSelectedNoteId(null)}
              className="lg:hidden absolute top-3 left-4 z-20 text-xs text-zinc-500 hover:text-zinc-900 font-medium"
            >
              ← Back to Notes
            </button>
            <NoteEditor
              noteId={selectedNoteId}
              onClose={() => setSelectedNoteId(null)}
              onSelectDuplicate={(id) => setSelectedNoteId(id)}
            />
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-zinc-400 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400">
              <Search className="w-6 h-6" />
            </div>
            <p className="text-sm font-medium text-zinc-600 dark:text-zinc-300">
              No Note Selected
            </p>
            <p className="text-xs text-zinc-400 max-w-xs">
              Select an existing note from the list or create a new note to
              start writing.
            </p>
            {status !== "trash" && (
              <Button size="sm" variant="secondary" onClick={handleCreateNote}>
                Create New Note
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
