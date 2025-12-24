import { notFound } from "next/navigation";
import SkinViewer from "./SkinViewer";
import { ChampionSkinsData } from "@/app/types/skin";
import fs from "fs";
import path from "path";
export default async function ChampionSkinsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const filePath = path.join(process.cwd(), "public", "merged", `${slug}.json`);

  let data: ChampionSkinsData;
  try {
    if (!fs.existsSync(filePath)) {
      return notFound();
    }

    const fileContent = fs.readFileSync(filePath, "utf-8");
    data = JSON.parse(fileContent);
  } catch (err) {
    console.error("Ошибка чтения файла:", err);
    return notFound();
  }

  return <SkinViewer data={data} />;
}
