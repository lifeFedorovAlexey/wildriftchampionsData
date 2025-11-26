// ui/src/components/PageWrapper.jsx
import MenuReturn from "./MenuReturn.jsx";

export default function PageWrapper({
  onBack,
  filters,
  children,
  loading,
  error,
  loadingText = "Загружаю статистику…",
  wrapInCard = false,
}) {
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

      {/* основной контент + универсальная обработка loading/error */}
      <div style={{ flex: 1 }}>
        {loading && (
          <div
            style={{
              fontSize: 13,
              opacity: 0.85,
            }}
          >
            {loadingText}
          </div>
        )}

        {error && !loading && (
          <div
            style={{
              fontSize: 13,
              padding: "6px 8px",
              borderRadius: 8,
              background: "#402020",
              marginBottom: 8,
            }}
          >
            {error}
          </div>
        )}

        {!loading && !error && (
          <>
            {wrapInCard ? (
              <div
                style={{
                  borderRadius: 10,
                  background: "rgba(15,23,42,0.85)",
                }}
              >
                {children}
              </div>
            ) : (
              children
            )}
          </>
        )}
      </div>
    </div>
  );
}
