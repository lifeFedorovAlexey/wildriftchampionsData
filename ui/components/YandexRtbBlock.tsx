"use client";

import { useEffect } from "react";

const BLOCK_ID = "R-A-20498954-1";
const CONTAINER_ID = "yandex_rtb_R-A-20498954-1";

declare global {
  interface Window {
    yaContextCb?: Array<() => void>;
    Ya?: {
      Context?: {
        AdvManager?: {
          render: (options: { blockId: string; renderTo: string }) => void;
        };
      };
    };
  }
}

export default function YandexRtbBlock() {
  useEffect(() => {
    if (process.env.NODE_ENV === "development") return;

    const queue = window.yaContextCb || (window.yaContextCb = []);
    queue.push(() => {
      if (!document.getElementById(CONTAINER_ID)) return;
      window.Ya?.Context?.AdvManager?.render({
        blockId: BLOCK_ID,
        renderTo: CONTAINER_ID,
      });
    });
  }, []);

  if (process.env.NODE_ENV === "development") return null;

  return <div id={CONTAINER_ID} aria-label="Рекламный блок Яндекса" />;
}
