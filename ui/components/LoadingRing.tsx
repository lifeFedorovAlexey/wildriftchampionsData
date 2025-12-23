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

const MaskedGif = styled.div`
  position: absolute;
  inset: 0;
  border-radius: 50%;

  background-size: cover;
  background-position: center;

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
  const [imageReady, setImageReady] = useState(false);

  useEffect(() => {
    const img = new Image();
    img.src = "/wildrift-spin.gif";
    img.onload = () => setImageReady(true);
  }, []);

  return (
    <Overlay>
      <div style={{ display: "grid", placeItems: "center" }}>
        <Wrap>
          <MaskedGif />
        </Wrap>

        {imageReady ? <Caption>{label}</Caption> : null}
      </div>
    </Overlay>
  );
}
