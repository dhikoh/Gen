"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DraftTitle({ draftId, initialTitle }: { draftId: string, initialTitle: string }) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(initialTitle);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSave = async () => {
    if (!title.trim() || title === initialTitle) {
      setIsEditing(false);
      setTitle(initialTitle);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/drafts/${draftId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
      if (res.ok) {
        setIsEditing(false);
        router.refresh();
      } else {
        setTitle(initialTitle);
        setIsEditing(false);
      }
    } catch (err) {
      setTitle(initialTitle);
      setIsEditing(false);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSave();
    if (e.key === "Escape") {
      setTitle(initialTitle);
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <div className="flex items-center space-x-2 mb-2">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleSave}
          autoFocus
          disabled={loading}
          className="text-2xl font-bold pg-surface border border-blue-500 rounded px-2 py-1 outline-none pg-text-heading flex-1 max-w-lg"
        />
        {loading && <span className="inline-block animate-spin border-2 border-blue-500 border-t-transparent rounded-full w-5 h-5" />}
      </div>
    );
  }

  return (
    <div className="flex items-center group mb-2">
      <h1 className="text-2xl font-bold pg-text-heading mr-3">{title}</h1>
      <button
        onClick={() => setIsEditing(true)}
        className="opacity-0 group-hover:opacity-100 transition-opacity pg-text-muted hover:text-blue-500 p-1"
        title="Edit Title"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
        </svg>
      </button>
    </div>
  );
}
