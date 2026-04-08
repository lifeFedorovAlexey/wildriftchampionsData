"use client";

import { useMemo, useState } from "react";
import styles from "@/app/me/profile.module.css";
import {
  buildPeakRankIconUrl,
  getPeakRankLabel,
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

function getAvatarLabel(identity: Identity, index: number) {
  const provider = String(identity.provider || "").trim();
  if (provider) return provider;
  return `avatar-${index + 1}`;
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
  const peakRankIconUrl = buildPeakRankIconUrl(peakRankValue);
  const peakRankLabel = getPeakRankLabel(peakRankValue);

  const avatarOptions = useMemo(() => {
    const byUrl = new Map<string, { key: string; label: string; avatarUrl: string }>();

    for (const [index, identity] of (Array.isArray(profile.identities) ? profile.identities : []).entries()) {
      const nextAvatarUrl = String(identity?.avatarUrl || "").trim();
      if (!nextAvatarUrl || byUrl.has(nextAvatarUrl)) continue;
      byUrl.set(nextAvatarUrl, {
        key: `${String(identity?.provider || "provider").trim() || "provider"}-${index}`,
        label: getAvatarLabel(identity, index),
        avatarUrl: nextAvatarUrl,
      });
    }

    return [{ key: "none", label: "без аватара", avatarUrl: "" }, ...Array.from(byUrl.values())];
  }, [profile.identities]);

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

  function addChampion(slug: string) {
    if (!slug || mainChampionSlugs.includes(slug) || mainChampionSlugs.length >= 3) return;
    setMainChampionSlugs((prev) => [...prev, slug]);
    setSearch("");
  }

  function removeChampion(slug: string) {
    setMainChampionSlugs((prev) => prev.filter((value) => value !== slug));
  }

  return (
    <form action={action} method="post" className={styles.form}>
      <div className={styles.field}>
        <span className={styles.fieldLabel}>Аватар</span>
        <div className={styles.avatarChooser}>
          {avatarOptions.map((option) => {
            const isActive = avatarUrl === option.avatarUrl;

            return (
              <button
                key={option.key}
                type="button"
                onClick={() => setAvatarUrl(option.avatarUrl)}
                className={`${styles.avatarOption} ${isActive ? styles.avatarOptionActive : ""}`.trim()}
                aria-pressed={isActive}
                title={option.label}
              >
                {option.avatarUrl ? (
                  <img
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
            );
          })}
        </div>
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
          placeholder="Player123#1234"
          className={styles.input}
          maxLength={29}
        />
        <span className={styles.helperText}>Формат: буквы и цифры, затем `#` и 4 цифры.</span>
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
        {peakRankLabel ? (
          <div className={styles.rankPreview}>
            {peakRankIconUrl ? (
              <img
                src={peakRankIconUrl}
                alt=""
                width={42}
                height={42}
                className={styles.rankPreviewIcon}
              />
            ) : null}
            <span className={styles.rankPreviewText}>{peakRankLabel}</span>
          </div>
        ) : null}
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
                    <img
                      src={champion.iconUrl}
                      alt=""
                      width={28}
                      height={28}
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
                    <img
                      src={champion.iconUrl}
                      alt=""
                      width={28}
                      height={28}
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
    </form>
  );
}
