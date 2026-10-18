"use client";
import { useEffect } from "react";
import { purgeForeignStorage } from "@/lib/clientStorage";

export default function StorageGuard({ userId }: { userId: string }) {
  useEffect(() => {
    purgeForeignStorage(userId);
  }, [userId]);
  return null;
}
