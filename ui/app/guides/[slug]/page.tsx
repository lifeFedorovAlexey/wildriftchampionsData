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

function isGenericVariantTitle(value?: string | null) {
  const normalized = String(value || "").trim().toLowerCase();
  return /^build\s*\d+$/i.test(normalized) || /^guide\s*\d+$/i.test(normalized);
}

function applyOwnTiers(guide: GuideData, bulk: BulkResponse | null): GuideData {
  if (!guide.variants?.length) {
    return guide;
  }

  const variants = guide.variants.map((variant) => {
    const fallbackRole = isGenericVariantTitle(variant.title) ? "" : variant.title;
    const laneKey = toLaneKey(variant.lane || fallbackRole || guide.metadata.recommendedRole);
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
  const guide = await fetchGuideFromApi<GuideData>(slug);

  if (!guide) {
    notFound();
  }

  const bulk = await fetchTierlistBulk();
  const guideWithOwnTiers = applyOwnTiers(guide, bulk);
  guideWithOwnTiers.availableGuideSlugs = await fetchGuideSlugsFromApi();

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
