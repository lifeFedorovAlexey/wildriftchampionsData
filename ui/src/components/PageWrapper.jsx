import MenuReturn from "./MenuReturn.jsx";
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
        {loading && <LoadingRing label={loadingText} logoText="L" />}

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
