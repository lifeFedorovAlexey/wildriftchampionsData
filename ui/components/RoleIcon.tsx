"use client";

import React from "react";
import { ROLE_ICON_SPRITE, ROLE_SPRITE_URL } from "./screensConstants";

export function RoleIcon({
  laneKey,
  size = 24,
}: {
  laneKey: keyof typeof ROLE_ICON_SPRITE;
  size?: number;
}) {
  const cfg = ROLE_ICON_SPRITE[laneKey];
  if (!cfg) return null;

  return (
    <div
      style={{
        width: size,
        height: size,
        backgroundImage: `url(${ROLE_SPRITE_URL})`,
        backgroundRepeat: "no-repeat",
        backgroundPosition: `${cfg.x}px ${cfg.y}px`,
        backgroundSize: "205px 28px",
        flexShrink: 0,
      }}
    />
  );
}

export default RoleIcon;
