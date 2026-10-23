"use client";

import { useCallback, useState } from "react";

const fileToBase64 = (file: File | Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const res = reader.result as string;
      const base64 = res.split(",")[1];
      if (base64) resolve(base64);
      else reject(new Error("Gagal mengonversi file ke base64"));
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const stringToBase64 = (str: string): string => {
  return typeof window !== "undefined"
    ? window.btoa(unescape(encodeURIComponent(str)))
    : Buffer.from(str, "utf-8").toString("base64");
};

export interface PackageUploadItem {
  filename: string;
  mimeType: string;
  base64Data: string;
}

export interface PackageUploadResponse {
  success: boolean;
  targetFolderId: string;
  projectFolderId: string;
  folderWebViewLink?: string;
  uploadedFiles: Array<{ filename: string; fileId: string; webViewLink?: string }>;
  error?: string;
}

export interface MultiSegmentUploadItem {
  segmentKey: string;
  segmentFolderName?: string;
  label: string;
  textFiles: Array<{ filename: string; mimeType: string; content: string }>;
  videoFile?: File | null;
  thumbnailFile?: File | null;
}

export function useDrivePackageUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const [progressStatus, setProgressStatus] = useState<string>("");
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [folderUrl, setFolderUrl] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const resetUploadState = useCallback(() => {
    setIsUploading(false);
    setProgressStatus("");
    setProgressPercent(0);
    setFolderUrl(null);
    setUploadError(null);
  }, []);

  const uploadPackage = useCallback(
    async (params: {
      channelName: string;
      projectFolderName: string;
      segmentFolderName?: string;
      textFiles: Array<{ filename: string; mimeType: string; content: string }>;
      videoFile?: File | null;
      thumbnailFile?: File | null;
    }): Promise<boolean> => {
      setIsUploading(true);
      setUploadError(null);
      setProgressPercent(10);
      setProgressStatus("Menyiapkan berkas metadata dan naskah...");

      try {
        const payloadFiles: PackageUploadItem[] = [];

        // 1. Kemas file teks
        for (const tf of params.textFiles) {
          payloadFiles.push({
            filename: tf.filename,
            mimeType: tf.mimeType || "text/plain",
            base64Data: stringToBase64(tf.content),
          });
        }

        setProgressPercent(25);

        // 2. Kemas file video dari PC jika ada
        if (params.videoFile) {
          setProgressStatus(`Membaca berkas video (${params.videoFile.name})...`);
          const videoBase64 = await fileToBase64(params.videoFile);
          payloadFiles.push({
            filename: params.videoFile.name,
            mimeType: params.videoFile.type || "video/mp4",
            base64Data: videoBase64,
          });
        }

        setProgressPercent(45);

        // 3. Kemas file thumbnail dari PC jika ada
        if (params.thumbnailFile) {
          setProgressStatus(`Membaca gambar thumbnail (${params.thumbnailFile.name})...`);
          const thumbBase64 = await fileToBase64(params.thumbnailFile);
          payloadFiles.push({
            filename: params.thumbnailFile.name,
            mimeType: params.thumbnailFile.type || "image/jpeg",
            base64Data: thumbBase64,
          });
        }

        setProgressPercent(60);
        setProgressStatus("Mengunggah paket ke Google Drive...");

        // 4. Kirim request ke backend API
        const res = await fetch("/api/user/google-drive/upload-package", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            channelName: params.channelName,
            projectFolderName: params.projectFolderName,
            segmentFolderName: params.segmentFolderName || null,
            files: payloadFiles,
          }),
        });

        setProgressPercent(90);

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `Upload gagal dengan kode status ${res.status}`);
        }

        const data = (await res.json()) as PackageUploadResponse;
        setProgressPercent(100);
        setProgressStatus("Unggahan selesai!");
        setFolderUrl(data.folderWebViewLink || null);
        return true;
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Terjadi kesalahan saat mengunggah paket";
        setUploadError(msg);
        setProgressStatus("Gagal mengunggah");
        return false;
      } finally {
        setIsUploading(false);
      }
    },
    []
  );

  const uploadMultiSegmentPackage = useCallback(
    async (params: {
      channelName: string;
      projectFolderName: string;
      segments: MultiSegmentUploadItem[];
    }): Promise<boolean> => {
      if (!params.segments || params.segments.length === 0) {
        setUploadError("Pilih minimal satu segmen untuk diunggah");
        return false;
      }

      setIsUploading(true);
      setUploadError(null);
      setProgressPercent(5);
      setProgressStatus(`Mempersiapkan ${params.segments.length} segmen untuk diunggah...`);

      const totalSegments = params.segments.length;
      let lastFolderUrl: string | null = null;

      try {
        for (let i = 0; i < totalSegments; i++) {
          const seg = params.segments[i];
          const segBasePercent = Math.round((i / totalSegments) * 100);
          const segMaxPercent = Math.round(((i + 1) / totalSegments) * 100);

          setProgressStatus(`[${i + 1}/${totalSegments}] Menyiapkan berkas ${seg.label}...`);
          setProgressPercent(Math.min(99, segBasePercent + 5));

          const payloadFiles: PackageUploadItem[] = [];

          // 1. Berkas teks per segmen
          for (const tf of seg.textFiles) {
            payloadFiles.push({
              filename: tf.filename,
              mimeType: tf.mimeType || "text/plain",
              base64Data: stringToBase64(tf.content),
            });
          }

          // 2. Berkas video per segmen jika ada
          if (seg.videoFile) {
            setProgressStatus(`[${i + 1}/${totalSegments}] Membaca video ${seg.label} (${seg.videoFile.name})...`);
            const videoBase64 = await fileToBase64(seg.videoFile);
            payloadFiles.push({
              filename: seg.videoFile.name,
              mimeType: seg.videoFile.type || "video/mp4",
              base64Data: videoBase64,
            });
          }

          // 3. Berkas thumbnail per segmen jika ada
          if (seg.thumbnailFile) {
            setProgressStatus(`[${i + 1}/${totalSegments}] Membaca thumbnail ${seg.label} (${seg.thumbnailFile.name})...`);
            const thumbBase64 = await fileToBase64(seg.thumbnailFile);
            payloadFiles.push({
              filename: seg.thumbnailFile.name,
              mimeType: seg.thumbnailFile.type || "image/jpeg",
              base64Data: thumbBase64,
            });
          }

          setProgressStatus(`[${i + 1}/${totalSegments}] Mengunggah ${seg.label} ke Google Drive...`);
          setProgressPercent(Math.min(99, segBasePercent + Math.round((segMaxPercent - segBasePercent) * 0.7)));

          const res = await fetch("/api/user/google-drive/upload-package", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              channelName: params.channelName,
              projectFolderName: params.projectFolderName,
              segmentFolderName: seg.segmentFolderName || null,
              files: payloadFiles,
            }),
          });

          if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(
              errData.error || `Upload gagal pada ${seg.label} dengan kode status ${res.status}`
            );
          }

          const data = (await res.json()) as PackageUploadResponse;
          if (data.folderWebViewLink) {
            lastFolderUrl = data.folderWebViewLink;
          }

          setProgressPercent(segMaxPercent);
        }

        setProgressPercent(100);
        setProgressStatus(`Berhasil mengunggah ${totalSegments} segmen ke Google Drive!`);
        setFolderUrl(lastFolderUrl);
        return true;
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Terjadi kesalahan saat mengunggah paket";
        setUploadError(msg);
        setProgressStatus("Gagal mengunggah");
        return false;
      } finally {
        setIsUploading(false);
      }
    },
    []
  );

  return {
    isUploading,
    progressStatus,
    progressPercent,
    folderUrl,
    uploadError,
    uploadPackage,
    uploadMultiSegmentPackage,
    resetUploadState,
  };
}
