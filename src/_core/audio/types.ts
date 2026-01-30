export type Audio = {
  id: string;
  path: string;
};

export type Music = Audio;
export type SFX = Audio;

export type MusicId = Music["id"];
export type SFXId = SFX["id"];
