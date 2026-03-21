"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    ym?: ((...args: unknown[]) => void) & {
      a?: unknown[][];
      l?: number;
    };
  }
}

const METRIKA_ID = 106001120;
const METRIKA_SRC = `https://mc.yandex.ru/metrika/tag.js?id=${METRIKA_ID}`;

function injectMetrika() {
  if (typeof window === "undefined") return;
  if (document.querySelector(`script[src="${METRIKA_SRC}"]`)) return;

  window.ym =
    window.ym ||
    function (...args: unknown[]) {
      (window.ym!.a = window.ym!.a || []).push(args);
    };
  window.ym.l = Number(new Date());

  const script = document.createElement("script");
  script.async = true;
  script.src = METRIKA_SRC;
  document.head.appendChild(script);

  window.ym(METRIKA_ID, "init", {
    ssr: true,
    webvisor: true,
    clickmap: true,
    ecommerce: "dataLayer",
    accurateTrackBounce: true,
    trackLinks: true,
  });
}

export default function YandexMetrikaInit() {
  useEffect(() => {
    let done = false;

    const run = () => {
      if (done) return;
      done = true;
      cleanup();
      injectMetrika();
    };

    const onFirstInteraction = () => run();

    const idleId =
      typeof window.requestIdleCallback === "function"
        ? window.requestIdleCallback(run, { timeout: 3500 })
        : window.setTimeout(run, 2500);

    window.addEventListener("pointerdown", onFirstInteraction, { once: true });
    window.addEventListener("keydown", onFirstInteraction, { once: true });
    window.addEventListener("scroll", onFirstInteraction, {
      once: true,
      passive: true,
    });

    function cleanup() {
      window.removeEventListener("pointerdown", onFirstInteraction);
      window.removeEventListener("keydown", onFirstInteraction);
      window.removeEventListener("scroll", onFirstInteraction);

      if (typeof idleId === "number") {
        window.clearTimeout(idleId);
      } else if (typeof window.cancelIdleCallback === "function") {
        window.cancelIdleCallback(idleId);
      }
    }

    return cleanup;
  }, []);

  return null;
}
