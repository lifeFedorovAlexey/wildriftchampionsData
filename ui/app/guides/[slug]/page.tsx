import type { Metadata } from "next";
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

function buildGuideRoleText(guide: GuideData) {
  const roles = Array.isArray(guide.official?.roles)
    ? guide.official.roles.filter(Boolean)
    : [];

  if (roles.length) {
    return roles.join(" / ");
  }

  return guide.metadata.recommendedRole || "";
}

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

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const guide = await fetchGuideFromApi<GuideData>(slug);

  if (!guide) {
    return {
      title: "Гайд не найден",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const championName = guide.champion.name;
  const championTitle = guide.champion.title || guide.official?.champion?.title || "";
  const roleText = buildGuideRoleText(guide);
  const tierText = guide.metadata.tier ? ` Тир: ${guide.metadata.tier}.` : "";
  const patchText = guide.metadata.patch ? ` Патч: ${guide.metadata.patch}.` : "";
  const description = [
    `Гайд на ${championName} в Wild Rift.`,
    championTitle ? `${championTitle}.` : "",
    roleText ? `Роли: ${roleText}.` : "",
    "Сборки предметов, руны, прокачка умений, контрпики и синергии.",
    tierText.trim(),
    patchText.trim(),
  ]
    .filter(Boolean)
    .join(" ")
    .trim();

  const image = "/og.png";

  return {
    title: `Гайд на ${championName} WR`,
    description,
    keywords: [
      `${championName} Wild Rift`,
      `${championName} WR`,
      `гайд ${championName}`,
      `сборка ${championName} Wild Rift`,
      `руны ${championName} Wild Rift`,
    ],
    alternates: {
      canonical: `/guides/${slug}`,
    },
    openGraph: {
      title: `Гайд на ${championName} WR`,
      description,
      url: `/guides/${slug}`,
      type: "article",
      images: [{ url: image, width: 1200, height: 630 }],
      locale: "ru_RU",
    },
    twitter: {
      card: "summary_large_image",
      title: `Гайд на ${championName} WR`,
      description,
      images: [image],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true },
    },
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
  const guideDataSourceParagraph = guideWithOwnTiers.riftgg
    ? "Матчапы, предметы, руны и заклинания для этого гайда приходят из RiftGG CN Stats через наш WR API, описания способностей берутся с официальной страницы Riot на русском, а тир подтягивается из нашего тир-листа."
    : "Для этого гайда сейчас показывается базовый fallback из нашего WR API: сборки, руны и матчапы идут из основного гайда, а описания способностей берутся с официальной страницы Riot на русском. Блок RiftGG CN Stats появится, когда данные для этого чемпиона будут доступны в API.";

  return (
    <PageWrapper
      title={`Гайд: ${guideWithOwnTiers.champion.name}`}
      paragraphs={[guideDataSourceParagraph]}
    >
      <GuideClient guide={guideWithOwnTiers} />
    </PageWrapper>
  );
}
