export const WATCH_PLATFORMS = [
  {
    id: "local",
    name: "Local file",
    url: null,
    hint: "Pick a video from your computer — plays instantly, nothing is uploaded",
    playMode: "local" as const,
  },
  {
    id: "youtube",
    name: "YouTube",
    url: "https://www.youtube.com",
    hint: "Paste a YouTube link — it plays in the room player with sync",
    playMode: "youtube" as const,
  },
  {
    id: "website",
    name: "Other website",
    url: null,
    hint: "Paste a website or direct .mp4 link to play in the player",
    playMode: "auto" as const,
  },
  {
    id: "netflix",
    name: "Netflix",
    url: "https://www.netflix.com/browse",
    hint: "Netflix blocks embeds — paste a public video URL or use Share screen",
    playMode: "external" as const,
  },
  {
    id: "jiohotstar",
    name: "JioHotstar",
    url: "https://www.hotstar.com",
    hint: "Hotstar blocks embeds — paste a public video URL or use Share screen",
    playMode: "external" as const,
  },
  {
    id: "prime",
    name: "Prime Video",
    url: "https://www.primevideo.com",
    hint: "Prime blocks embeds — paste a public video URL or use Share screen",
    playMode: "external" as const,
  },
  {
    id: "disney",
    name: "Disney+",
    url: "https://www.disneyplus.com",
    hint: "Disney+ blocks embeds — paste a public video URL or use Share screen",
    playMode: "external" as const,
  },
  {
    id: "appletv",
    name: "Apple TV+",
    url: "https://tv.apple.com",
    hint: "Apple TV+ blocks embeds — paste a public video URL or use Share screen",
    playMode: "external" as const,
  },
  {
    id: "sonyliv",
    name: "Sony LIV",
    url: "https://www.sonyliv.com",
    hint: "Sony LIV blocks embeds — paste a public video URL or use Share screen",
    playMode: "external" as const,
  },
  {
    id: "zee5",
    name: "ZEE5",
    url: "https://www.zee5.com",
    hint: "ZEE5 blocks embeds — paste a public video URL or use Share screen",
    playMode: "external" as const,
  },
  {
    id: "jiocinema",
    name: "JioCinema",
    url: "https://www.jiocinema.com",
    hint: "JioCinema blocks embeds — paste a public video URL or use Share screen",
    playMode: "external" as const,
  },
  {
    id: "crunchyroll",
    name: "Crunchyroll",
    url: "https://www.crunchyroll.com",
    hint: "Paste a public video URL or use Share screen for Crunchyroll",
    playMode: "external" as const,
  },
  {
    id: "hulu",
    name: "Hulu",
    url: "https://www.hulu.com",
    hint: "Hulu blocks embeds — paste a public video URL or use Share screen",
    playMode: "external" as const,
  },
  {
    id: "mxplayer",
    name: "MX Player",
    url: "https://www.mxplayer.in",
    hint: "Paste a playable link or use Share screen",
    playMode: "external" as const,
  },
  {
    id: "other",
    name: "Screen share only",
    url: null,
    hint: "Use Share screen so everyone sees your picture",
    playMode: "screenshare" as const,
  },
] as const;

export type PlatformId = (typeof WATCH_PLATFORMS)[number]["id"];

export const PLATFORM_IDS = WATCH_PLATFORMS.map((p) => p.id) as [
  PlatformId,
  ...PlatformId[],
];

export function getPlatform(id: string | null | undefined) {
  return WATCH_PLATFORMS.find((p) => p.id === id) ?? null;
}

export type ContentKind = "youtube" | "video" | "iframe" | "none";

export type ParsedContent = {
  kind: ContentKind;
  /** YouTube video id or raw URL */
  src: string;
};

const DEFAULT_SAMPLE =
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";

export function parseContentUrl(raw: string | null | undefined): ParsedContent {
  const url = (raw ?? "").trim();
  if (!url) return { kind: "none", src: "" };

  const yt =
    url.match(
      /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{6,})/,
    ) ?? url.match(/^([a-zA-Z0-9_-]{11})$/);
  if (yt?.[1]) return { kind: "youtube", src: yt[1] };

  if (/\.(mp4|webm|ogg|m3u8)(\?|$)/i.test(url) || url.includes("googlevideo")) {
    return { kind: "video", src: url };
  }

  // Generic page — try iframe embed
  try {
    const u = new URL(url);
    if (u.protocol === "http:" || u.protocol === "https:") {
      return { kind: "iframe", src: url };
    }
  } catch {
    // ignore
  }

  return { kind: "none", src: "" };
}

export function resolveRoomContent(
  platformId: string | null | undefined,
  contentUrl: string | null | undefined,
): ParsedContent {
  const url = (contentUrl ?? "").trim();

  // Local blob URLs from file picker (never leave this browser)
  if (url.startsWith("blob:")) {
    return { kind: "video", src: url };
  }

  const parsed = parseContentUrl(url);
  if (parsed.kind !== "none") return parsed;

  const platform = getPlatform(platformId);
  if (!platform || platform.playMode === "screenshare" || platform.playMode === "local") {
    return { kind: "none", src: "" };
  }
  if (platform.playMode === "youtube") {
    return { kind: "none", src: "" };
  }
  return { kind: "video", src: DEFAULT_SAMPLE };
}

export { DEFAULT_SAMPLE };
