import type { Metadata } from "next";
import { notFound } from "next/navigation";

import PageWrapper from "@/components/PageWrapper";
import TopPillLink from "@/components/TopPillLink";
import GuideClient, { type GuideData } from "./GuideClient";
import {
  type BulkResponse,
  GuideApiRequestError,
  fetchGuideFromApi,
  fetchGuideSlugsFromApi,
  fetchTierlistBulk,
  findTierLabelForChampion,
  toLaneKey,
} from "../guides-lib";

function buildGuideRoleText(guide: GuideData) {
  const roles = Array.isArray(guide.variants)
    ? guide.variants
        .map((variant) => {
          const fallbackRole = isGenericVariantTitle(variant.title) ? "" : variant.title || "";
          const laneKey = toLaneKey(variant.lane || fallbackRole);
          if (laneKey === "top") return "Барон";
          if (laneKey === "jungle") return "Лес";
          if (laneKey === "mid") return "Мид";
          if (laneKey === "adc") return "Дракон";
          if (laneKey === "support") return "Саппорт";
          return "";
        })
        .filter(Boolean)
    : [];

  if (roles.length) {
    return Array.from(new Set(roles)).join(" / ");
  }

  const fallbackLaneKey = toLaneKey(guide.metadata.recommendedRole || "");
  if (fallbackLaneKey === "top") return "Барон";
  if (fallbackLaneKey === "jungle") return "Лес";
  if (fallbackLaneKey === "mid") return "Мид";
  if (fallbackLaneKey === "adc") return "Дракон";
  if (fallbackLaneKey === "support") return "Саппорт";

  return "";
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
  let guide = null;

  try {
    guide = await fetchGuideFromApi<GuideData>(slug);
  } catch (error) {
    if (!(error instanceof GuideApiRequestError)) {
      throw error;
    }

    return {
      title: "Ошибка загрузки гайда",
      description: "Локальный API не смог отдать данные гайда.",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

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
  const guideLeadParagraph = `Актуальный гайд на ${guideWithOwnTiers.champion.name}: сборки, руны, матчапы, заклинания и порядок прокачки в одном месте.`;

  return (
    <PageWrapper
      title={`Гайд: ${guideWithOwnTiers.champion.name}`}
      paragraphs={[guideLeadParagraph]}
      topContent={
        <TopPillLink href="/guides">
          ← К гайдам
        </TopPillLink>
      }
    >
      <GuideClient guide={guideWithOwnTiers} />
    </PageWrapper>
  );
}
