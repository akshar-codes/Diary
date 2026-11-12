import React, { useState } from "react";
import { Search, Calendar, ChevronRight, BookOpen } from "lucide-react";
import { Modal } from "../../../components/ui/Modal";
import { apiClient } from "../../../lib/api/client";
import {
  formatDisplayDate,
  extractPreviewText,
  DiaryEntry,
} from "@notes/shared";

interface DiarySearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectDate: (dateKey: string) => void;
}

export const DiarySearchModal: React.FC<DiarySearchModalProps> = ({
  isOpen,
  onClose,
  onSelectDate,
}) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<DiaryEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (val: string) => {
    setQuery(val);
    if (!val.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const res = await apiClient.get(
        `/diary/entries?search=${encodeURIComponent(val.trim())}`,
      );
      setResults(res.data.data?.items || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (dateKey: string) => {
    onSelectDate(dateKey);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Search Journal Entries">
      <div className="space-y-4">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search keywords, thoughts, memories..."
            className="w-full pl-10 pr-4 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400"
            autoFocus
          />
        </div>

        <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
          {loading ? (
            <p className="text-xs text-zinc-400 text-center py-6">
              Searching...
            </p>
          ) : query && results.length === 0 ? (
            <p className="text-xs text-zinc-400 text-center py-6">
              No entries match "{query}"
            </p>
          ) : (
            results.map((entry) => {
              const preview = extractPreviewText(entry.content, 120);
              return (
                <div
                  key={entry.id}
                  onClick={() => handleSelect(entry.dateKey)}
                  className="group flex items-start justify-between p-3 rounded-lg border border-zinc-200/80 dark:border-zinc-800/80 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 cursor-pointer transition-colors"
                >
                  <div className="space-y-1 min-w-0 pr-3">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                      <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                      <span>{formatDisplayDate(entry.dateKey)}</span>
                    </div>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2">
                      {preview || (
                        <span className="italic text-zinc-400">
                          Empty entry
                        </span>
                      )}
                    </p>
                    {entry.topics && entry.topics.length > 0 && (
                      <div className="flex items-center gap-1 pt-1">
                        <span className="text-[10px] text-zinc-400">
                          Topics:
                        </span>
                        {entry.topics.map((t) => (
                          <span
                            key={t.id}
                            className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300"
                          >
                            {t.title}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-700 dark:group-hover:text-zinc-200 mt-1 shrink-0" />
                </div>
              );
            })
          )}
        </div>
      </div>
    </Modal>
  );
};
