"use client";

import type { IconType } from "react-icons";
import {
  FaCirclePlay,
  FaCommentDots,
  FaTelegram,
  FaTwitch,
  FaVideo,
  FaVk,
} from "react-icons/fa6";

const items: Array<{
  key: string;
  href: string;
  icon: IconType;
  label: string;
}> = [
  { key: "vk", href: "https://vk.com/inqnews", icon: FaVk, label: "VK" },
  {
    key: "vkvideo",
    href: "https://vkvideo.ru/@inqnews",
    icon: FaVideo,
    label: "VK Видео",
  },
  {
    key: "rutube",
    href: "https://rutube.ru/channel/23486231/",
    icon: FaCirclePlay,
    label: "Rutube",
  },
  {
    key: "max",
    href: "https://max.ru/inqnews",
    icon: FaCommentDots,
    label: "MAX",
  },
  {
    key: "tg",
    href: "https://t.me/inqnews",
    icon: FaTelegram,
    label: "Telegram",
  },
  {
    key: "twitch",
    href: "https://www.twitch.tv/inq_wr",
    icon: FaTwitch,
    label: "Twitch",
  },
];

export default function StreamerSocials({ color = "rgba(255,255,255,0.92)" }) {
  return (
    <div
      style={{
        marginTop: 12,
        display: "grid",
        gap: 8,
        justifyItems: "center",
        textAlign: "center",
      }}
    >
      <div
        style={{
          fontSize: 14,
          fontWeight: 700,
          lineHeight: 1.4,
          opacity: 0.9,
        }}
      >
        Подписывайся — лучший TG-канал, MAX и все соцсети от INQ 🔥
      </div>

      <div
        style={{
          fontSize: 12,
          opacity: 0.65,
          lineHeight: 1.4,
        }}
      >
        Новости, стримы, видео, анонсы и эксклюзивный контент
      </div>

      <div
        style={{
          marginTop: 4,
          display: "flex",
          justifyContent: "center",
          gap: 10,
          flexWrap: "wrap",
        }}
      >
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <a
              key={item.key}
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              title={item.label}
              aria-label={item.label}
              style={{
                width: 44,
                height: 44,
                borderRadius: 14,
                display: "grid",
                placeItems: "center",
                border: "1px solid rgba(255,255,255,0.16)",
                background: "rgba(255,255,255,0.05)",
                color,
                textDecoration: "none",
              }}
            >
              <Icon size={22} aria-hidden="true" focusable="false" />
            </a>
          );
        })}
      </div>
    </div>
  );
}
