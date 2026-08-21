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
      className="text-xs px-3 py-1 rounded neu-btn transition-colors"
      style={{ color: copied ? 'var(--pg-success)' : 'var(--pg-text-sub)' }}
    >
      {copied ? "Copied!" : label}
    </button>
  );
}
