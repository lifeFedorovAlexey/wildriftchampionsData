"use client";

import styled from "styled-components";

export function tierColor(tier: any) {
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

export function tierBg(tier: any) {
  switch (tier) {
    case "S+":
      return "#b78aff";
    case "S":
      return "#f19797";
    case "A":
      return "#f0c58b";
    case "B":
      return "#f3f59a";
    case "C":
      return "#b7ff90";
    case "D":
    default:
      return "#a8c3ff";
  }
}

export const TlWrap = styled.div`
  width: 100%;
`;

export const TlHeader = styled.div`
  margin-bottom: 12px;
  padding: 10px 0px 12px;
  border-bottom: 1px solid rgba(31, 41, 55, 1);
`;

export const TlTitle = styled.div`
  font-size: 14px;
  font-weight: 700;
  margin-bottom: 6px;

  @media (min-width: 900px) {
    font-size: 18px;
  }
`;

export const TlSubtitle = styled.div`
  font-size: 12px;
  opacity: 0.8;

  @media (min-width: 900px) {
    font-size: 14px;
  }
`;

export const TlEmpty = styled.div`
  padding: 10px 8px;
  font-size: 13px;
  opacity: 0.7;
`;

export const TlTierRow = styled.div`
  display: grid;
  grid-template-columns: 56px 1fr;
  gap: 8px;
  align-items: stretch;
  margin-bottom: 8px;

  @media (min-width: 900px) {
    grid-template-columns: 72px 1fr;
    gap: 10px;
    margin-bottom: 10px;
  }
`;

/** Левая цветная “плашка” как в TierMaker */
interface TlTierBadgeProps {
  $bg?: string;
}

export const TlTierBadge = styled.div<TlTierBadgeProps>`
  display: flex;
  align-items: center;
  justify-content: center;

  font-weight: 800;
  letter-spacing: 0.5px;

  border-radius: 10px;
  background: ${(p) => p.$bg || "rgba(148,163,184,0.25)"};
  color: rgba(15, 23, 42, 0.95);

  /* чтобы выглядело как “лейбл” слева */
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.08);

  font-size: 14px;

  @media (min-width: 900px) {
    font-size: 16px;
  }
`;

/** Правая полоса */
export const TlTierChamps = styled.div`
  border-radius: 12px;
  background: rgba(15, 23, 42, 0.55);
  border: 1px solid rgba(31, 41, 55, 0.9);
  padding: 6px;

  display: flex;
  flex-wrap: wrap;
  gap: 6px;

  @media (min-width: 900px) {
    padding: 8px;
    gap: 8px;
  }
`;

/** Одна иконка чемпа (без текста) */
export const TlChampCard = styled.div`
  width: 44px;
  height: 44px;
  border-radius: 8px;
  overflow: hidden;
  flex: 0 0 auto;

  background: rgba(2, 6, 23, 0.55);
  border: 1px solid rgba(51, 65, 85, 0.95);

  transform: translateZ(0);
  transition: transform 0.12s ease-out, border-color 0.12s ease-out;

  &:hover {
    transform: scale(1.06);
    border-color: rgba(96, 165, 250, 0.9);
  }

  @media (min-width: 900px) {
    width: 54px;
    height: 54px;
    border-radius: 10px;
  }
`;

export const TlChampIcon = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
`;

/* ---------- NEW: веса ---------- */

export const TlWeightsBox = styled.div`
  margin-top: 12px;
  margin-bottom: 12px;
  padding: 12px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.03);
  display: grid;
  gap: 10px;
`;

export const TlWeightsTitle = styled.div`
  font-weight: 800;
  opacity: 0.9;
`;

export const TlWeightSliderWrap = styled.div`
  display: grid;
  gap: 6px;
`;

export const TlWeightSliderTop = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 10px;
`;

export const TlWeightSliderLabel = styled.div`
  opacity: 0.9;
`;

export const TlWeightSliderValue = styled.div`
  font-weight: 800;
`;

export const TlRange = styled.input`
  width: 100%;
`;

/* ---------- NEW: модалка расчёта ---------- */

export const TlModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);

  display: flex;
  align-items: center;
  justify-content: center;

  padding: 16px;
  z-index: 9999;
`;

export const TlModalCard = styled.div`
  width: min(640px, 100%);
  background: #0b1220;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.35);
`;

export const TlModalTop = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
`;

export const TlModalIconWrap = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 12px;
  overflow: hidden;
`;

export const TlModalIcon = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

export const TlModalMeta = styled.div`
  flex: 1;
`;

export const TlModalName = styled.div`
  font-weight: 800;
  font-size: 18px;
`;

export const TlModalResult = styled.div`
  opacity: 0.8;
  margin-top: 2px;
`;

export const TlModalCloseBtn = styled.button`
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: white;
  border-radius: 10px;
  padding: 8px 10px;
  cursor: pointer;
`;

/* ---------- NEW: строки расчёта ---------- */

export const TlCalcList = styled.div`
  margin-top: 14px;
  display: grid;
  gap: 10px;
`;

export const TlCalcRow = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 10px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.03);
`;

export const TlCalcLabel = styled.div`
  opacity: 0.9;
`;

export const TlCalcRight = styled.div`
  display: flex;
  gap: 10px;
  align-items: baseline;
`;

export const TlCalcMuted = styled.div`
  opacity: 0.85;
`;

export const TlCalcStrong = styled.span`
  font-weight: 800;
`;

export const TlCalcSumRow = styled.div`
  margin-top: 6px;
  padding-top: 10px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  justify-content: space-between;
  font-weight: 800;
`;

/* заглушки оставляем, чтобы твои импорты не ломались */
export const TlChampIconWrap = styled.div``;
export const TlChampName = styled.div``;
export const TlChampWr = styled.div``;
