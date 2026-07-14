"use client";

export const RANK_OPTIONS = [
  { key: "diamondPlus", label: "Алмаз" },
  { key: "masterPlus", label: "Мастер" },
  { key: "king", label: "ГМ" },
  { key: "peak", label: "Претендент" },
  { key: "overall", label: "Все" },
];

export const LANE_OPTIONS: { key: string; label: string }[] = [
  { key: "top", label: "Топ" },
  { key: "jungle", label: "Лес" },
  { key: "mid", label: "Мид" },
  { key: "adc", label: "Стрелок" },
  { key: "support", label: "Поддержка" },
];

export const ROLE_SPRITE_URL = "/place-icons.webp";

export const ROLE_ICON_SPRITE = {
  top: { x: 2, y: 0 },
  jungle: { x: -43, y: 0 },
  mid: { x: -88, y: 0 },
  adc: { x: -132, y: 0 },
  support: { x: -177, y: 0 },
};
