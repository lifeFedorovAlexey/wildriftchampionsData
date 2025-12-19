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
      <div style={{ maxWidth: 900, margin: "0 auto", textAlign: "center" }}>
        <div style={{ marginBottom: 6 }}>
          Открытые данные:{" "}
          <a
            href="https://lolm.qq.com"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "#7aa7ff", textDecoration: "none" }}
          >
            lolm.qq.com
          </a>{" "}
          и{" "}
          <a
            href="https://wildrift.leagueoflegends.com"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "#7aa7ff", textDecoration: "none" }}
          >
            wildrift.leagueoflegends.com
          </a>
        </div>

        <div style={{ marginBottom: 6, opacity: 0.9 }}>
          Проект некоммерческий и не аффилирован с Riot Games или Tencent. Все
          права принадлежат их правообладателям.
        </div>
      </div>
    </footer>
  );
}
