import { fetchApiJson } from "@/lib/server-api.js";

export type PatchNoteSummary = {
  version: string;
  locale: string;
  title: string;
  description: string | null;
  sourceUrl: string;
  publishedAt: string | null;
  imageUrl: string | null;
  availableLocales?: string[];
  iconPreviews?: {
    new: PatchNoteIconPreview[];
    buff: PatchNoteIconPreview[];
    nerf: PatchNoteIconPreview[];
    adjustment: PatchNoteIconPreview[];
    removed: PatchNoteIconPreview[];
  };
};

export type PatchNoteIconPreview = {
  entityKind: "champion" | "item";
  entitySlug: string | null;
  entityName: string;
  imageUrl: string;
};

export type PatchNote = PatchNoteSummary & {
  changes: Array<{
    ordinal: number;
    entityKind: "champion" | "item" | "rune" | "system" | "skin";
    entitySlug: string | null;
    entityName: string;
    imageUrl: string | null;
    changeType: "new" | "buff" | "nerf" | "rework" | "adjustment" | "removed";
    sectionName: string | null;
    changeName: string | null;
    details: Array<{
      label: string | null;
      before: string | null;
      after: string | null;
      text: string;
      component?: string | null;
    }>;
  }>;
};

export async function fetchPatchNotes(): Promise<PatchNoteSummary[]> {
  const payload = await fetchApiJson("/api/patch-notes", {
    fetchOptions: process.env.NODE_ENV === "development" ? { cache: "no-store" } : { next: { revalidate: 1800 } },
    fallback: { items: [] },
  });
  return Array.isArray(payload?.items) ? payload.items : [];
}

export async function fetchPatchNote(version: string): Promise<PatchNote | null> {
  return await fetchApiJson(`/api/patch-notes/${encodeURIComponent(version)}`, {
    fetchOptions: process.env.NODE_ENV === "development" ? { cache: "no-store" } : { next: { revalidate: 1800 } },
    allowNotFound: true,
    fallback: null,
  });
}

export function formatPatchDate(value: string | null) {
  if (!value) return "Дата не указана";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Дата не указана";
  return new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long", year: "numeric" }).format(date);
}
