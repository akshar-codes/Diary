import React, { useState } from "react";
import { ChevronRight, Plus, X, BookOpen } from "lucide-react";
import { TopicPageSummary } from "@notes/shared";
import { AddTopicModal } from "./AddTopicModal";

interface RelatedTopicsSectionProps {
  topics: TopicPageSummary[];
  onOpenTopic: (topicId: string) => void;
  onLinkExisting: (topicId: string) => Promise<void>;
  onCreateAndLink: (title: string) => Promise<void>;
  onUnlinkTopic: (topicId: string) => Promise<void>;
}

export const RelatedTopicsSection: React.FC<RelatedTopicsSectionProps> = ({
  topics,
  onOpenTopic,
  onLinkExisting,
  onCreateAndLink,
  onUnlinkTopic,
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [unlinkingId, setUnlinkingId] = useState<string | null>(null);

  const alreadyLinked = new Set(topics.map((t) => t.id));

  const handleUnlink = async (e: React.MouseEvent, topicId: string) => {
    e.stopPropagation();
    if (
      confirm(
        "Remove this topic from today's entry? (The topic page will remain safe in Topics)",
      )
    ) {
      setUnlinkingId(topicId);
      try {
        await onUnlinkTopic(topicId);
      } finally {
        setUnlinkingId(null);
      }
    }
  };

  return (
    <div className="pt-6 border-t border-zinc-200/80 dark:border-zinc-800/80 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-zinc-400" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Related Topics
          </h3>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-1 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white px-2 py-1 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Related Topic</span>
        </button>
      </div>

      {topics.length === 0 ? (
        <p className="text-xs text-zinc-400 dark:text-zinc-500 italic py-2">
          No topics linked yet. Connect a topic like a person, place or memory
          to track it across multiple days.
        </p>
      ) : (
        <div className="space-y-1.5">
          {topics.map((topic) => (
            <div
              key={topic.id}
              onClick={() => onOpenTopic(topic.id)}
              className="group flex items-center justify-between p-3 rounded-lg border border-zinc-200/70 dark:border-zinc-800/70 bg-white dark:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-xs cursor-pointer transition-all"
            >
              <div className="flex-1 min-w-0 pr-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                    {topic.title}
                  </span>
                  {topic.preview && (
                    <span className="text-xs text-zinc-400 truncate max-w-xs hidden sm:inline">
                      — {topic.preview}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={(e) => handleUnlink(e, topic.id)}
                  disabled={unlinkingId === topic.id}
                  className="p-1 rounded-md text-zinc-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 opacity-0 group-hover:opacity-100 transition-all"
                  title="Remove link"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
                <div className="flex items-center text-zinc-400 group-hover:text-zinc-700 dark:group-hover:text-zinc-200 group-hover:translate-x-0.5 transition-all">
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <AddTopicModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onLinkExisting={onLinkExisting}
        onCreateAndLink={onCreateAndLink}
        alreadyLinkedIds={alreadyLinked}
      />
    </div>
  );
};
