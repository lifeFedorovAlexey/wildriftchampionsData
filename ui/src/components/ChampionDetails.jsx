// ui/src/components/ChampionDetails.jsx
import React, { useState } from "react";

export function ChampionDetails({ champ, language }) {
  if (!champ) return null;

  const name =
    champ.name?.[language] ||
    champ.name?.ru_ru ||
    champ.name?.en_us ||
    champ.slug;

  const img =
    champ.baseImgUrl || champ.portrait || champ.icon || "/fallback.png";

  const difficultyLabel =
    champ.difficulty?.[language] ||
    champ.difficulty?.ru_ru ||
    champ.difficulty?.en_us ||
    null;

  const roles = Array.isArray(champ.roles) ? champ.roles : [];
  const abilities = Array.isArray(champ.abilities) ? champ.abilities : [];

  const getAbilityKey = (ability) =>
    ability.slot || ability.key || ability.id || "";

  const [selectedAbilityKey, setSelectedAbilityKey] = useState(
    abilities.length ? getAbilityKey(abilities[0]) : null
  );

  const selectedAbility =
    abilities.find((a) => getAbilityKey(a) === selectedAbilityKey) ||
    abilities[0] ||
    null;

  const resolveRoleLabel = (r) => {
    const key = typeof r === "string" ? r : r.key;
    if (typeof r === "object") {
      return (
        r.name?.[language] ||
        r.name?.ru_ru ||
        r.name?.en_us ||
        key?.toUpperCase()
      );
    }
    return key?.toUpperCase();
  };

  const resolveAbilityName = (ability) => {
    const slot = ability.slot || ability.key || "";
    return (
      ability.name?.[language] ||
      ability.name?.ru_ru ||
      ability.name?.en_us ||
      ability.name ||
      slot
    );
  };

  const resolveAbilityDescription = (ability) =>
    ability.description?.[language] ||
    ability.description?.ru_ru ||
    ability.description?.en_us ||
    ability.description ||
    "";

  const resolveAbilityVideo = (ability) =>
    ability.videoUrl || ability.video || null;

  return (
    <div
      style={{
        marginTop: 8,
        paddingBottom: 16,
        paddingInline: 8,
      }}
    >
      {/* всё содержимое центрируем и ограничиваем по ширине */}
      <div
        style={{
          maxWidth: 480,
          margin: "0 auto",
        }}
      >
        {/* верхний блок: уменьшенная картинка + имя, роли, сложность */}
        <div
          style={{
            borderRadius: 16,
            overflow: "hidden",
            background: "#020617",
            boxShadow: "0 4px 12px rgba(0,0,0,0.6)",
            marginBottom: 12,
          }}
        >
          <div
            style={{
              position: "relative",
              width: "100%",
              aspectRatio: "3 / 2",
              maxHeight: 220,
              background: "#020617",
            }}
          >
            <img
              src={img}
              alt={name}
              loading="lazy"
              decoding="async"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: "block",
                filter: "brightness(0.95)",
              }}
            />

            {/* лёгкий градиент снизу под текст */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "linear-gradient(to top, rgba(0,0,0,0.75), transparent 55%)",
              }}
            />

            {/* имя + роли + сложность */}
            <div
              style={{
                position: "absolute",
                left: 10,
                right: 10,
                bottom: 8,
              }}
            >
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  marginBottom: 4,
                }}
              >
                {name}
              </div>

              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 6,
                  fontSize: 11,
                }}
              >
                {roles.map((r, idx) => (
                  <span
                    key={`${typeof r === "string" ? r : r.key}_${idx}`}
                    style={{
                      padding: "2px 8px",
                      borderRadius: 999,
                      background: "rgba(15,23,42,0.9)",
                      border: "1px solid rgba(148,163,255,0.8)",
                    }}
                  >
                    {resolveRoleLabel(r)}
                  </span>
                ))}

                {difficultyLabel && (
                  <span
                    style={{
                      padding: "2px 8px",
                      borderRadius: 999,
                      background: "rgba(15,23,42,0.9)",
                      border: "1px solid rgba(248,250,252,0.5)",
                      opacity: 0.85,
                    }}
                  >
                    {difficultyLabel}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* блок способностей */}
        <div>
          {!!abilities.length && (
            <>
              {/* ряд иконок спелов (без текста, только иконка + слот) */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "row",
                  gap: 8,
                  overflowX: "auto",
                  paddingBottom: 4,
                  marginBottom: 10,
                  WebkitOverflowScrolling: "touch",
                }}
              >
                {abilities.map((ability) => {
                  const key = getAbilityKey(ability);
                  const icon = ability.iconUrl || ability.icon || null;
                  const slot = ability.slot || ability.key || "";

                  const isActive = key === selectedAbilityKey;

                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setSelectedAbilityKey(key)}
                      style={{
                        border: "none",
                        cursor: "pointer",
                        padding: 1,
                        margin: 2,
                        borderRadius: 16,
                        width: 64,
                        height: 64,
                        background: isActive ? "#111827" : "#020617",
                        boxShadow: isActive
                          ? "0 0 0 2px rgba(129,140,248,0.9)"
                          : "0 0 0 1px rgba(15,23,42,1)",
                        position: "relative",
                        flexShrink: 0,
                      }}
                    >
                      {icon && (
                        <img
                          src={icon}
                          alt={slot}
                          loading="lazy"
                          decoding="async"
                          style={{
                            width: "100%",
                            height: "100%",
                            borderRadius: 12,
                            objectFit: "cover",
                            display: "block",
                          }}
                        />
                      )}

                      {slot && (
                        <span
                          style={{
                            position: "absolute",
                            left: 6,
                            bottom: 4,
                            fontSize: 10,
                            padding: "1px 4px",
                            borderRadius: 999,
                            background: "rgba(15,23,42,0.9)",
                          }}
                        >
                          {slot}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* детальная зона выбранного спела: название + текст + видео */}
              {selectedAbility && (
                <div
                  style={{
                    borderRadius: 12,
                    background: "#111827",
                    padding: 10,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      marginBottom: 6,
                    }}
                  >
                    {selectedAbility.slot && (
                      <span
                        style={{
                          fontSize: 11,
                          padding: "2px 6px",
                          borderRadius: 999,
                          background: "#1f2937",
                          opacity: 0.85,
                        }}
                      >
                        {selectedAbility.slot}
                      </span>
                    )}
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                      }}
                    >
                      {resolveAbilityName(selectedAbility)}
                    </span>
                  </div>

                  {resolveAbilityDescription(selectedAbility) && (
                    <div
                      style={{
                        fontSize: 12,
                        opacity: 0.9,
                        lineHeight: 1.3,
                        marginBottom: 8,
                      }}
                    >
                      {resolveAbilityDescription(selectedAbility)}
                    </div>
                  )}

                  {/* фиксированное место под видео, чтобы верстка не прыгала */}
                  {(() => {
                    const videoUrl = resolveAbilityVideo(selectedAbility);
                    return (
                      <div
                        style={{
                          borderRadius: 10,
                          overflow: "hidden",
                          background: "#020617",
                          height: 200, // постоянная высота
                        }}
                      >
                        {videoUrl && (
                          <video
                            src={videoUrl}
                            muted
                            loop
                            playsInline
                            autoPlay
                            style={{
                              width: "100%",
                              height: "100%",
                              display: "block",
                              objectFit: "cover",
                            }}
                          />
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
