export interface GameVideoConfig {
  id: string;
  name: string;
  description: string;
  /** ISO 8601 date-time with its offset, as YouTube shows it. */
  uploadDate: string;
  /** ISO 8601 duration, such as PT20S. */
  duration: string;
}

export interface GameVideo extends GameVideoConfig {
  thumbnailUrl: string;
  embedUrl: string;
  contentUrl: string;
}

/**
 * A round of Memory Chess on the site's own YouTube channel. While `id` is empty the homepage shows no
 * player and emits no VideoObject; set all five fields once the video is public.
 */
export const GAME_VIDEO_CONFIG: GameVideoConfig = {
  id: "",
  name: "Memory Chess: one round from study to score",
  description:
    "One round of Memory Chess, the free chess memory game at https://thememorychess.com: study a real position, rebuild it from memory, then read your accuracy square by square.",
  uploadDate: "",
  duration: "",
};

const FORMATS: Record<keyof GameVideoConfig, RegExp> = {
  id: /^[\w-]{11}$/,
  name: /\S/,
  description: /\S/,
  uploadDate: /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2})?(Z|[+-]\d{2}:\d{2}))?$/,
  duration: /^PT(?=\d)(\d+H)?(\d+M)?(\d+S)?$/,
};

/** Throws on a set id with a malformed field, so a half-filled config fails the build instead of shipping invalid JSON-LD. */
export function gameVideo(config: GameVideoConfig): GameVideo | null {
  if (config.id === "") return null;
  for (const field of Object.keys(FORMATS) as (keyof GameVideoConfig)[]) {
    if (!FORMATS[field].test(config[field])) {
      throw new Error(`GAME_VIDEO_CONFIG.${field} is malformed: ${JSON.stringify(config[field])}`);
    }
  }
  return {
    ...config,
    thumbnailUrl: `https://i.ytimg.com/vi/${config.id}/hqdefault.jpg`,
    embedUrl: `https://www.youtube-nocookie.com/embed/${config.id}`,
    contentUrl: `https://www.youtube.com/watch?v=${config.id}`,
  };
}

export const GAME_VIDEO = gameVideo(GAME_VIDEO_CONFIG);
