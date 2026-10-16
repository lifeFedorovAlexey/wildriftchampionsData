import { fetchApiJson } from "@/lib/server-api.js";

export type PatchNoteSummary = {
  version: string;
  locale: string;
  title: string;
  description: string | null;
  sourceUrl: string;
  publishedAt: string | null;
  effectiveDate: string | null;
  effectiveRegion: string | null;
  effectiveDateSourceUrl: string | null;
  imageUrl: string | null;
  availableLocales?: string[];
  iconPreviews?: {
    new: PatchNoteIconPreview[];
    buff: PatchNoteIconPreview[];
    nerf: PatchNoteIconPreview[];
    adjustment: PatchNoteIconPreview[];
    rework: PatchNoteIconPreview[];
    removed: PatchNoteIconPreview[];
  };
};

export type PatchNoteIconPreview = {
  entityKind: "champion" | "item" | "rune" | "spell" | "system" | "skin";
  entitySlug: string | null;
  entityName: string;
  imageUrl: string;
};

export type PatchNote = PatchNoteSummary & {
  changes: Array<{
    ordinal: number;
    entityKind: "champion" | "item" | "rune" | "spell" | "system" | "skin";
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
    // Patch notes are written by a separate daily workflow. A cached empty
    // response can otherwise hide newly imported notes for up to 30 minutes.
    fetchOptions: { cache: "no-store" },
    fallback: { items: [] },
  });
  return Array.isArray(payload?.items) ? payload.items : [];
}

export async function fetchPatchNote(version: string): Promise<PatchNote | null> {
  return await fetchApiJson(`/api/patch-notes/${encodeURIComponent(version)}`, {
    fetchOptions: { cache: "no-store" },
    allowNotFound: true,
    fallback: null,
  });
}

export { formatPatchDate, patchChangeAnchor } from "./patch-notes-shared";
