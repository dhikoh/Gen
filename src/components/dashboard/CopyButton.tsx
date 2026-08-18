"use client";

import { useState } from "react";

export default function CopyButton({ textToCopy, label = "Copy" }: { textToCopy: string, label?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="text-xs px-3 py-1 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded transition-colors"
    >
      {copied ? "Copied!" : label}
    </button>
  );
}
