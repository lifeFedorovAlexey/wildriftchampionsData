import type { CSSProperties } from "react";
import {
  ASSISTANT_ANIMATIONS,
  type AssistantAnimation,
} from "./assistant-config";
import styles from "./VirtualAssistant.module.css";

const SPRITE_ASSET_VERSION = "4";

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
  const config = ASSISTANT_ANIMATIONS[animation];
  const spriteStyle: SpriteStyle = {
    "--assistant-sprite": `url(/virtual-assistant/lux/${animation}.webp?v=${SPRITE_ASSET_VERSION})`,
    "--assistant-sheet-width": `${config.frames * 100}%`,
    "--assistant-steps": config.frames - 1,
    "--assistant-duration": `${config.duration}ms`,
  };
  const motionClass =
    motion === "none"
      ? ""
      : styles[`motion${motion[0].toUpperCase()}${motion.slice(1)}`];

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
          key={`${animation}-${playbackKey}`}
          className={`${styles.sprite} ${config.loop ? styles.spriteLoop : ""}`}
          style={spriteStyle}
          aria-hidden="true"
        />
      </button>
    </span>
  );
}
