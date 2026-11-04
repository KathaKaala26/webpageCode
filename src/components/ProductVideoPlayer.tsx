import { youtubeEmbedUrl } from "@/lib/video";

export default function ProductVideoPlayer({
  video,
  title,
}: {
  video: { source: "YOUTUBE" | "UPLOAD"; youtubeId: string | null; url: string | null };
  title: string;
}) {
  if (video.source === "YOUTUBE" && video.youtubeId) {
    return (
      <iframe
        src={youtubeEmbedUrl(video.youtubeId)}
        title={title}
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="h-full w-full"
      />
    );
  }
  if (video.source === "UPLOAD" && video.url) {
    return <video controls preload="metadata" className="h-full w-full" src={video.url} />;
  }
  return null;
}
