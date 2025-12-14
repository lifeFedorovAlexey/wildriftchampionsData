// ui/src/components/styled/PageWrapper.styled.js
import styled from "styled-components";
import { Card, CardInner, Container } from "./primitives";
import { COLORS } from "./tokens";

export const PwShell = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  padding-bottom: 12px;
`;

export const PwContainer = Container;

export const PwTop = styled.div`
  padding-top: 8px;
`;

export const PwFilters = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 10px 0 12px;
  align-items: center;
`;

export const PwContent = styled.div`
  flex: 1;
`;

export const PwState = styled.div`
  font-size: 13px;
  opacity: 0.85;
`;

export const PwError = styled.div`
  font-size: 13px;
  padding: 8px 10px;
  border-radius: 10px;
  background: ${COLORS.dangerBg};
  border: 1px solid ${COLORS.dangerBorder};
  margin-bottom: 10px;
`;

export const PwCard = Card;
export const PwCardInner = CardInner;
