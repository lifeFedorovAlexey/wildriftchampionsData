// ui/src/components/RoleIcon.jsx
import React from "react";
import { ROLE_SPRITE_URL, ROLE_ICON_SPRITE } from "../screens/constants";

export function RoleIcon({ laneKey, size = 24 }) {
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
