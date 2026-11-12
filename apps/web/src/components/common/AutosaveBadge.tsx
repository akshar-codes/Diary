import React from "react";
import { Check, Loader2, AlertCircle } from "lucide-react";

export type SaveStatus = "idle" | "saving" | "saved" | "error" | "unsaved";

interface AutosaveBadgeProps {
  status: SaveStatus;
  lastSavedAt?: Date | null;
}

export const AutosaveBadge: React.FC<AutosaveBadgeProps> = ({
  status,
  lastSavedAt,
}) => {
  if (status === "idle" && !lastSavedAt) return null;

  return (
    <div className="flex items-center gap-1.5 text-xs select-none">
      {status === "saving" && (
        <span className="flex items-center gap-1 text-zinc-500 dark:text-zinc-400">
          <Loader2 className="w-3.5 h-3.5 animate-spin text-zinc-400" />
          <span>Saving...</span>
        </span>
      )}

      {status === "saved" && (
        <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
          <Check className="w-3.5 h-3.5" />
          <span>Saved</span>
        </span>
      )}

      {status === "unsaved" && (
        <span className="flex items-center gap-1 text-amber-500">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          <span>Unsaved changes</span>
        </span>
      )}

      {status === "error" && (
        <span className="flex items-center gap-1 text-rose-500">
          <AlertCircle className="w-3.5 h-3.5" />
          <span>Failed to save</span>
        </span>
      )}

      {status === "idle" && lastSavedAt && (
        <span className="text-zinc-400 dark:text-zinc-500 text-[11px]">
          Saved{" "}
          {lastSavedAt.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      )}
    </div>
  );
};
