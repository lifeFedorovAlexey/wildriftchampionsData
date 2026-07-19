import { useEffect, useRef, useState } from "react";
import {
  ASSISTANT_ANIMATIONS,
  type AssistantAnimation,
} from "./assistant-config";
import styles from "./VirtualAssistant.module.css";

const SPRITE_ASSET_VERSION = "5";

const spriteImageCache = new Map<AssistantAnimation, HTMLImageElement>();
const spriteDecodeCache = new Map<AssistantAnimation, Promise<void>>();

function getSpriteUrl(animation: AssistantAnimation) {
  return `/virtual-assistant/lux/${animation}.webp?v=${SPRITE_ASSET_VERSION}`;
}

function preloadSprite(animation: AssistantAnimation) {
  const cached = spriteDecodeCache.get(animation);
  if (cached) {
    return cached;
  }

  const image = new window.Image();
  image.src = getSpriteUrl(animation);
  spriteImageCache.set(animation, image);

  const decoded = image.decode().catch(() => undefined);
  spriteDecodeCache.set(animation, decoded);
  return decoded;
}

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
  const [displayed, setDisplayed] = useState({
    animation,
    playbackKey,
    motion,
    position,
  });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const config = ASSISTANT_ANIMATIONS[displayed.animation];
  const motionClass =
    displayed.motion === "none"
      ? ""
      : styles[
          `motion${displayed.motion[0].toUpperCase()}${displayed.motion.slice(1)}`
        ];
  const activePlaybackKey = animation === displayed.animation
    ? playbackKey
    : displayed.playbackKey;

  useEffect(() => {
    for (const name of Object.keys(ASSISTANT_ANIMATIONS) as AssistantAnimation[]) {
      void preloadSprite(name);
    }
  }, []);

  useEffect(() => {
    if (animation === displayed.animation) {
      return;
    }

    let cancelled = false;
    void preloadSprite(animation).then(() => {
      if (!cancelled) {
        setDisplayed({ animation, playbackKey, motion, position });
      }
    });

    return () => {
      cancelled = true;
    };
  }, [animation, displayed, motion, playbackKey, position]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const image = spriteImageCache.get(displayed.animation);
    if (!canvas || !image) {
      return;
    }

    const size = 192;
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(size * pixelRatio);
    canvas.height = Math.round(size * pixelRatio);

    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }

    const sourceWidth = image.naturalWidth / config.frames;
    const sourceHeight = image.naturalHeight;
    const startedAt = performance.now();
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let animationFrame = 0;

    const draw = (now: number) => {
      const elapsed = now - startedAt;
      let progress = Math.min(elapsed / config.duration, 1);

      if (config.loop) {
        if (displayed.animation === "idle_smile") {
          const phase = (elapsed % (config.duration * 2)) / config.duration;
          progress = phase <= 1 ? phase : 2 - phase;
        } else {
          progress = (elapsed % config.duration) / config.duration;
        }
      }

      const frame = Math.min(
        config.frames - 1,
        Math.round(progress * (config.frames - 1)),
      );
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(
        image,
        frame * sourceWidth,
        0,
        sourceWidth,
        sourceHeight,
        0,
        0,
        canvas.width,
        canvas.height,
      );

      if (!reduceMotion && (config.loop || elapsed < config.duration)) {
        animationFrame = window.requestAnimationFrame(draw);
      }
    };

    draw(startedAt);
    return () => window.cancelAnimationFrame(animationFrame);
  }, [activePlaybackKey, config, displayed.animation]);

  return (
    <span
      className={`${styles.characterTrack} ${
        displayed.position === "left" ? styles.characterLeft : ""
      } ${motionClass || ""}`.trim()}
    >
      <button
        type="button"
        className={styles.characterButton}
        onClick={onClick}
        aria-label="Люкс — виртуальный помощник. Нажмите для реакции"
      >
        <canvas
          ref={canvasRef}
          className={styles.sprite}
          aria-hidden="true"
        />
      </button>
    </span>
  );
}
