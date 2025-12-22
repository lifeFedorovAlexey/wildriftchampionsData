import MenuReturn from "./MenuReturn.jsx";
import { MenuHeader } from "./MenuHeader.jsx";
import {
  PwShell,
  PwContainer,
  PwTop,
  PwFilters,
  PwContent,
  PwError,
  PwCard,
  PwCardInner,
} from "./styled/PageWrapper.styled.js";
import LoadingRing from "./LoadingRing.jsx";

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
    <PwShell>
      {/* верхняя панель */}
      <PwContainer as={PwTop}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            width: "100%",
            paddingTop: "14px",
            borderRadius: "14px",
            background: "rgba(15, 23, 42, 0.85)",
            border: "1px solid rgba(31, 41, 55, 0.9)",
            marginBottom: "8px",
          }}
        >
          {/* левая часть */}
          <div style={{ flex: "0 0 auto" }}>
            <MenuReturn onBack={onBack} />
          </div>

          {/* центр */}

          <MenuHeader />

          {/* правая заглушка для баланса */}
          <div style={{ flex: "0 0 auto", width: 40 }} />
        </div>
      </PwContainer>

      {/* фильтры */}
      {filters && (
        <PwContainer>
          <PwFilters>{filters}</PwFilters>
        </PwContainer>
      )}

      {/* контент */}
      <PwContainer as={PwContent}>
        {loading && <LoadingRing label={loadingText} logoText="L" />}

        {!loading && error && <PwError>{error}</PwError>}

        {!loading &&
          !error &&
          (wrapInCard ? (
            <PwCard>
              <PwCardInner>{children}</PwCardInner>
            </PwCard>
          ) : (
            children
          ))}
      </PwContainer>
    </PwShell>
  );
}
