// ui/src/components/LanguageSelector.jsx
import React, { useState } from "react";

const LANGS = [
  { code: "ru_ru", label: "Русский", flag: "🇷🇺" },
  { code: "en_us", label: "English (🇺🇸)", flag: "🇺🇸" },
  { code: "en_gb", label: "English (🇬🇧)", flag: "🇬🇧" },
  { code: "fr_fr", label: "Français", flag: "🇫🇷" },
  { code: "de_de", label: "Deutsch", flag: "🇩🇪" },
  { code: "es_es", label: "Español (🇪🇸)", flag: "🇪🇸" },
  { code: "it_it", label: "Italiano", flag: "🇮🇹" },
  { code: "pl_pl", label: "Polski", flag: "🇵🇱" },
  { code: "tr_tr", label: "Türkçe", flag: "🇹🇷" },
  { code: "pt_br", label: "Português", flag: "🇧🇷" },
  { code: "ms_my", label: "Malaysian", flag: "🇲🇾" },
  { code: "ja_jp", label: "日本語", flag: "🇯🇵" },
  { code: "ko_kr", label: "한국어", flag: "🇰🇷" },
  { code: "zh_tw", label: "繁體中文", flag: "🇹🇼" },
  { code: "th_th", label: "ภาษาไทย", flag: "🇹🇭" },
  { code: "vi_vn", label: "Tiếng Việt", flag: "🇻🇳" },
  { code: "es_mx", label: "Español (🇲🇽)", flag: "🇲🇽" },
  { code: "en_sg", label: "English (🇸🇬)", flag: "🇸🇬" },
  { code: "ar_ae", label: "العربية", flag: "🇦🇪" },
];

export function LanguageSelector({ value, onChange }) {
  const [open, setOpen] = useState(false);

  const current =
    LANGS.find((l) => l.code === value) ||
    LANGS.find((l) => l.code === "ru_ru") ||
    LANGS[0];

  const toggle = () => setOpen((o) => !o);

  const select = (code) => {
    onChange(code);
    setOpen(false);
  };

  return (
    <>
      {/* Кнопка в хедере */}
      <button
        type="button"
        onClick={toggle}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "6px 10px",
          borderRadius: 999,
          border: "none",
          cursor: "pointer",
          background: "#141824",
          color: "inherit",
          fontSize: 14,
          minWidth: 40,
        }}
      >
        <span style={{ fontSize: 18 }}>{current.flag}</span>
      </button>

      {/* Фуллскрин модалка выбора языка */}
      {open && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 999,
            background: "rgba(0,0,0,0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: 360,
              maxHeight: "80vh",
              background: "#020617",
              borderRadius: 16,
              boxShadow: "0 16px 40px rgba(0,0,0,0.7)",
              padding: "12px 12px 10px",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                marginBottom: 8,
              }}
            ></div>

            <div
              style={{
                flex: 1,
                overflowY: "auto",
                marginTop: 4,
                paddingRight: 4,
              }}
            >
              {LANGS.map((lang) => {
                const isActive = lang.code === current.code;
                return (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => select(lang.code)}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 10,
                      padding: "8px 10px",
                      borderRadius: 10,
                      border: "none",
                      cursor: "pointer",
                      background: isActive ? "#1f2937" : "transparent",
                      color: "inherit",
                      marginBottom: 4,
                    }}
                  >
                    <span
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                      }}
                    >
                      <span style={{ fontSize: 20 }}>{lang.label}</span>
                    </span>
                    {isActive && (
                      <span
                        style={{
                          fontSize: 11,
                          opacity: 0.8,
                        }}
                      >
                        ✓
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => setOpen(false)}
              style={{
                marginTop: 8,
                padding: "8px 10px",
                borderRadius: 999,
                border: "none",
                cursor: "pointer",
                background: "#111827",
                color: "inherit",
                fontSize: 13,
              }}
            >
              Закрыть
            </button>
          </div>
        </div>
      )}
    </>
  );
}
