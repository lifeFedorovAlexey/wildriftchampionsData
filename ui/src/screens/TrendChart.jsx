// ui/src/screens/TrendScreen.jsx
import PageWrapper from "../components/PageWrapper.jsx";

export default function TrendChart({ onBack }) {
  const filters = (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 6,
        justifyContent: "center",
      }}
    ></div>
  );

  return (
    <PageWrapper onBack={onBack} filters={filters}>
      {/* тут вместо заглушки подключишь настоящий график */}
      <div
        style={{
          borderRadius: 12,
          background: "rgba(15,23,42,0.9)",
          padding: 8,
        }}
      >
        {/* <KayleTrendChartChart /> или как ты назовёшь реальный график */}
        <div
          style={{
            fontSize: 13,
            opacity: 0.8,
            padding: 12,
            textAlign: "center",
          }}
        >
          Здесь будет график тренда.
        </div>
      </div>
    </PageWrapper>
  );
}
