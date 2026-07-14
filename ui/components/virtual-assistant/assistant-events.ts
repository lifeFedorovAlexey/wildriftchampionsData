export const VIRTUAL_ASSISTANT_EVENT = "wildrift:assistant";

import type {
  ChampionRecommendation,
  NewChampionInsight,
} from "./recommendation-engine";
import { ASSISTANT_STORAGE } from "./assistant-config";

export type VirtualAssistantEventDetail =
  | { kind: "tip"; message?: string }
  | { kind: "empty_results"; message?: string }
  | { kind: "load_error"; message?: string }
  | { kind: "save_success"; message?: string }
  | { kind: "rank_changed"; rankKey: string; rankLabel: string }
  | {
      kind: "lane_changed";
      laneKey: string;
      laneLabel: string;
      recommended: ChampionRecommendation[];
      newcomers: NewChampionInsight[];
    }
  | {
      kind: "list_end";
      laneLabel: string;
      avoid: ChampionRecommendation[];
    }
  | {
      kind: "metric_sorted";
      metric: "strengthLevel" | "winRate" | "pickRate" | "banRate";
    };

export type VirtualAssistantEventKind = VirtualAssistantEventDetail["kind"];

/** Public, optional bridge for pages that want a reaction from the assistant. */
export function notifyVirtualAssistant(detail: VirtualAssistantEventDetail) {
  if (typeof window === "undefined") return;
  if (localStorage.getItem(ASSISTANT_STORAGE.minimized) === "1") return;

  window.dispatchEvent(
    new CustomEvent<VirtualAssistantEventDetail>(VIRTUAL_ASSISTANT_EVENT, {
      detail,
    }),
  );
}
