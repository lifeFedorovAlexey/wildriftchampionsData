export type WinrateRow = {
  slug: string;
  name: string;
  icon: string | null;
  winRate: number | null;
  pickRate: number | null;
  banRate: number | null;
  strengthLevel: number | null;
  tierLabel: string;
  tierColor: string;
  positionDelta: number | null;
  positionTrend: Array<number | null>;
  winRateTrend: Array<number | null>;
  pickRateTrend: Array<number | null>;
  banRateTrend: Array<number | null>;
  winRateDelta: number | null;
  pickRateDelta: number | null;
  banRateDelta: number | null;
};

export type WinratesRowsBySlice = Record<string, WinrateRow[]>;
