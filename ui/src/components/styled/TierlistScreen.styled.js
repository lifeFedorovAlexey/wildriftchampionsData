// ui/src/components/styled/TierlistScreen.styled.js
import styled from "styled-components";
import { BREAKPOINTS, mqMin } from "./tokens";

export function tierColor(tier) {
  switch (tier) {
    case "S+":
      return "#f97316";
    case "S":
      return "#fb923c";
    case "A":
      return "#22c55e";
    case "B":
      return "#eab308";
    case "C":
      return "#9ca3af";
    case "D":
    default:
      return "#6b7280";
  }
}

export const TlWrap = styled.div`
  width: 100%;
`;

export const TlHeader = styled.div`
  margin-bottom: 10px;
  padding: 4px 6px 8px;
  border-bottom: 1px solid rgba(31, 41, 55, 1);
  font-size: 12px;
  opacity: 0.9;

  ${mqMin(BREAKPOINTS.desktop)} {
    font-size: 14px;
  }
`;

export const TlTitle = styled.div`
  margin-bottom: 2px;
  font-size: 13px;
  font-weight: 600;
  padding: 10px;

  ${mqMin(BREAKPOINTS.desktop)} {
    font-size: 18px;
  }
`;

export const TlSubtitle = styled.div`
  opacity: 0.8;
  padding: 10px;

  ${mqMin(BREAKPOINTS.desktop)} {
    font-size: 14px;
  }
`;

export const TlTierRow = styled.div`
  display: flex;
  flex-direction: row;
  gap: 4px;
  margin-bottom: 10px;
  align-items: flex-start;
  padding: 10px;

  ${mqMin(BREAKPOINTS.desktop)} {
    gap: 10px;
    padding: 14px 12px;
    margin-bottom: 14px;
  }
`;

export const TlTierBadge = styled.div`
  min-width: 52px;
  padding: 6px 8px;
  border-radius: 10px;
  background: rgba(15, 23, 42, 0.96);
  font-weight: 700;
  font-size: 14px;
  text-align: center;

  ${mqMin(BREAKPOINTS.desktop)} {
    min-width: 76px;
    font-size: 18px;
    padding: 10px 10px;
    border-radius: 12px;
  }
`;

export const TlTierChamps = styled.div`
  flex: 1;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;

  ${mqMin(BREAKPOINTS.desktop)} {
    gap: 12px;
  }
`;

export const TlChampCard = styled.div`
  width: 80px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 4px;
  border-radius: 10px;
  background: rgba(15, 23, 42, 0.9);
  border: 1px solid rgba(30, 64, 175, 0.4);

  ${mqMin(BREAKPOINTS.desktop)} {
    width: 112px;
    gap: 6px;
    padding: 8px;
    border-radius: 12px;
  }
`;

export const TlChampIconWrap = styled.div`
  width: 56px;
  height: 56px;
  border-radius: 8px;
  overflow: hidden;
  background: rgba(15, 23, 42, 0.95);
  border: 1px solid rgba(51, 65, 85, 0.95);

  ${mqMin(BREAKPOINTS.desktop)} {
    width: 78px;
    height: 78px;
    border-radius: 10px;
  }
`;

export const TlChampIcon = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
`;

export const TlChampName = styled.div`
  font-size: 10px;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  width: 100%;

  ${mqMin(BREAKPOINTS.desktop)} {
    font-size: 13px;
  }
`;

export const TlChampWr = styled.div`
  font-size: 9px;
  opacity: 0.75;
  text-align: center;

  ${mqMin(BREAKPOINTS.desktop)} {
    font-size: 12px;
  }
`;
