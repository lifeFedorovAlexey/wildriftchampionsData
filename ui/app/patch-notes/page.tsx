import Link from "next/link";
import PageWrapper from "@/components/PageWrapper";
import PatchNotesList from "./PatchNotesList";
import { fetchPatchNotes } from "./patch-notes-lib";
import { PATCH_PAGE_SIZE } from "./patch-notes-shared";

export default async function PatchNotesPage({ searchParams }: {
  searchParams: Promise<{ all?: string }>;
}) {
  const [items, query] = await Promise.all([fetchPatchNotes(), searchParams]);
  const initialItems = query.all === "1" ? items : items.slice(0, PATCH_PAGE_SIZE);
  const nextCursor = initialItems.length < items.length ? initialItems.at(-1)!.version : null;

  return (
    <PageWrapper title="Патчноуты Wild Rift" paragraphs={[]}>
      <PatchNotesList initialItems={initialItems} initialCursor={nextCursor} />
      {nextCursor && <noscript><Link href="/patch-notes?all=1" prefetch={false}>Показать все патчи</Link></noscript>}
    </PageWrapper>
  );
}
