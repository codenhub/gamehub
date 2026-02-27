/**
 * Registry of all music tracks available in the application.
 */
export const MusicList = {
  "main-soundtrack": "/assets/audios/soundtrack.ogg",
  "frenetic-soundtrack": "/assets/audios/soundtrack-2.ogg",
  "waiting-soundtrack": "/assets/audios/soundtrack-3.ogg",
} as const;

/**
 * Valid identifiers for music tracks.
 */
export type MusicId = keyof typeof MusicList;
