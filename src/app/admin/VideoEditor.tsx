"use client";

import { useActionState, useRef, useState } from "react";
import { supabasePublic } from "@/lib/supabasePublic";

type MintResult = { path: string; token: string; bucket: string } | { error: string };

export default function VideoEditor({
  slug,
  source,
  setYoutube,
  mintUploadUrl,
  confirmUpload,
  remove,
}: {
  slug?: string;
  source?: "YOUTUBE" | "UPLOAD" | null;
  setYoutube: (prev: { error?: string } | undefined, fd: FormData) => Promise<{ error?: string }>;
  mintUploadUrl: (args: { contentType: string; size: number }) => Promise<MintResult>;
  confirmUpload: (args: { path: string }) => Promise<{ error?: string }>;
  remove: (fd: FormData) => void | Promise<void>;
}) {
  const [tab, setTab] = useState<"youtube" | "upload">(source === "UPLOAD" ? "upload" : "youtube");
  const [youtubeState, youtubeAction, youtubePending] = useActionState(setYoutube, undefined);
  const [uploadError, setUploadError] = useState<string | undefined>();
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleUpload() {
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    setUploadError(undefined);
    setUploading(true);
    try {
      const minted = await mintUploadUrl({ contentType: file.type, size: file.size });
      if ("error" in minted) {
        setUploadError(minted.error);
        return;
      }
      const { error } = await supabasePublic().storage.from(minted.bucket).uploadToSignedUrl(minted.path, minted.token, file);
      if (error) {
        setUploadError(`Upload failed: ${error.message}`);
        return;
      }
      const confirmed = await confirmUpload({ path: minted.path });
      if (confirmed.error) setUploadError(confirmed.error);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2 text-xs">
        <button
          type="button"
          onClick={() => setTab("youtube")}
          className={`rounded-full px-3 py-1 font-bold ${tab === "youtube" ? "bg-maroon text-white" : "bg-shankh"}`}
        >
          YouTube link
        </button>
        <button
          type="button"
          onClick={() => setTab("upload")}
          className={`rounded-full px-3 py-1 font-bold ${tab === "upload" ? "bg-maroon text-white" : "bg-shankh"}`}
        >
          Upload file
        </button>
      </div>

      {tab === "youtube" ? (
        <form action={youtubeAction} className="flex flex-wrap items-center gap-2">
          {slug && <input type="hidden" name="slug" value={slug} />}
          <input
            type="url"
            name="youtubeUrl"
            placeholder="https://youtube.com/watch?v=…"
            required
            className="field h-9 min-w-[180px] flex-1 py-1 text-xs"
          />
          <button type="submit" disabled={youtubePending} className="btn-outline h-9 px-3 text-xs">
            {youtubePending ? "Saving…" : "Save"}
          </button>
          {youtubeState?.error && <p role="alert" className="w-full text-xs font-semibold text-sindoor">{youtubeState.error}</p>}
        </form>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={fileRef}
            type="file"
            accept="video/mp4,video/webm"
            className="max-w-[220px] text-xs file:mr-2 file:rounded-full file:border-0 file:bg-shankh file:px-3 file:py-1.5 file:text-xs file:font-bold"
          />
          <button type="button" onClick={handleUpload} disabled={uploading} className="btn-outline h-9 px-3 text-xs">
            {uploading ? "Uploading…" : "Upload"}
          </button>
          {uploadError && <p role="alert" className="w-full text-xs font-semibold text-sindoor">{uploadError}</p>}
        </div>
      )}

      <p className="text-[11px] text-ink-soft">
        {source === "YOUTUBE" && "Current: YouTube video"}
        {source === "UPLOAD" && "Current: uploaded video"}
        {!source && "No video set."}
      </p>

      {source && (
        <form action={remove}>
          {slug && <input type="hidden" name="slug" value={slug} />}
          <button className="text-xs font-bold text-sindoor hover:underline">Remove video</button>
        </form>
      )}
    </div>
  );
}
