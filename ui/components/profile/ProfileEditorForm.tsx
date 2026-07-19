"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import styles from "@/app/me/profile.module.css";
import NativeImage from "@/components/ui/NativeImage";
import {
  getPeakRankOptions,
} from "@/lib/profile-ranks.js";

type Identity = {
  id?: number;
  provider?: string;
  avatarUrl?: string;
  name?: string;
  username?: string;
};

type ChampionOption = {
  slug: string;
  name: string;
  iconUrl?: string;
};

type ProfileValue = {
  displayName?: string;
  avatarUrl?: string;
  wildRiftHandle?: string;
  peakRank?: string;
  mainChampionSlugs?: string[];
  identities?: Identity[];
};

type AvatarOption = {
  key: string;
  label: string;
  avatarUrl: string;
};

type CropSource = {
  url: string;
  width: number;
  height: number;
  name: string;
};

const AVATAR_CROP_FRAME_SIZE = 320;
const AVATAR_OUTPUT_SIZE = 512;
const AVATAR_MAX_PICK_SIZE = 10 * 1024 * 1024;
const ALLOWED_AVATAR_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function getSafeCropSourceUrl(value: string) {
  try {
    const parsed = new URL(value, window.location.href);
    return parsed.protocol === "blob:" && parsed.origin === window.location.origin
      ? parsed.href
      : "";
  } catch {
    return "";
  }
}

function getAvatarLabel(identity: Identity, index: number) {
  const provider = String(identity.provider || "").trim();
  if (provider) return provider;
  return `avatar-${index + 1}`;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function buildCropLayout(
  source: CropSource,
  zoom: number,
  offset: { x: number; y: number },
) {
  const baseScale = Math.max(
    AVATAR_CROP_FRAME_SIZE / source.width,
    AVATAR_CROP_FRAME_SIZE / source.height,
  );
  const width = source.width * baseScale * zoom;
  const height = source.height * baseScale * zoom;
  const minX = Math.min(0, AVATAR_CROP_FRAME_SIZE - width);
  const minY = Math.min(0, AVATAR_CROP_FRAME_SIZE - height);
  const maxX = 0;
  const maxY = 0;

  return {
    width,
    height,
    x: clamp(offset.x, minX, maxX),
    y: clamp(offset.y, minY, maxY),
  };
}

function buildCenteredCropOffset(source: CropSource, zoom = 1) {
  const layout = buildCropLayout(source, zoom, { x: 0, y: 0 });
  return {
    x: (AVATAR_CROP_FRAME_SIZE - layout.width) / 2,
    y: (AVATAR_CROP_FRAME_SIZE - layout.height) / 2,
  };
}

async function loadCropSource(file: File) {
  const objectUrl = URL.createObjectURL(file);

  try {
    const dimensions = await new Promise<{ width: number; height: number }>((resolve, reject) => {
      const image = new window.Image();
      image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight });
      image.onerror = reject;
      image.src = objectUrl;
    });

    return {
      url: objectUrl,
      width: dimensions.width,
      height: dimensions.height,
      name: file.name,
    };
  } catch (error) {
    URL.revokeObjectURL(objectUrl);
    throw error;
  }
}

export default function ProfileEditorForm({
  action,
  profile,
  champions,
}: {
  action: string;
  profile: ProfileValue;
  champions: ChampionOption[];
}) {
  const initialAvatarUrl = String(profile.avatarUrl || "").trim();
  const initialMainChampionSlugs = Array.isArray(profile.mainChampionSlugs)
    ? profile.mainChampionSlugs
    : [];

  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl);
  const [search, setSearch] = useState("");
  const [mainChampionSlugs, setMainChampionSlugs] = useState(initialMainChampionSlugs);
  const [peakRankValue, setPeakRankValue] = useState(
    String(profile.peakRank || "").trim().toLowerCase(),
  );
  const [cropSource, setCropSource] = useState<CropSource | null>(null);
  const [cropZoom, setCropZoom] = useState(1);
  const [cropOffset, setCropOffset] = useState({ x: 0, y: 0 });
  const [cropDrag, setCropDrag] = useState<{
    pointerId: number;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
  } | null>(null);
  const [avatarUploadError, setAvatarUploadError] = useState("");
  const [avatarUploadNotice, setAvatarUploadNotice] = useState("");
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cropImageRef = useRef<HTMLImageElement | null>(null);

  const avatarOptions = useMemo(() => {
    const byUrl = new Map<string, AvatarOption>();

    for (const [index, identity] of (Array.isArray(profile.identities) ? profile.identities : []).entries()) {
      const nextAvatarUrl = String(identity?.avatarUrl || "").trim();
      if (!nextAvatarUrl || byUrl.has(nextAvatarUrl)) continue;
      byUrl.set(nextAvatarUrl, {
        key: `${String(identity?.provider || "provider").trim() || "provider"}-${index}`,
        label: getAvatarLabel(identity, index),
        avatarUrl: nextAvatarUrl,
      });
    }

    if (avatarUrl && !byUrl.has(avatarUrl)) {
      byUrl.set(avatarUrl, {
        key: "uploaded-avatar",
        label: "загруженный",
        avatarUrl,
      });
    }

    return [{ key: "none", label: "без аватара", avatarUrl: "" }, ...Array.from(byUrl.values())];
  }, [avatarUrl, profile.identities]);

  const championMap = useMemo(
    () => new Map(champions.map((champion) => [champion.slug, champion])),
    [champions],
  );

  const filteredChampions = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return champions
      .filter((champion) => !mainChampionSlugs.includes(champion.slug))
      .filter((champion) => {
        if (!normalizedSearch) return true;
        return (
          champion.name.toLowerCase().includes(normalizedSearch) ||
          champion.slug.toLowerCase().includes(normalizedSearch)
        );
      })
      .slice(0, 8);
  }, [champions, mainChampionSlugs, search]);

  const cropLayout = useMemo(
    () => (cropSource ? buildCropLayout(cropSource, cropZoom, cropOffset) : null),
    [cropOffset, cropSource, cropZoom],
  );

  useEffect(() => {
    if (!cropSource || !cropLayout) return;

    if (cropLayout.x !== cropOffset.x || cropLayout.y !== cropOffset.y) {
      setCropOffset({ x: cropLayout.x, y: cropLayout.y });
    }
  }, [cropLayout, cropOffset.x, cropOffset.y, cropSource]);

  useEffect(() => {
    return () => {
      if (cropSource?.url) {
        URL.revokeObjectURL(cropSource.url);
      }
    };
  }, [cropSource]);

  function addChampion(slug: string) {
    if (!slug || mainChampionSlugs.includes(slug) || mainChampionSlugs.length >= 3) return;
    setMainChampionSlugs((prev) => [...prev, slug]);
    setSearch("");
  }

  function removeChampion(slug: string) {
    setMainChampionSlugs((prev) => prev.filter((value) => value !== slug));
  }

  async function handleAvatarFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!ALLOWED_AVATAR_TYPES.has(file.type)) {
      setAvatarUploadError("Выбери PNG, JPG или WebP.");
      return;
    }

    if (file.size > AVATAR_MAX_PICK_SIZE) {
      setAvatarUploadError("Файл слишком большой. Лучше до 10 МБ.");
      return;
    }

    try {
      const nextSource = await loadCropSource(file);
      setAvatarUploadError("");
      setAvatarUploadNotice("");
      setCropZoom(1);
      setCropOffset(buildCenteredCropOffset(nextSource, 1));
      setCropDrag(null);
      setCropSource(nextSource);
    } catch {
      setAvatarUploadError("Не удалось открыть картинку. Попробуй другой файл.");
    }
  }

  function closeCropper() {
    setCropDrag(null);
    setCropZoom(1);
    setCropOffset({ x: 0, y: 0 });
    setCropSource(null);
  }

  function handleCropZoomChange(nextZoom: number) {
    if (!cropSource) return;
    const centeredOffset = buildCenteredCropOffset(cropSource, nextZoom);
    const preservedOffset = {
      x: cropOffset.x + (cropOffset.x - centeredOffset.x) * 0.08,
      y: cropOffset.y + (cropOffset.y - centeredOffset.y) * 0.08,
    };

    setCropZoom(nextZoom);
    setCropOffset(preservedOffset);
  }

  function handleCropPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (!cropLayout) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    setCropDrag({
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: cropLayout.x,
      originY: cropLayout.y,
    });
  }

  function handleCropPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (!cropDrag || cropDrag.pointerId !== event.pointerId || !cropSource) return;

    setCropOffset({
      x: cropDrag.originX + (event.clientX - cropDrag.startX),
      y: cropDrag.originY + (event.clientY - cropDrag.startY),
    });
  }

  function handleCropPointerEnd(event: React.PointerEvent<HTMLDivElement>) {
    if (cropDrag?.pointerId !== event.pointerId) return;
    setCropDrag(null);
  }

  async function handleAvatarUpload() {
    if (!cropSource || !cropLayout || !cropImageRef.current) return;

    const canvas = document.createElement("canvas");
    canvas.width = AVATAR_OUTPUT_SIZE;
    canvas.height = AVATAR_OUTPUT_SIZE;
    const context = canvas.getContext("2d");

    if (!context) {
      setAvatarUploadError("Не удалось подготовить изображение.");
      return;
    }

    const drawRatio = AVATAR_OUTPUT_SIZE / AVATAR_CROP_FRAME_SIZE;
    context.drawImage(
      cropImageRef.current,
      cropLayout.x * drawRatio,
      cropLayout.y * drawRatio,
      cropLayout.width * drawRatio,
      cropLayout.height * drawRatio,
    );

    const imageBase64 = canvas.toDataURL("image/webp", 0.92);

    setIsUploadingAvatar(true);
    setAvatarUploadError("");
    setAvatarUploadNotice("");

    try {
      const response = await fetch("/api/user/avatar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ imageBase64 }),
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok || !payload?.avatarUrl) {
        throw new Error(payload?.error || "avatar_upload_failed");
      }

      setAvatarUrl(payload.avatarUrl);
      setAvatarUploadNotice("Аватар загружен. Теперь можно сохранить профиль.");
      closeCropper();
    } catch (error) {
      const code = error instanceof Error ? error.message : "avatar_upload_failed";
      if (code === "avatar_too_large") {
        setAvatarUploadError("Файл слишком большой даже после обработки. Попробуй другое изображение.");
      } else if (code === "avatar_storage_unavailable") {
        setAvatarUploadError("S3-хранилище сейчас недоступно. Проверь настройки и попробуй снова.");
      } else {
        setAvatarUploadError("Не удалось загрузить аватар. Попробуй ещё раз.");
      }
    } finally {
      setIsUploadingAvatar(false);
    }
  }

  return (
    <form action={action} method="post" className={styles.form}>
      <div className={styles.field}>
        <span className={styles.fieldLabel}>Аватар</span>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className={styles.hiddenFileInput}
          onChange={handleAvatarFileChange}
        />
        <div className={styles.avatarChooser}>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className={`${styles.avatarOption} ${styles.avatarOptionUpload}`.trim()}
            title="Загрузить свой аватар"
            aria-label="Загрузить свой аватар"
          >
            <span className={styles.avatarUploadPlus}>+</span>
          </button>
          {avatarOptions.map((option) => {
            const isActive = avatarUrl === option.avatarUrl;
            const isUploadedAvatar = option.key === "uploaded-avatar";

            return (
              <div key={option.key} className={styles.avatarOptionWrap}>
                <button
                  type="button"
                  onClick={() => setAvatarUrl(option.avatarUrl)}
                  className={`${styles.avatarOption} ${isActive ? styles.avatarOptionActive : ""}`.trim()}
                  aria-pressed={isActive}
                  title={option.label}
                >
                  {option.avatarUrl ? (
                    <NativeImage
                      src={option.avatarUrl}
                      alt={option.label}
                      width={56}
                      height={56}
                      className={styles.avatarChoiceImage}
                    />
                  ) : (
                    <span className={styles.avatarChoiceFallback}>?</span>
                  )}
                </button>
                {isUploadedAvatar ? (
                  <button
                    type="button"
                    className={styles.avatarRemoveButton}
                    aria-label="Удалить свой аватар"
                    title="Удалить свой аватар"
                    onClick={(event) => {
                      event.stopPropagation();
                      setAvatarUrl("");
                      setAvatarUploadError("");
                      setAvatarUploadNotice("");
                    }}
                  >
                    ×
                  </button>
                ) : null}
              </div>
            );
          })}
        </div>
        <span className={styles.avatarUploadNote}>
          Квадратный crop 1:1, итоговый размер {AVATAR_OUTPUT_SIZE}x{AVATAR_OUTPUT_SIZE}.
        </span>
        {avatarUploadError ? (
          <span className={`${styles.helperText} ${styles.helperTextError}`.trim()}>
            {avatarUploadError}
          </span>
        ) : null}
        {avatarUploadNotice ? (
          <span className={`${styles.helperText} ${styles.helperTextSuccess}`.trim()}>
            {avatarUploadNotice}
          </span>
        ) : null}
        <input type="hidden" name="avatarUrl" value={avatarUrl} />
      </div>

      <label className={styles.field}>
        <span className={styles.fieldLabel}>Ник на сайте</span>
        <input
          name="displayName"
          defaultValue={profile.displayName || ""}
          placeholder="Как тебя показывать на сайте"
          className={styles.input}
          maxLength={48}
        />
      </label>

      <label className={styles.field}>
        <span className={styles.fieldLabel}>Ник в Wild Rift</span>
        <input
          name="wildRiftHandle"
          defaultValue={profile.wildRiftHandle || ""}
          placeholder="life on fire#7595"
          className={styles.input}
          maxLength={30}
        />
        <span className={styles.helperText}>
          Формат Riot ID: name#tag, например `life on fire#7595`.
        </span>
      </label>

      <label className={styles.field}>
        <span className={styles.fieldLabel}>Максимальный ранг</span>
        <select
          name="peakRank"
          value={peakRankValue}
          onChange={(event) => setPeakRankValue(event.target.value)}
          className={`${styles.input} ${styles.select}`.trim()}
        >
          {getPeakRankOptions().map((option) => (
            <option key={option.value || "none"} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <div className={styles.field}>
        <span className={styles.fieldLabel}>Мейн-чемпионы</span>
        <div className={styles.championPicker}>
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={mainChampionSlugs.length >= 3 ? "Лимит 3 чемпиона" : "Начни вводить имя чемпиона"}
            className={styles.input}
            disabled={mainChampionSlugs.length >= 3}
          />
          {filteredChampions.length > 0 && search.trim() ? (
            <div className={styles.championResults}>
              {filteredChampions.map((champion) => (
                <button
                  key={champion.slug}
                  type="button"
                  onClick={() => addChampion(champion.slug)}
                  className={styles.championOption}
                >
                  {champion.iconUrl ? (
                    <Image
                      src={champion.iconUrl}
                      alt=""
                      width={28}
                      height={28}
                      sizes="28px"
                      unoptimized={champion.iconUrl.startsWith("/wr-api/")}
                      className={styles.championOptionIcon}
                    />
                  ) : (
                    <span className={styles.championOptionFallback}>
                      {champion.name.slice(0, 1).toUpperCase()}
                    </span>
                  )}
                  <span>{champion.name}</span>
                </button>
              ))}
            </div>
          ) : null}

          <div className={styles.selectedChampions}>
            {mainChampionSlugs.map((slug) => {
              const champion = championMap.get(slug);
              if (!champion) return null;

              return (
                <div key={slug} className={styles.championPill}>
                  <input type="hidden" name="mainChampionSlugs" value={slug} />
                  {champion.iconUrl ? (
                    <Image
                      src={champion.iconUrl}
                      alt=""
                      width={28}
                      height={28}
                      sizes="28px"
                      unoptimized={champion.iconUrl.startsWith("/wr-api/")}
                      className={styles.championOptionIcon}
                    />
                  ) : (
                    <span className={styles.championOptionFallback}>
                      {champion.name.slice(0, 1).toUpperCase()}
                    </span>
                  )}
                  <span>{champion.name}</span>
                  <button
                    type="button"
                    onClick={() => removeChampion(slug)}
                    className={styles.championPillRemove}
                    aria-label={`Убрать ${champion.name}`}
                  >
                    ×
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <button type="submit" className={styles.button}>
        Сохранить
      </button>

      {cropSource && cropLayout ? (
        <div className={styles.cropOverlay} onClick={closeCropper}>
          <div className={styles.cropDialog} onClick={(event) => event.stopPropagation()}>
            <div className={styles.cropHead}>
              <div>
                <strong className={styles.cardTitle}>Подготовка аватара</strong>
                <p className={styles.helperText}>
                  Двигай изображение и подбери масштаб. В итог пойдет квадрат {AVATAR_OUTPUT_SIZE}x{AVATAR_OUTPUT_SIZE}.
                </p>
              </div>
            </div>

            <div className={styles.cropStage}>
              <div
                className={styles.cropViewport}
                onPointerDown={handleCropPointerDown}
                onPointerMove={handleCropPointerMove}
                onPointerUp={handleCropPointerEnd}
                onPointerCancel={handleCropPointerEnd}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  ref={cropImageRef}
                  src={getSafeCropSourceUrl(cropSource.url)}
                  alt=""
                  className={styles.cropImage}
                  style={{
                    width: `${cropLayout.width}px`,
                    height: `${cropLayout.height}px`,
                    transform: `translate3d(${cropLayout.x}px, ${cropLayout.y}px, 0)`,
                  }}
                  draggable={false}
                />
                <div className={styles.cropFrame} aria-hidden="true" />
              </div>
            </div>

            <label className={styles.cropZoomField}>
              <span className={styles.fieldLabel}>Масштаб</span>
              <input
                type="range"
                min="1"
                max="3"
                step="0.01"
                value={cropZoom}
                onChange={(event) => handleCropZoomChange(Number(event.target.value))}
                className={styles.cropRange}
              />
            </label>

            <div className={styles.cropActions}>
              <button
                type="button"
                onClick={closeCropper}
                className={`${styles.button} ${styles.buttonGhost}`.trim()}
                disabled={isUploadingAvatar}
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={handleAvatarUpload}
                className={styles.button}
                disabled={isUploadingAvatar}
              >
                {isUploadingAvatar ? "Загружаю..." : "Вырезать и загрузить"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </form>
  );
}
