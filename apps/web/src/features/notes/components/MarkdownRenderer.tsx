import React from "react";

interface MarkdownRendererProps {
  content: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
}) => {
  if (!content.trim()) {
    return (
      <p className="text-zinc-400 italic text-sm">
        Nothing to preview yet. Start typing your note.
      </p>
    );
  }

  const lines = content.split("\n");

  const renderFormattedText = (text: string) => {
    // Basic inline formatting: bold, italic, code, links
    let formatted: React.ReactNode = text;

    // We can parse inline tokens safely
    const parts = text.split(
      /(\*\*.*?\*\*|\*.*?\*|`.*?`|\[.*?\]\(.*?\)|<u>.*?<\/u>)/g,
    );

    return parts.map((part, index) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong
            key={index}
            className="font-bold text-zinc-900 dark:text-zinc-100"
          >
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith("*") && part.endsWith("*")) {
        return (
          <em key={index} className="italic">
            {part.slice(1, -1)}
          </em>
        );
      }
      if (part.startsWith("`") && part.endsWith("`")) {
        return (
          <code
            key={index}
            className="px-1.5 py-0.5 rounded text-xs font-mono bg-zinc-100 dark:bg-zinc-800 text-amber-600 dark:text-amber-400"
          >
            {part.slice(1, -1)}
          </code>
        );
      }
      if (part.startsWith("<u>") && part.endsWith("</u>")) {
        return (
          <span key={index} className="underline">
            {part.slice(3, -4)}
          </span>
        );
      }
      const linkMatch = part.match(/\[(.*?)\]\((.*?)\)/);
      if (linkMatch) {
        return (
          <a
            key={index}
            href={linkMatch[2]}
            target="_blank"
            rel="noopener noreferrer"
            className="text-amber-600 dark:text-amber-400 underline hover:text-amber-700"
          >
            {linkMatch[1]}
          </a>
        );
      }
      return part;
    });
  };

  return (
    <div className="space-y-2 text-zinc-800 dark:text-zinc-200 text-sm leading-relaxed">
      {lines.map((line, idx) => {
        // Heading 1
        if (line.startsWith("# ")) {
          return (
            <h1
              key={idx}
              className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 pt-3 pb-1"
            >
              {renderFormattedText(line.slice(2))}
            </h1>
          );
        }

        // Heading 2
        if (line.startsWith("## ")) {
          return (
            <h2
              key={idx}
              className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 pt-2 pb-1"
            >
              {renderFormattedText(line.slice(3))}
            </h2>
          );
        }

        // Heading 3
        if (line.startsWith("### ")) {
          return (
            <h3
              key={idx}
              className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 pt-1"
            >
              {renderFormattedText(line.slice(4))}
            </h3>
          );
        }

        // Checklist checked
        if (line.startsWith("- [x] ") || line.startsWith("- [X] ")) {
          return (
            <div key={idx} className="flex items-center gap-2 pl-2">
              <input
                type="checkbox"
                checked
                readOnly
                className="rounded text-amber-600"
              />
              <span className="line-through text-zinc-400">
                {renderFormattedText(line.slice(6))}
              </span>
            </div>
          );
        }

        // Checklist unchecked
        if (line.startsWith("- [ ] ")) {
          return (
            <div key={idx} className="flex items-center gap-2 pl-2">
              <input
                type="checkbox"
                checked={false}
                readOnly
                className="rounded text-zinc-400"
              />
              <span>{renderFormattedText(line.slice(6))}</span>
            </div>
          );
        }

        // Bullet list
        if (line.startsWith("- ") || line.startsWith("* ")) {
          return (
            <div key={idx} className="flex items-start gap-2 pl-2">
              <span className="text-zinc-400 font-bold">•</span>
              <span>{renderFormattedText(line.slice(2))}</span>
            </div>
          );
        }

        // Numbered list
        const numMatch = line.match(/^(\d+)\.\s+(.*)/);
        if (numMatch) {
          return (
            <div key={idx} className="flex items-start gap-2 pl-2">
              <span className="text-zinc-400 font-medium">{numMatch[1]}.</span>
              <span>{renderFormattedText(numMatch[2])}</span>
            </div>
          );
        }

        // Empty line
        if (!line.trim()) {
          return <div key={idx} className="h-2" />;
        }

        // Regular paragraph
        return <p key={idx}>{renderFormattedText(line)}</p>;
      })}
    </div>
  );
};
