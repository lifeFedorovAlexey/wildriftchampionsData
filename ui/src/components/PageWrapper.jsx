// ui/src/components/PageWrapper.jsx
import MenuReturn from "./MenuReturn.jsx";

export default function PageWrapper({ onBack, filters, children }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        paddingBottom: 12,
      }}
    >
      {/* верхняя панель */}
      <MenuReturn onBack={onBack} />

      {/* блок фильтров (если переданы) */}
      {filters && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 8,
            marginBottom: 10,
            alignItems: "center",
          }}
        >
          {filters}
        </div>
      )}

      {/* основной контент */}
      <div style={{ flex: 1 }}>{children}</div>
    </div>
  );
}
