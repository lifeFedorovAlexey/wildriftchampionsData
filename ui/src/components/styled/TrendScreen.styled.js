// ui/src/components/styled/TrendScreen.styled.js
import styled from "styled-components";
import { PillButton } from "./primitives";
import { BREAKPOINTS, mqMin } from "./tokens";

export const TrSearchRow = styled.div`
  display: flex;
  justify-content: center;
  width: 100%;
`;

export const TrRangeRow = styled.div`
  display: flex;
  justify-content: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 6px;
`;

export const TrRangeBtn = styled.button`
  box-sizing: border-box;
  padding: 4px 8px;
  font-size: 11px;
  border-radius: 999px;
  min-width: 70px; /* чтобы не было совсем коротких */
  height: 28px; /* чтобы совпало по высоте */

  appearance: none;
  -webkit-appearance: none;

  cursor: pointer;
  transition: all 0.12s ease-out;

  border: 1px solid
    ${({ $active }) =>
      $active ? "rgba(59,130,246,0.95)" : "rgba(75,85,99,0.9)"};
  background: ${({ $active }) =>
    $active ? "rgba(37,99,235,0.25)" : "rgba(15,23,42,0.95)"};
  color: ${({ $active }) => ($active ? "#e5e7eb" : "#9ca3af")};

  display: inline-flex;
  align-items: center;
  justify-content: center;
  user-select: none;
  font-weight: 600;

  &:focus {
    outline: none;
  }
`;

export const TrHint = styled.div`
  font-size: 13px;
  opacity: 0.8;
  text-align: center;
  padding-top: 6px;
  padding-bottom: 6px;
`;

export const TrTableWrap = styled.div`
  border-radius: 12px;
  background: rgba(15, 23, 42, 0.9);
  padding: 6px;
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

export const TrTableHead = styled.div`
  display: grid;
  grid-template-columns: 86px repeat(3, 1fr);
  padding: 4px 6px 6px;
  font-size: 11px;
  opacity: 0.8;
  border-bottom: 1px solid rgba(31, 41, 55, 1);

  ${mqMin(BREAKPOINTS.desktop)} {
    grid-template-columns: 110px repeat(3, 1fr);
    font-size: 12px;
  }
`;

export const TrTableRow = styled.div`
  display: grid;
  grid-template-columns: 86px repeat(3, 1fr);
  padding: 6px 6px;
  font-size: 12px;

  ${mqMin(BREAKPOINTS.desktop)} {
    grid-template-columns: 110px repeat(3, 1fr);
    font-size: 13px;
  }
`;

export const TrRight = styled.div`
  text-align: right;
`;

export const TrDateCell = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
`;

export const TrDateSub = styled.span`
  font-size: 10px;
  opacity: 0.6;
`;

export const TrMetricCell = styled.div`
  text-align: right;
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
`;

export const TrMetricMain = styled.span`
  font-size: 13px;
  color: #e5e7eb;

  ${mqMin(BREAKPOINTS.desktop)} {
    font-size: 14px;
  }
`;

export const TrMetricDelta = styled.span`
  font-size: 10px;
`;
