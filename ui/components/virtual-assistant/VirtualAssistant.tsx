"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { API_BASE } from "@/constants/apiBase";
import {
  ASSISTANT_ANIMATIONS,
  ASSISTANT_STORAGE,
  CLICK_REACTIONS,
  CLOSE_MESSAGES,
  IDLE_REACTION_SEQUENCES,
  INTRO_MESSAGE,
  type AssistantAnimation,
} from "./assistant-config";
import {
  VIRTUAL_ASSISTANT_EVENT,
  type VirtualAssistantEventDetail,
} from "./assistant-events";
import type {
  ChampionRecommendation,
  NewChampionInsight,
} from "./recommendation-engine";
import {
  generateListEndLine,
  generateMetricLine,
  generateNewChampionLine,
  generateRankLine,
  generateRecommendationLine,
} from "./dialogue-generator";
import SpriteAnimator from "./SpriteAnimator";
import TypewriterText from "./TypewriterText";
import styles from "./VirtualAssistant.module.css";

type AssistantMotion = "none" | "left" | "right" | "forward" | "back";

type ScenarioBeat = {
  animation: AssistantAnimation;
  message?: string | null;
  motion?: AssistantMotion;
  position?: "home" | "left";
  hold?: number;
};

function rankScenario(rankKey: string, rankLabel: string): ScenarioBeat[] {
  const animations: Record<string, AssistantAnimation> = {
    diamondPlus: "thoughtful",
    masterPlus: "weapon_spin",
    king: "battle_stance",
    peak: "victory",
    overall: "thoughtful",
  };

  return [
    { animation: "jump_forward", motion: "forward", message: null },
    {
      animation: animations[rankKey] || "wave",
      message: generateRankLine(rankKey, rankLabel),
      hold: 4800,
    },
    { animation: "jump_back", motion: "back" },
  ];
}

function laneScenario(
  laneLabel: string,
  recommended: ChampionRecommendation[],
  newcomers: NewChampionInsight[],
): ScenarioBeat[] {
  const [best, alternative] = recommended;
  const message = generateRecommendationLine(best, alternative, laneLabel);
  const newcomer = newcomers[0];

  return [
    { animation: "cast_spell", message, hold: 5600 },
    ...(newcomer
      ? [{
          animation: "victory" as const,
          message: generateNewChampionLine(newcomer),
          hold: 6200,
        }]
      : []),
  ];
}

function buildScenario(detail: VirtualAssistantEventDetail): ScenarioBeat[] {
  switch (detail.kind) {
    case "rank_changed":
      return rankScenario(detail.rankKey, detail.rankLabel);
    case "lane_changed":
      return laneScenario(detail.laneLabel, detail.recommended, detail.newcomers);
    case "list_end": {
      const message = generateListEndLine(detail.avoid);
      return [
        { animation: "walk_left", motion: "left", position: "left", message: null },
        {
          animation: detail.avoid.length ? "frown" : "thoughtful",
          message,
          hold: 6000,
        },
        { animation: "walk_right", motion: "right", position: "home" },
      ];
    }
    case "metric_sorted": {
      return [{ animation: "thoughtful", message: generateMetricLine(detail.metric), hold: 4800 }];
    }
    case "champion_focused":
      return [{
        animation: detail.champion.score >= 0.67 ? "victory" : "thoughtful",
        message: "Оценка ещё не подготовлена. Я обновлю её после следующего запуска анализа.",
        hold: 7600,
      }];
    case "empty_results":
      return [{ animation: "frown", message: detail.message || "Для этих фильтров данных не нашлось." }];
    case "load_error":
      return [{ animation: "hurt", message: detail.message || "Статистика временно не загрузилась." }];
    case "save_success":
      return [{ animation: "victory", message: detail.message || "Готово! Изменения сохранены." }];
    case "tip":
      return [{ animation: "thoughtful", message: detail.message || "Сравнивай чемпионов одной линии — так точнее." }];
  }
}

export default function VirtualAssistant() {
  const [mounted, setMounted] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [closing, setClosing] = useState(false);
  const [animation, setAnimation] = useState<AssistantAnimation>("idle_smile");
  const [motion, setMotion] = useState<AssistantMotion>("none");
  const [characterPosition, setCharacterPosition] = useState<"home" | "left">("home");
  const [playbackKey, setPlaybackKey] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const reactionIndex = useRef(0);
  const lastIdleReaction = useRef(-1);
  const scenarioTimer = useRef<number | null>(null);
  const closeTimer = useRef<number | null>(null);
  const scenarioVersion = useRef(0);
  const scenarioQueue = useRef<ScenarioBeat[][]>([]);
  const scenarioRunning = useRef(false);

  const stopScenario = useCallback(() => {
    scenarioVersion.current += 1;
    scenarioQueue.current = [];
    scenarioRunning.current = false;
    if (scenarioTimer.current != null) {
      window.clearTimeout(scenarioTimer.current);
      scenarioTimer.current = null;
    }
  }, []);

  const playScenario = useCallback(
    (beats: ScenarioBeat[]) => {
      if (!beats.length) return;
      scenarioQueue.current.push(beats);
      if (scenarioRunning.current) return;

      const playNextScenario = () => {
        const nextBeats = scenarioQueue.current.shift();
        if (!nextBeats) {
          scenarioRunning.current = false;
          setAnimation("idle_smile");
          setMotion("none");
          setPlaybackKey((current) => current + 1);
          return;
        }
        scenarioRunning.current = true;
        const version = scenarioVersion.current;

        const playBeat = (index: number) => {
          if (scenarioVersion.current !== version) return;
          const beat = nextBeats[index];
          if (!beat) {
            playNextScenario();
            return;
          }

          setAnimation(beat.animation);
          setMotion(beat.motion || "none");
          if (beat.position) setCharacterPosition(beat.position);
          setPlaybackKey((current) => current + 1);
          if (Object.prototype.hasOwnProperty.call(beat, "message")) {
            setMessage(beat.message || null);
          }

          const animationConfig = ASSISTANT_ANIMATIONS[beat.animation];
          const holdDuration = beat.hold || 120;

          if (beat.hold && !animationConfig.loop) {
            scenarioTimer.current = window.setTimeout(() => {
              if (scenarioVersion.current !== version) return;
              setAnimation("idle_smile");
              setMotion("none");
              setPlaybackKey((current) => current + 1);
              scenarioTimer.current = window.setTimeout(
                () => playBeat(index + 1),
                holdDuration,
              );
            }, animationConfig.duration);
            return;
          }

          scenarioTimer.current = window.setTimeout(
            () => playBeat(index + 1),
            animationConfig.duration + holdDuration,
          );
        };

        playBeat(0);
      };

      playNextScenario();
    },
    [],
  );

  useEffect(() => {
    const wasIntroduced = localStorage.getItem(ASSISTANT_STORAGE.introduced) === "1";
    const wasMinimized = localStorage.getItem(ASSISTANT_STORAGE.minimized) === "1";
    const hydrationTimer = window.setTimeout(() => {
      setMinimized(wasMinimized);
      setMounted(true);
      if (!wasIntroduced && !wasMinimized) {
        localStorage.setItem(ASSISTANT_STORAGE.introduced, "1");
        playScenario([
          { animation: "flash_entrance", message: INTRO_MESSAGE, hold: 1800 },
          { animation: "wave" },
        ]);
      }
    }, 0);
    return () => window.clearTimeout(hydrationTimer);
  }, [playScenario]);

  useEffect(() => {
    const handleAssistantEvent = async (event: Event) => {
      if (localStorage.getItem(ASSISTANT_STORAGE.minimized) === "1") return;
      const detail = (event as CustomEvent<VirtualAssistantEventDetail>).detail;
      if (!detail?.kind) return;
      if (detail.kind === "champion_focused") {
        try {
          const params = new URLSearchParams({
            champion: detail.champion.slug,
            lane: detail.laneKey,
            rank: detail.rankKey,
          });
          const response = await fetch(`${API_BASE}/api/assistant/responses?${params}`, {
            cache: "no-store",
          });
          if (response.ok) {
            const payload = await response.json();
            playScenario([{
              animation: detail.champion.score >= 0.67 ? "victory" : "thoughtful",
              message: payload.response,
              hold: 7600,
            }]);
            return;
          }
        } catch {
          // Keep the assistant usable if the daily response is temporarily unavailable.
        }
      }
      playScenario(buildScenario(detail));
    };
    window.addEventListener(VIRTUAL_ASSISTANT_EVENT, handleAssistantEvent);
    return () => window.removeEventListener(VIRTUAL_ASSISTANT_EVENT, handleAssistantEvent);
  }, [playScenario]);

  useEffect(
    () => () => {
      stopScenario();
      if (closeTimer.current != null) window.clearTimeout(closeTimer.current);
    },
    [stopScenario],
  );

  useEffect(() => {
    if (!message) return;
    const timer = window.setTimeout(() => setMessage(null), 14000);
    return () => window.clearTimeout(timer);
  }, [message]);

  useEffect(() => {
    if (
      !mounted ||
      minimized ||
      message ||
      animation !== "idle_smile"
    ) {
      return;
    }

    const delay = ASSISTANT_ANIMATIONS.idle_smile.duration;
    const idleTimer = window.setTimeout(() => {
      const nextIndex =
        (lastIdleReaction.current + 1) % IDLE_REACTION_SEQUENCES.length;
      const selected = IDLE_REACTION_SEQUENCES[nextIndex];
      if (!selected) return;

      lastIdleReaction.current = nextIndex;
      playScenario(
        selected.map((idleAnimation) => ({ animation: idleAnimation })),
      );
    }, delay);

    return () => window.clearTimeout(idleTimer);
  }, [animation, message, minimized, mounted, playScenario]);

  if (!mounted) return null;

  const minimize = () => {
    if (closing) return;

    const closingMessage =
      CLOSE_MESSAGES[Math.floor(Math.random() * CLOSE_MESSAGES.length)];
    const storeBanner = document.querySelector<HTMLElement>(
      "[data-skin-store-banner]",
    );
    localStorage.setItem(ASSISTANT_STORAGE.minimized, "1");
    setClosing(true);
    stopScenario();
    storeBanner?.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
      block: "start",
    });
    playScenario([
      {
        animation: "air_kiss",
        message: closingMessage,
        hold: 3600,
      },
    ]);
    closeTimer.current = window.setTimeout(() => {
      stopScenario();
      setMessage(null);
      setMinimized(true);
      setClosing(false);
      closeTimer.current = null;
    }, 4400);
  };

  const restore = () => {
    setMinimized(false);
    localStorage.setItem(ASSISTANT_STORAGE.minimized, "0");
    playScenario([{ animation: "wave", message: "Я снова здесь. Чем помочь?" }]);
  };

  const reactToClick = () => {
    if (closing) return;
    const reaction = CLICK_REACTIONS[reactionIndex.current % CLICK_REACTIONS.length];
    reactionIndex.current += 1;
    playScenario([{ animation: reaction.animation, message: reaction.message }]);
  };

  if (minimized) {
    return (
      <button type="button" className={styles.restoreButton} onClick={restore} aria-label="Открыть виртуального помощника">
        <span className={styles.restoreGlow} aria-hidden="true" />
        <span aria-hidden="true">✦</span>
        <span className={styles.restoreLabel}>Помощник</span>
      </button>
    );
  }

  return (
    <aside className={styles.assistant} aria-label="Виртуальный помощник">
      {message ? (
        <div className={styles.bubble} role="status" aria-live="polite">
          <button type="button" className={styles.bubbleClose} onClick={() => setMessage(null)} aria-label="Закрыть подсказку">
            <span className={styles.closeIcon} aria-hidden="true" />
          </button>
          <span className={styles.name}>Люкс</span>
          <p><TypewriterText key={message} text={message} /></p>
        </div>
      ) : null}
      <button type="button" className={styles.minimizeButton} onClick={minimize} disabled={closing} aria-label="Свернуть виртуального помощника" title="Свернуть">−</button>
      <SpriteAnimator
        animation={animation}
        playbackKey={playbackKey}
        motion={motion}
        position={characterPosition}
        onClick={reactToClick}
      />
    </aside>
  );
}
