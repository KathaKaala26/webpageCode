const ID_PATTERN = /^[\w-]{11}$/;

const URL_PATTERNS = [
  /(?:youtu\.be)\/([\w-]{11})/,
  /(?:youtube\.com|youtube-nocookie\.com)\/watch\?(?:.*&)?v=([\w-]{11})/,
  /(?:youtube\.com|youtube-nocookie\.com)\/embed\/([\w-]{11})/,
  /(?:youtube\.com|youtube-nocookie\.com)\/shorts\/([\w-]{11})/,
];

/** Extracts an 11-char YouTube video ID from any common URL shape, or a bare ID. Returns null if unrecognized. */
export function parseYoutubeId(input: string): string | null {
  const trimmed = input.trim();
  if (ID_PATTERN.test(trimmed)) return trimmed;
  for (const pattern of URL_PATTERNS) {
    const match = trimmed.match(pattern);
    if (match) return match[1];
  }
  return null;
}

export function youtubeEmbedUrl(id: string): string {
  return `https://www.youtube-nocookie.com/embed/${id}`;
}
