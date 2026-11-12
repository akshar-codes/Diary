import React, { useState, useEffect, useRef } from "react";
import {
  ArrowLeft,
  Trash2,
  Calendar,
  ChevronRight,
  CalendarPlus,
  ExternalLink,
  Eye,
  Edit3,
  Clock,
  Sparkles,
} from "lucide-react";
import {
  formatDisplayDate,
  formatShortDate,
  getTodayDateKey,
  extractDatedLines,
  expandDateShortcuts,
} from "@notes/shared";
import {
  useTopicDetail,
  useUpdateTopic,
  useDeleteTopic,
} from "../hooks/useTopics";
import {
  AutosaveBadge,
  SaveStatus,
} from "../../../components/common/AutosaveBadge";
import { Button } from "../../../components/ui/Button";

interface TopicEditorProps {
  topicId: string;
  onBack: () => void;
  onNavigateToDate: (dateKey: string) => void;
}

export const TopicEditor: React.FC<TopicEditorProps> = ({
  topicId,
  onBack,
  onNavigateToDate,
}) => {
  const { data: topic, isLoading } = useTopicDetail(topicId);
  const updateMutation = useUpdateTopic();
  const deleteMutation = useDeleteTopic();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [viewMode, setViewMode] = useState<"edit" | "interactive">("edit");

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const dateInputRef = useRef<HTMLInputElement | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (topic) {
      setTitle(topic.title || "");
      setContent(topic.content || "");
      setSaveStatus("idle");
    }
  }, [topic]);

  const triggerAutosave = (newTitle: string, newContent: string) => {
    setSaveStatus("unsaved");
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

    debounceTimerRef.current = setTimeout(async () => {
      setSaveStatus("saving");
      try {
        await updateMutation.mutateAsync({
          id: topicId,
          title: newTitle,
          content: newContent,
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
    triggerAutosave(val, content);
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    let val = e.target.value;
    // Auto expand shortcuts like @today, @yesterday
    const expanded = expandDateShortcuts(val);
    setContent(expanded);
    triggerAutosave(title, expanded);
  };

  const insertDateAtCursor = (dateKey: string) => {
    const textarea = textareaRef.current;
    const tag = `@${dateKey} `;

    if (!textarea) {
      const updated = content ? `${content}\n${tag}` : tag;
      setContent(updated);
      triggerAutosave(title, updated);
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const before = content.substring(0, start);
    const after = content.substring(end);

    // If not at the beginning of a line, add a newline first
    const needsPrefixNewline = start > 0 && before[start - 1] !== "\n";
    const insertion = needsPrefixNewline ? `\n${tag}` : tag;

    const updated = before + insertion + after;
    setContent(updated);
    triggerAutosave(title, updated);

    setTimeout(() => {
      textarea.focus();
      const newPos = start + insertion.length;
      textarea.setSelectionRange(newPos, newPos);
    }, 10);
  };

  const handleAttachToday = () => {
    insertDateAtCursor(getTodayDateKey());
  };

  const handleCustomDateSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.value;
    if (selected) {
      insertDateAtCursor(selected);
      e.target.value = "";
    }
  };

  const handleDelete = async () => {
    if (
      confirm(
        `Are you sure you want to delete the "${topic?.title}" topic page? Your associated diary daily entries will remain completely intact.`,
      )
    ) {
      await deleteMutation.mutateAsync(topicId);
      onBack();
    }
  };

  const datedLines = extractDatedLines(content);
  const todayKey = getTodayDateKey();

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 text-zinc-400">
        Loading topic page...
      </div>
    );
  }

  if (!topic) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-3">
        <p className="text-zinc-500">Topic page not found.</p>
        <Button variant="secondary" onClick={onBack}>
          Back to Topics
        </Button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full max-w-4xl mx-auto w-full px-4 sm:px-8 py-6 overflow-y-auto">
      {/* Top action header */}
      <div className="flex items-center justify-between pb-6">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        <div className="flex items-center gap-3">
          <AutosaveBadge status={saveStatus} lastSavedAt={lastSavedAt} />
          <button
            onClick={handleDelete}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
            title="Delete Topic Page"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Topic Title Input */}
      <div className="mb-3">
        <input
          type="text"
          value={title}
          onChange={handleTitleChange}
          placeholder="Topic Title..."
          className="w-full text-2xl sm:text-3xl font-bold tracking-tight bg-transparent text-zinc-900 dark:text-zinc-50 focus:outline-none placeholder-zinc-300 dark:placeholder-zinc-700"
        />
        <div className="flex items-center gap-4 text-xs text-zinc-400 mt-1">
          <span className="font-medium text-amber-600 dark:text-amber-400">
            Topic → Date Linking
          </span>
          <span>•</span>
          <span>
            Updated{" "}
            {new Date(topic.updatedAt).toLocaleDateString([], {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </span>
        </div>
      </div>

      {/* Date Attachment & Mode Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-lg bg-zinc-100/70 dark:bg-zinc-800/50 border border-zinc-200/60 dark:border-zinc-700/60 mb-4">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 mr-1 flex items-center gap-1">
            <CalendarPlus className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span>Attach Date:</span>
          </span>

          <button
            type="button"
            onClick={handleAttachToday}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-white dark:bg-zinc-700 text-zinc-800 dark:text-zinc-200 hover:bg-amber-50 hover:text-amber-700 dark:hover:bg-zinc-600 border border-zinc-200 dark:border-zinc-600 shadow-2xs transition-colors"
            title="Insert @YYYY-MM-DD for today"
          >
            <span>+ Today ({formatShortDate(todayKey)})</span>
          </button>

          <label className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-white dark:bg-zinc-700 text-zinc-800 dark:text-zinc-200 hover:bg-amber-50 hover:text-amber-700 dark:hover:bg-zinc-600 border border-zinc-200 dark:border-zinc-600 shadow-2xs transition-colors cursor-pointer">
            <Calendar className="w-3 h-3 text-zinc-400" />
            <span>Pick Date...</span>
            <input
              type="date"
              ref={dateInputRef}
              onChange={handleCustomDateSelect}
              className="sr-only"
            />
          </label>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-1 bg-zinc-200/70 dark:bg-zinc-700/60 p-0.5 rounded-md">
          <button
            type="button"
            onClick={() => setViewMode("edit")}
            className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
              viewMode === "edit"
                ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-2xs"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900"
            }`}
          >
            <Edit3 className="w-3 h-3" />
            <span>Write</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode("interactive")}
            className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
              viewMode === "interactive"
                ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-2xs"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900"
            }`}
          >
            <Eye className="w-3 h-3" />
            <span>Interactive View</span>
          </button>
        </div>
      </div>

      {/* Editor Body */}
      {viewMode === "edit" ? (
        <div className="flex-1 min-h-[300px] flex flex-col mb-4">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleContentChange}
            placeholder="Write about this topic... Attach a date to any line using @YYYY-MM-DD or the buttons above to link it to that day's Daily Journal."
            className="w-full flex-1 min-h-[280px] resize-none bg-transparent text-base sm:text-lg leading-relaxed text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none font-serif"
          />
          <div className="text-[11px] text-zinc-400 mt-2 flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-amber-500" />
            <span>
              Type{" "}
              <code className="bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded text-zinc-600 dark:text-zinc-300">
                @today
              </code>{" "}
              or{" "}
              <code className="bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded text-zinc-600 dark:text-zinc-300">
                @YYYY-MM-DD
              </code>{" "}
              on any line to attach a date to it.
            </span>
          </div>
        </div>
      ) : (
        <div className="flex-1 min-h-[300px] flex flex-col mb-4 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/70 font-serif leading-relaxed text-zinc-800 dark:text-zinc-200">
          {!content ? (
            <p className="text-zinc-400 italic">
              No notes written yet. Switch to Write mode to add lines with
              dates.
            </p>
          ) : (
            <div className="space-y-2">
              {content.split("\n").map((line, idx) => {
                if (!line.trim()) return <div key={idx} className="h-4" />;
                const lineDates = extractDatedLines(line);
                if (!lineDates.length) {
                  return (
                    <p key={idx} className="text-base sm:text-lg">
                      {line}
                    </p>
                  );
                }
                const firstDate = lineDates[0].dateKey;
                const cleanText = lineDates[0].cleanLine;
                return (
                  <div
                    key={idx}
                    className="flex flex-wrap items-center gap-2 group py-1 border-b border-zinc-100 dark:border-zinc-800/50"
                  >
                    <button
                      onClick={() => onNavigateToDate(firstDate)}
                      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 hover:bg-amber-200 text-amber-900 dark:bg-amber-950/60 dark:hover:bg-amber-900/80 dark:text-amber-200 border border-amber-300/60 dark:border-amber-800 transition-colors shadow-2xs cursor-pointer"
                      title={`Jump to Daily Journal for ${firstDate}`}
                    >
                      <Calendar className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                      <span>{formatShortDate(firstDate)}</span>
                      <ExternalLink className="w-3 h-3 opacity-70 group-hover:opacity-100" />
                    </button>
                    <span className="text-base sm:text-lg text-zinc-900 dark:text-zinc-100">
                      {cleanText}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Dated Lines in this Topic (Interactive Jump Cards) */}
      {datedLines.length > 0 && (
        <div className="my-6 p-4 rounded-xl border border-amber-200/70 dark:border-amber-900/40 bg-amber-50/40 dark:bg-amber-950/10 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-amber-900 dark:text-amber-300">
                Attached Dates in this Topic ({datedLines.length})
              </h3>
            </div>
            <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
              Click any line to jump to its Daily Journal
            </span>
          </div>

          <div className="space-y-2">
            {datedLines.map((dl, idx) => (
              <div
                key={idx}
                onClick={() => onNavigateToDate(dl.dateKey)}
                className="group flex items-center justify-between p-3 rounded-lg border border-amber-200/60 dark:border-amber-900/30 bg-white dark:bg-zinc-900 hover:border-amber-400 dark:hover:border-amber-700 cursor-pointer transition-all shadow-2xs"
              >
                <div className="flex items-center gap-3 min-w-0 pr-3">
                  <span className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                    <Calendar className="w-3 h-3" />
                    {formatShortDate(dl.dateKey)}
                  </span>
                  <p className="text-sm text-zinc-800 dark:text-zinc-200 truncate font-serif">
                    {dl.cleanLine || dl.line}
                  </p>
                </div>

                <div className="shrink-0 inline-flex items-center gap-1 text-xs font-medium text-amber-600 dark:text-amber-400 group-hover:translate-x-0.5 transition-transform">
                  <span>Go to Date</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Related Diary Entries Section */}
      <div className="pt-6 border-t border-zinc-200/80 dark:border-zinc-800/80 space-y-3">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-zinc-400" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            All Linked Diary Dates ({topic.relatedEntries?.length || 0})
          </h3>
        </div>

        {!topic.relatedEntries?.length ? (
          <p className="text-xs text-zinc-400 italic">
            This topic is not currently linked to any diary dates. Type @today
            or attach a date to any line above to automatically link it!
          </p>
        ) : (
          <div className="space-y-1.5">
            {topic.relatedEntries.map((entry) => (
              <div
                key={entry.id}
                onClick={() => onNavigateToDate(entry.dateKey)}
                className="group flex items-center justify-between p-3 rounded-lg border border-zinc-200/70 dark:border-zinc-800/70 bg-white dark:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-700 cursor-pointer transition-all shadow-2xs"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                    {formatDisplayDate(entry.dateKey)}
                  </span>
                </div>
                <div className="flex items-center text-zinc-400 group-hover:text-zinc-700 dark:group-hover:text-zinc-200 group-hover:translate-x-0.5 transition-all">
                  <span className="text-xs mr-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    Open Entry
                  </span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
