import { SFX, SFXId } from "./types";

const sfxs: SFX[] = [
  {
    id: "bonus",
    path: "/assets/audios/bonus.ogg",
  },
  {
    id: "coin-collect",
    path: "/assets/audios/coin-collect.ogg",
  },
  {
    id: "collect",
    path: "/assets/audios/collect.ogg",
  },
  {
    id: "complete",
    path: "/assets/audios/complete.ogg",
  },
  {
    id: "fail",
    path: "/assets/audios/fail.ogg",
  },
  {
    id: "unlock",
    path: "/assets/audios/fail.ogg",
  },
];

const sfxMap = new Map<SFXId, SFX>(sfxs.map((sfx) => [sfx.id, sfx]));

export const getSFX = (id: SFXId) => sfxMap.get(id);
