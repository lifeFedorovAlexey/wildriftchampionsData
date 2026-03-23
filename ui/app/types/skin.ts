export type SkinImage = {
  preview: string;
  full: string;
};

export type SkinModel = {
  cdn: string;
  local: string | null;
};

export type Skin = {
  name: string;
  image: SkinImage;
  has3d: boolean;
  model: SkinModel | null;
};

export type ChampionSkinsData = {
  slug: string;
  skinCount: number;
  with3d: number;
  skins: Skin[];
};
