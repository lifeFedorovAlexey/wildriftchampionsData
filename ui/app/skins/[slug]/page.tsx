import { notFound } from "next/navigation";

import { fetchSkinDetailFromApi } from "../skins-lib";
import SkinViewer from "./SkinViewer";

export default async function ChampionSkinsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await fetchSkinDetailFromApi(slug);

  if (!data) {
    return notFound();
  }

  return <SkinViewer data={data} />;
}
