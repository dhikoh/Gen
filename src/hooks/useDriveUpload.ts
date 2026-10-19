"use client";

import { useCallback, useState } from "react";

const MAX_RETRIES = 3;

const blobToBase64 = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const res = reader.result as string;
      const base64 = res.split(",")[1];
      if (base64) resolve(base64);
      else reject(new Error("Failed to convert blob to base64"));
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export interface DriveUploadResult {
  fileUrl?: string;
  fileId?: string;
  webViewLink?: string;
  success?: boolean;
}

export function useDriveUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const [driveUrl, setDriveUrl] = useState<string | null>(null);

  const upload = useCallback(
    async (blob: Blob, filename: string): Promise<boolean> => {
      setIsUploading(true);
      try {
        const base64Data = await blobToBase64(blob);

        let lastError: unknown = null;

        for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
          try {
            const res = await fetch("/api/user/google-drive/upload", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                filename,
                mimeType: blob.type || "video/webm",
                base64Data,
              }),
            });

            // Hanya status yang bisa berubah saat dicoba ulang yang di-retry.
            // 400/401/403 adalah masalah permanen: gagal sekarang juga nanti.
            const isRetryable =
              res.status === 429 || (res.status >= 500 && res.status < 600);

            if (res.ok) {
              const data = (await res.json()) as DriveUploadResult;
              setDriveUrl(data.webViewLink || data.fileUrl || null);
              return true;
            }

            const errorBody = (await res.json().catch(() => null)) as
              | { error?: string }
              | null;
            lastError = new Error(
              errorBody?.error ?? `HTTP ${res.status}: ${res.statusText}`,
            );

            if (!isRetryable) break;

            const retryAfter = Number(res.headers.get("Retry-After"));
            const waitTime =
              Number.isFinite(retryAfter) && retryAfter > 0
                ? retryAfter * 1000
                : 2000 * Math.pow(2, attempt);
            await sleep(waitTime);
          } catch (err) {
            lastError = err;
            // Gagal di level jaringan (offline, DNS, dsb) masih layak dicoba ulang.
            if (attempt === MAX_RETRIES - 1) break;
            await sleep(2000 * Math.pow(2, attempt));
          }
        }

        if (lastError) console.error("Upload to Drive failed:", lastError);
        return false;
      } finally {
        setIsUploading(false);
      }
    },
    [],
  );

  return { isUploading, driveUrl, setDriveUrl, uploadToDrive: upload };
}
