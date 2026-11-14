import React from "react";
import { RefreshCw, X, AlertTriangle } from "lucide-react";

interface Props {
  version?: string;
  releaseNotes?: string;
  hasUnsavedContent?: boolean;
  onUpdate: () => void;
  onDismiss: () => void;
}

export const UpdateBanner: React.FC<Props> = ({
  version,
  releaseNotes,
  hasUnsavedContent = false,
  onUpdate,
  onDismiss,
}) => {
  return (
    <div className="fixed top-0 inset-x-0 z-50 bg-zinc-900 dark:bg-zinc-100 text-zinc-50 dark:text-zinc-900 px-4 py-2.5 flex items-center justify-between gap-4 shadow-lg border-b border-zinc-800 dark:border-zinc-200">
      <div className="text-xs flex items-center gap-2 flex-1 min-w-0">
        <RefreshCw className="w-3.5 h-3.5 text-amber-400 shrink-0" />
        <span className="font-semibold">
          {version
            ? `Update v${version} available`
            : "A new web version is available"}
        </span>
        {releaseNotes && (
          <span className="text-zinc-400 dark:text-zinc-500 hidden sm:inline truncate">
            — {releaseNotes}
          </span>
        )}
        {hasUnsavedContent && (
          <span className="inline-flex items-center gap-1 text-amber-400 dark:text-amber-600 font-medium ml-2">
            <AlertTriangle className="w-3 h-3" />
            Save your work before updating
          </span>
        )}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={onUpdate}
          disabled={hasUnsavedContent}
          title={
            hasUnsavedContent
              ? "Please save your notes before updating"
              : "Reload to apply latest update"
          }
          className="text-xs font-semibold px-3 py-1 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50 rounded-lg disabled:opacity-40 hover:opacity-90 transition-opacity"
        >
          Refresh now
        </button>
        <button
          onClick={onDismiss}
          className="p-1 hover:opacity-70 transition-opacity text-zinc-400 hover:text-zinc-100 dark:hover:text-zinc-900"
          aria-label="Dismiss banner"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
