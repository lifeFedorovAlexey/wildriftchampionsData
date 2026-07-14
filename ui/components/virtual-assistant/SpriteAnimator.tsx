import { useEffect, useState, type CSSProperties } from "react";
import {
  ASSISTANT_ANIMATIONS,
  type AssistantAnimation,
} from "./assistant-config";
import styles from "./VirtualAssistant.module.css";

const SPRITE_ASSET_VERSION = "5";

function getSpriteUrl(animation: AssistantAnimation) {
  return `/virtual-assistant/lux/${animation}.webp?v=${SPRITE_ASSET_VERSION}`;
}

type SpriteStyle = CSSProperties & {
  "--assistant-sprite": string;
  "--assistant-sheet-width": string;
  "--assistant-steps": number;
  "--assistant-duration": string;
};

export default function SpriteAnimator({
  animation,
  playbackKey,
  motion,
  position,
  onClick,
}: {
  animation: AssistantAnimation;
  playbackKey: number;
  motion: "none" | "left" | "right" | "forward" | "back";
  position: "home" | "left";
  onClick: () => void;
}) {
  const [displayed, setDisplayed] = useState({ animation, playbackKey });
  const config = ASSISTANT_ANIMATIONS[displayed.animation];
  const spriteStyle: SpriteStyle = {
    "--assistant-sprite": `url(${getSpriteUrl(displayed.animation)})`,
    "--assistant-sheet-width": `${config.frames * 100}%`,
    "--assistant-steps": config.frames - 1,
    "--assistant-duration": `${config.duration}ms`,
  };
  const motionClass =
    motion === "none"
      ? ""
      : styles[`motion${motion[0].toUpperCase()}${motion.slice(1)}`];
  const activePlaybackKey = animation === displayed.animation
    ? playbackKey
    : displayed.playbackKey;
  const playbackClass = activePlaybackKey % 2 === 0
    ? styles.spritePlaybackEven
    : styles.spritePlaybackOdd;

  useEffect(() => {
    for (const name of Object.keys(ASSISTANT_ANIMATIONS) as AssistantAnimation[]) {
      const image = new window.Image();
      image.src = getSpriteUrl(name);
      void image.decode().catch(() => undefined);
    }
  }, []);

  useEffect(() => {
    if (animation === displayed.animation) {
      return;
    }

    let cancelled = false;
    const image = new window.Image();
    image.src = getSpriteUrl(animation);
    void image.decode()
      .catch(() => undefined)
      .then(() => {
        if (!cancelled) setDisplayed({ animation, playbackKey });
      });

    return () => {
      cancelled = true;
    };
  }, [animation, displayed, playbackKey]);

  return (
    <span
      className={`${styles.characterTrack} ${
        position === "left" ? styles.characterLeft : ""
      } ${motionClass || ""}`.trim()}
    >
      <button
        type="button"
        className={styles.characterButton}
        onClick={onClick}
        aria-label="Люкс — виртуальный помощник. Нажмите для реакции"
      >
        <span
          className={`${styles.sprite} ${playbackClass} ${config.loop ? styles.spriteLoop : ""}`}
          style={spriteStyle}
          aria-hidden="true"
        />
      </button>
    </span>
  );
}
