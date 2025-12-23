"use client";

import { useEffect, useState } from "react";
import styled from "styled-components";

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: grid;
  place-items: center;
  background: transparent;
`;

const Wrap = styled.div`
  width: 220px;
  height: 220px;
  position: relative;
`;

// Маска + эффекты остаются, но теперь внутри будет <video>
const MaskedMedia = styled.div`
  position: absolute;
  inset: 0;
  border-radius: 50%;
  overflow: hidden;

  mix-blend-mode: screen;
  filter: saturate(1.2) brightness(1.1);

  -webkit-mask-image: radial-gradient(
    circle,
    rgba(0, 0, 0, 1) 55%,
    rgba(0, 0, 0, 0.8) 62%,
    rgba(0, 0, 0, 0) 70%
  );
  mask-image: radial-gradient(
    circle,
    rgba(0, 0, 0, 1) 55%,
    rgba(0, 0, 0, 0.8) 62%,
    rgba(0, 0, 0, 0) 70%
  );

  video {
    width: 100%;
    height: 100%;
    display: block;
    object-fit: cover;
  }
`;

const Caption = styled.div`
  margin-top: 24px;
  font-weight: 800;
  letter-spacing: 0.2em;
  font-size: 12px;
  opacity: 0.88;
  text-transform: uppercase;
  text-align: center;
`;

export default function LoadingRing({
  label = "Загружаю статистику…",
}: {
  label?: string;
}) {
  const [mediaReady, setMediaReady] = useState(false);

  useEffect(() => {
    // Прогреваем видео, чтобы Caption не мигал, и чтобы кольцо стартовало сразу
    const v = document.createElement("video");
    v.muted = true;
    v.playsInline = true;
    v.preload = "auto";
    v.src = "/wildrift-spin.webm";
    const onReady = () => setMediaReady(true);

    v.addEventListener("canplaythrough", onReady, { once: true });
    v.load();

    return () => {
      v.removeEventListener("canplaythrough", onReady);
    };
  }, []);

  return (
    <Overlay>
      <div style={{ display: "grid", placeItems: "center" }}>
        <Wrap>
          <MaskedMedia>
            <video
              autoPlay
              loop
              muted
              playsInline
              preload="auto"
              aria-hidden="true"
              onCanPlayThrough={() => setMediaReady(true)}
            >
              <source src="/wildrift-spin.webm" type="video/webm" />
              <source src="/wildrift-spin.mp4" type="video/mp4" />
            </video>
          </MaskedMedia>
        </Wrap>

        {mediaReady ? <Caption>{label}</Caption> : null}
      </div>
    </Overlay>
  );
}
