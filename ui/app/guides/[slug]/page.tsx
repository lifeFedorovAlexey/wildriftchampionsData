import fs from "node:fs/promises";
import path from "node:path";
import { notFound } from "next/navigation";

import PageWrapper from "@/components/PageWrapper";
import GuideClient, { type GuideData } from "./GuideClient";
import {
  type BulkResponse,
  fetchGuideFromApi,
  fetchGuideSlugsFromApi,
  fetchTierlistBulk,
  findTierLabelForChampion,
  toLaneKey,
} from "../guides-lib";

async function readGuideFromFs(slug: string): Promise<GuideData | null> {
  const filePath = path.join(
    process.cwd(),
    "data",
    "wildriftfire",
    "guides",
    `${slug}.json`,
  );

  try {
    const raw = await fs.readFile(filePath, "utf8");
    return JSON.parse(raw) as GuideData;
  } catch {
    return null;
  }
}

async function listAvailableGuideSlugsFromFs() {
  const dirPath = path.join(process.cwd(), "data", "wildriftfire", "guides");

  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
      .map((entry) => entry.name.replace(/\.json$/i, ""));
  } catch {
    return [];
  }
}

function applyOwnTiers(guide: GuideData, bulk: BulkResponse | null): GuideData {
  if (!guide.variants?.length) {
    return guide;
  }

  const variants = guide.variants.map((variant) => {
    const laneKey = toLaneKey(variant.lane || variant.title || guide.metadata.recommendedRole);
    const ownTier = findTierLabelForChampion(
      bulk,
      guide.champion.slug,
      laneKey,
      "diamondPlus",
    );

    return {
      ...variant,
      ownTier,
    };
  });

  const defaultVariant = variants.find((variant) => variant.isDefault) || variants[0];

  return {
    ...guide,
    metadata: {
      ...guide.metadata,
      tier: defaultVariant?.ownTier || guide.metadata.tier,
    },
    variants,
  };
}

export default async function GuidePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const guide = (await fetchGuideFromApi<GuideData>(slug)) || (await readGuideFromFs(slug));

  if (!guide) {
    notFound();
  }

  const bulk = await fetchTierlistBulk();
  const guideWithOwnTiers = applyOwnTiers(guide, bulk);
  const apiSlugs = await fetchGuideSlugsFromApi();
  guideWithOwnTiers.availableGuideSlugs =
    apiSlugs.length > 0 ? apiSlugs : await listAvailableGuideSlugsFromFs();

  return (
    <PageWrapper
      showBack
      title={`Гайд: ${guideWithOwnTiers.champion.name}`}
      paragraphs={[
        "Сборки, руны и матчапы приходят из WildriftFire через наш WR API, описания способностей берутся с официальной страницы Riot на русском, а тир подтягивается из нашего тир-листа.",
      ]}
    >
      <GuideClient guide={guideWithOwnTiers} />
    </PageWrapper>
  );
}
