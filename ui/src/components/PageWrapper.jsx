import MenuReturn from "./MenuReturn.jsx";
import {
  PwShell,
  PwContainer,
  PwTop,
  PwFilters,
  PwContent,
  PwState,
  PwError,
  PwCard,
  PwCardInner,
} from "./styled/PageWrapper.styled.js";

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
        <MenuReturn onBack={onBack} />
      </PwContainer>

      {/* фильтры */}
      {filters && (
        <PwContainer>
          <PwFilters>{filters}</PwFilters>
        </PwContainer>
      )}

      {/* контент + loading/error */}
      <PwContainer as={PwContent}>
        {loading && <PwState>{loadingText}</PwState>}

        {!loading && error && <PwError>{error}</PwError>}

        {!loading && !error && (
          <>
            {wrapInCard ? (
              <PwCard>
                <PwCardInner>{children}</PwCardInner>
              </PwCard>
            ) : (
              children
            )}
          </>
        )}
      </PwContainer>
    </PwShell>
  );
}
