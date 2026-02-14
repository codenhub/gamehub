export const SFXList = {
  bonus: "/assets/audios/bonus.ogg",
  "coin-collect": "/assets/audios/coin-collect.ogg",
  collect: "/assets/audios/collect.ogg",
  complete: "/assets/audios/complete.ogg",
  eat: "/assets/audios/eat.ogg",
  fail: "/assets/audios/fail.ogg",
  hit: "/assets/audios/hit.ogg",
  place: "/assets/audios/place.ogg",
  unlock: "/assets/audios/unlock.ogg",
} as const;

export type SFXId = keyof typeof SFXList;
