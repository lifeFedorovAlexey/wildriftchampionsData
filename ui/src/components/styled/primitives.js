// ui/src/components/styled/primitives.js
import styled from "styled-components";
import { BREAKPOINTS, COLORS, LAYOUT, mqMin } from "./tokens";

export const Container = styled.div`
  width: 100%;
  max-width: ${LAYOUT.pageMaxMobile}px;
  margin: 0 auto;
  padding: 0 ${LAYOUT.padMobile}px;
  box-sizing: border-box;

  ${mqMin(BREAKPOINTS.desktop)} {
    max-width: ${LAYOUT.pageMax}px;
    padding: 0 ${LAYOUT.padDesktop}px;
  }
`;

export const Card = styled.div`
  border-radius: 14px;
  background: ${COLORS.cardBg};
  border: 1px solid ${COLORS.cardBorder};
  overflow: hidden;
`;

export const CardInner = styled.div`
  padding: 10px;
  box-sizing: border-box;

  ${mqMin(BREAKPOINTS.desktop)} {
    padding: 14px;
  }
`;

export const MutedText = styled.div`
  font-size: ${(p) => (p.$size ? `${p.$size}px` : "13px")};
  opacity: ${(p) => (p.$opacity != null ? p.$opacity : 0.85)};
`;

export const SectionTitle = styled.div`
  font-size: 14px;
  font-weight: 700;
  margin-bottom: 6px;
  padding: ${(p) => (p.$pad ? "5px" : "0")};
`;

export const PillButton = styled.button`
  padding: 4px 10px;
  font-size: 12px;
  border-radius: 999px;
  cursor: pointer;
  transition: all 0.12s ease-out;
  user-select: none;
  min-width: ${(p) => (p.$minWidth ? `${p.$minWidth}px` : "44px")};

  border: 1px solid ${(p) => (p.$active ? p.$activeBorder : COLORS.pillBorder)};
  background: ${(p) => (p.$active ? p.$activeBg : COLORS.pillBg)};
  color: ${(p) => (p.$active ? COLORS.text : COLORS.muted)};
`;
