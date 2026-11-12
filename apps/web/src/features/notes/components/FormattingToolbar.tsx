import React from "react";
import {
  Bold,
  Italic,
  Underline,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  CheckSquare,
  Code,
  Link as LinkIcon,
} from "lucide-react";

interface FormattingToolbarProps {
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  content: string;
  onChange: (newContent: string) => void;
}

export const FormattingToolbar: React.FC<FormattingToolbarProps> = ({
  textareaRef,
  content,
  onChange,
}) => {
  const applyFormat = (prefix: string, suffix = "", defaultText = "text") => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end) || defaultText;

    const replacement = `${prefix}${selectedText}${suffix}`;
    const newContent =
      content.substring(0, start) + replacement + content.substring(end);

    onChange(newContent);

    // Reposition cursor
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + prefix.length,
        start + prefix.length + selectedText.length,
      );
    }, 0);
  };

  const applyLinePrefix = (prefix: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const lineStart = content.lastIndexOf("\n", start - 1) + 1;

    const newContent =
      content.substring(0, lineStart) + prefix + content.substring(lineStart);
    onChange(newContent);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length);
    }, 0);
  };

  const insertLink = () => {
    const url = prompt("Enter URL:");
    if (!url) return;
    applyFormat("[", `](${url})`, "Link Text");
  };

  const buttons = [
    {
      label: "Bold",
      icon: Bold,
      action: () => applyFormat("**", "**", "bold text"),
    },
    {
      label: "Italic",
      icon: Italic,
      action: () => applyFormat("*", "*", "italic text"),
    },
    {
      label: "Underline",
      icon: Underline,
      action: () => applyFormat("<u>", "</u>", "underlined text"),
    },
    { label: "Heading 1", icon: Heading1, action: () => applyLinePrefix("# ") },
    {
      label: "Heading 2",
      icon: Heading2,
      action: () => applyLinePrefix("## "),
    },
    {
      label: "Heading 3",
      icon: Heading3,
      action: () => applyLinePrefix("### "),
    },
    { label: "Bullet List", icon: List, action: () => applyLinePrefix("- ") },
    {
      label: "Numbered List",
      icon: ListOrdered,
      action: () => applyLinePrefix("1. "),
    },
    {
      label: "Checklist",
      icon: CheckSquare,
      action: () => applyLinePrefix("- [ ] "),
    },
    { label: "Code", icon: Code, action: () => applyFormat("`", "`", "code") },
    { label: "Link", icon: LinkIcon, action: insertLink },
  ];

  return (
    <div className="flex items-center gap-0.5 p-1 border-y border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/70 dark:bg-zinc-900/70 overflow-x-auto select-none">
      {buttons.map((btn, idx) => {
        const Icon = btn.icon;
        return (
          <button
            key={idx}
            type="button"
            onClick={btn.action}
            title={btn.label}
            className="p-1.5 rounded hover:bg-zinc-200/70 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
          >
            <Icon className="w-3.5 h-3.5" />
          </button>
        );
      })}
    </div>
  );
};
