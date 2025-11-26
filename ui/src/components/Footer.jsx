import React from "react";

export default function Footer() {
  return (
    <footer
      style={{
        marginTop: 20,
        padding: "12px",
        borderTop: "1px solid rgba(255,255,255,0.05)",
        background: "rgba(0,0,0,0.15)",
        backdropFilter: "blur(6px)",
        fontSize: 12,
        lineHeight: 1.55,
        color: "rgba(180,186,197,0.85)",
      }}
    >
      {/* Контейнер */}
      <div style={{ maxWidth: 900, margin: "0 auto", textAlign: "center" }}>
        {/* Источники */}
        <div style={{ marginBottom: 6 }}>
          В проекте использованы открытые материалы и данные с{" "}
          <a
            href="https://lolm.qq.com"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: "#7aa7ff",
              textDecoration: "none",
            }}
          >
            lolm.qq.com
          </a>{" "}
          и{" "}
          <a
            href="https://wildrift.leagueoflegends.com"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: "#7aa7ff",
              textDecoration: "none",
            }}
          >
            wildrift.leagueoflegends.com
          </a>
          .
        </div>

        {/* Дисклеймер */}
        <div style={{ marginBottom: 6, opacity: 0.9 }}>
          Все товарные знаки и игровые материалы принадлежат их законным
          правообладателям. Проект создан на некоммерческой основе и не
          аффилирован с Riot Games или Tencent.
        </div>

        {/* Контакт */}
        <div style={{ opacity: 0.9 }}>
          По вопросам, связанным с использованием материалов, вы можете
          направить официальное обращение через Telegram:{" "}
          <a
            href="https://t.me/FEDOROV_ALEXEY_TG"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: "#a98aff",
              textDecoration: "none",
              fontWeight: 500,
            }}
          >
            {"@FEDOROV_ALEXEY_TG".toLocaleLowerCase()}
          </a>
          .
        </div>
      </div>
    </footer>
  );
}
