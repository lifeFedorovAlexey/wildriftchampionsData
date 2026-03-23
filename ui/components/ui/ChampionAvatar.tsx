"use client";

import type { KeyboardEventHandler } from "react";
import Image from "next/image";
import Link from "next/link";

import { ensureLocalAssetSrc } from "@/lib/asset-safety";
import styles from "./ChampionAvatar.module.css";

type ChampionAvatarProps = {
  name: string;
  src?: string | null;
  alt?: string;
  title?: string;
  shape?: "square" | "circle";
  mobileSize?: number;
  desktopSize?: number;
  mobileRadius?: number;
  desktopRadius?: number;
  className?: string;
  imageClassName?: string;
  fallbackClassName?: string;
  href?: string;
  onClick?: () => void;
  onKeyDown?: KeyboardEventHandler<HTMLElement>;
  loading?: "eager" | "lazy";
  fetchPriority?: "high" | "low" | "auto";
  decoding?: "async" | "sync" | "auto";
};

function cx(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

function withRequestedIconSize(src: string | null, size: number) {
  if (!src || !src.startsWith("/wr-api/icons/")) {
    return src;
  }

  const separator = src.includes("?") ? "&" : "?";
  return `${src}${separator}size=${size}`;
}

export default function ChampionAvatar({
  name,
  src,
  alt,
  title,
  shape = "square",
  mobileSize = 44,
  desktopSize = mobileSize,
  mobileRadius,
  desktopRadius,
  className,
  imageClassName,
  fallbackClassName,
  href,
  onClick,
  onKeyDown,
  loading = "lazy",
  fetchPriority,
  decoding = "async",
}: ChampionAvatarProps) {
  const radiusMobile =
    mobileRadius ?? (shape === "circle" ? mobileSize / 2 : Math.round(mobileSize * 0.28));
  const radiusDesktop =
    desktopRadius ??
    (shape === "circle" ? desktopSize / 2 : Math.round(desktopSize * 0.28));

  const style = {
    ["--avatar-size-mobile" as string]: `${mobileSize}px`,
    ["--avatar-size-desktop" as string]: `${desktopSize}px`,
    ["--avatar-radius-mobile" as string]: `${radiusMobile}px`,
    ["--avatar-radius-desktop" as string]: `${radiusDesktop}px`,
  };

  const wrapperClassName = cx(
    styles.root,
    shape === "circle" ? styles.circle : styles.square,
    (href || onClick) && styles.interactive,
    className,
  );

  const sizes = `(max-width: 768px) ${mobileSize}px, ${desktopSize}px`;
  const requestedSize = Math.max(mobileSize, desktopSize);
  const safeSrc = withRequestedIconSize(
    ensureLocalAssetSrc("ChampionAvatar", src),
    requestedSize,
  );

  const content = safeSrc ? (
    <Image
      src={safeSrc}
      alt={alt || name}
      title={title}
      width={requestedSize}
      height={requestedSize}
      sizes={sizes}
      loading={loading}
      fetchPriority={fetchPriority}
      decoding={decoding}
      className={cx(styles.image, imageClassName)}
    />
  ) : (
    <span className={cx(styles.fallback, fallbackClassName)} aria-hidden="true" title={title}>
      {name.slice(0, 1)}
    </span>
  );

  if (href) {
    return (
      <Link href={href} className={wrapperClassName} style={style} aria-label={title || name}>
        {content}
      </Link>
    );
  }

  if (onClick) {
    return (
      <button
        type="button"
        className={wrapperClassName}
        style={style}
        onClick={onClick}
        onKeyDown={onKeyDown}
        title={title}
        aria-label={title || name}
      >
        {content}
      </button>
    );
  }

  return (
    <div className={wrapperClassName} style={style} title={title}>
      {content}
    </div>
  );
}
