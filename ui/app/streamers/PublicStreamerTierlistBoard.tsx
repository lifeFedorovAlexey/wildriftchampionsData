"use client";

import { useMemo, useState } from "react";
import { RoleIcon } from "@/components/RoleIcon";
import ChampionAvatar from "@/components/ui/ChampionAvatar";
import { tierBg } from "@/components/styled/tierlist";
import type {
  StreamerLaneKey,
  StreamerPublicationPayload,
} from "@/lib/streamer-tierlists-api";
import styles from "./streamers.module.css";

const LANE_LABELS: Record<StreamerLaneKey, string> = {
  top: "Топ",
  jungle: "Лес",
  mid: "Мид",
  adc: "АДК",
  support: "Саппорт",
};

function countLaneChampions(payload: StreamerPublicationPayload, lane: StreamerLaneKey) {
  const lanePayload = payload.lanes?.[lane];
  if (!lanePayload?.tiers) return 0;

  return payload.tiersOrder.reduce((total, tier) => total + (lanePayload.tiers?.[tier]?.length || 0), 0);
}

export default function PublicStreamerTierlistBoard({
  payload,
}: {
  payload: StreamerPublicationPayload;
}) {
  const laneKeys = useMemo(
    () => Object.keys(payload.lanes) as StreamerLaneKey[],
    [payload.lanes],
  );
  const [selectedLane, setSelectedLane] = useState<StreamerLaneKey>(laneKeys[0] || "top");
  const lanePayload = payload.lanes?.[selectedLane];

  return (
    <section className={styles.boardCard}>
      <div className={styles.boardTabs} role="tablist" aria-label="Линии тирлиста">
        {laneKeys.map((lane) => {
          const active = lane === selectedLane;
          return (
            <button
              key={lane}
              type="button"
              role="tab"
              aria-selected={active}
              className={`${styles.boardTab} ${active ? styles.boardTabActive : ""}`.trim()}
              onClick={() => setSelectedLane(lane)}
            >
              <RoleIcon laneKey={lane} size={24} />
              <span>{LANE_LABELS[lane]}</span>
              <span className={styles.boardTabCount}>{countLaneChampions(payload, lane)}</span>
            </button>
          );
        })}
      </div>

      <div className={styles.laneBoard}>
        <div className={styles.laneBoardHead}>
          <h2 className={styles.laneTitle}>{LANE_LABELS[selectedLane]}</h2>
          <p className={styles.cardText}>
            Показана опубликованная версия по выбранной линии.
          </p>
        </div>

        <div className={styles.tierRows}>
          {payload.tiersOrder.map((tier) => {
            const champions = lanePayload?.tiers?.[tier] || [];

            return (
              <div key={`${selectedLane}-${tier}`} className={styles.tierRow}>
                <div
                  className={styles.tierBadge}
                  style={{
                    background: tierBg(tier),
                    color: "#10151f",
                  }}
                >
                  {tier}
                </div>

                <div className={styles.tierChamps}>
                  {champions.length ? (
                    champions.map((champion) => (
                      <div
                        key={`${selectedLane}-${tier}-${champion.slug}`}
                        className={styles.championTile}
                        title={
                          champion.roles?.length
                            ? `${champion.name} • ${champion.roles.join(" / ")}`
                            : champion.name
                        }
                      >
                        <ChampionAvatar
                          name={champion.name}
                          src={champion.iconUrl}
                          mobileSize={38}
                          desktopSize={50}
                          mobileRadius={12}
                          desktopRadius={14}
                        />
                      </div>
                    ))
                  ) : (
                    <div className={styles.tierEmpty}>Для этого тира чемпионов не добавили.</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
