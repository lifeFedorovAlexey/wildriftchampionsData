import type { PatchNote } from "./patch-notes-lib";

export const PATCH_PAGE_SIZE = 4;

export function patchChangeAnchor(
  entity: Pick<PatchNote["changes"][number], "entityKind" | "entitySlug" | "entityName">,
  tone: PatchNote["changes"][number]["changeType"],
) {
  const identity = entity.entitySlug || entity.entityName.trim().toLocaleLowerCase("ru-RU").replace(/\s+/g, "-");
  return `change-${entity.entityKind}-${tone}-${identity}`;
}

export function formatPatchDate(value: string | null) {
  if (!value) return "Дата не указана";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Дата не указана";
  return new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(date);
}
