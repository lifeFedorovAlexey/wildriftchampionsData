export default function MenuHeader() {
  return (
    <div
      style={{
        flex: "1 1 auto",
        display: "flex",
        justifyContent: "center",
        textAlign: "center",
        flexDirection: "column",
        marginBottom: "20px",
      }}
    >
      <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: 0.2 }}>
        Wildriftallstats.ru
      </div>

      <div
        style={{ marginTop: 8, fontSize: 13, opacity: 0.9, lineHeight: 1.5 }}
      >
        Актуальная статистика Wild Rift: винрейты, автоматические тир-листы и
        игровые тренды. Тг:{" "}
        <a
          href="https://t.me/life_wr_bot"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: "#a98aff",
            textDecoration: "none",
            fontWeight: 600,
          }}
        >
          @life_wr_bot
        </a>
      </div>
    </div>
  );
}
