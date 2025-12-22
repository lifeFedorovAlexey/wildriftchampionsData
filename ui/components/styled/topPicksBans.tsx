// ui/src/components/styled/TopPicksBansScreen.styled.js
import styled from "styled-components";
import { PillButton, SectionTitle } from "./primitives";

export const TpHeader = styled.div`
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  flex-wrap: wrap;
  padding: 10px 5px;
`;

export const TpHeaderText = styled.div`
  font-size: 13px;
  opacity: 0.85;
`;

export const TpRow = styled.div`
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 6px;
  flex-wrap: wrap;
  padding: 5px;
`;

export const TpLimitBtn = styled(PillButton)`
  min-width: 44px;
`;

export const TpRankRangeBtn = styled(PillButton)`
  min-width: 70px;
`;

interface TpSectionProps {
  $mb?: number;
  $pad?: boolean;
}

export const TpSection = styled.div<TpSectionProps>`
  margin-bottom: ${(p) => (p.$mb != null ? `${p.$mb}px` : "12px")};
`;

export const TpSectionTitle = styled(SectionTitle)<{ $pad?: boolean }>`
  padding: ${(p) => (p.$pad ? "5px" : "0")};
`;

export const TpCardWrap = styled.div`
  margin-bottom: 8px;
`;

export const TpEmpty = styled.div`
  font-size: 12px;
  opacity: 0.8;
`;

interface TpCardProps {
  $type: "pick" | "ban";
}

export const TpCard = styled.div<TpCardProps>`
  position: relative;
  border-radius: 12px;
  padding: 10px;
  display: flex;
  align-items: center;
  gap: 10px;
  box-shadow: 0 10px 25px rgba(15, 23, 42, 0.9);
  overflow: hidden;
  cursor: pointer;

  border: 1px solid
    ${(p) =>
      p.$type === "pick"
        ? "rgba(96, 165, 250, 0.9)"
        : "rgba(248, 113, 113, 0.9)"};

  background: ${(p) =>
    p.$type === "pick"
      ? "linear-gradient(135deg, rgba(15,23,42,0.95), rgba(30,64,175,0.85))"
      : "linear-gradient(135deg, rgba(15,23,42,0.95), rgba(185,28,28,0.85))"};
`;

export const TpCardIndex = styled.div`
  font-size: 18px;
  font-weight: 700;
  opacity: 0.9;
  min-width: 24px;
  text-align: center;
`;

export const TpAvatar = styled.div`
  width: 40px;
  height: 44px;
  border-radius: 8px;
  overflow: hidden;
  background: rgba(15, 23, 42, 0.9);
  border: 1px solid rgba(51, 65, 85, 0.9);
  flex-shrink: 0;
  position: relative;
`;

export const TpAvatarImg = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
`;

export const TpCardInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
  flex: 1;
`;

export const TpCardName = styled.div`
  font-size: 14px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const TpCardSub = styled.div`
  font-size: 11px;
  opacity: 0.8;
`;

export const TpCardValue = styled.div`
  font-size: 18px;
  font-weight: 700;
  text-align: right;
  min-width: 70px;
`;

export const TpModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 999;
`;

export const TpModal = styled.div`
  background: rgba(15, 23, 42, 0.98);
  border-radius: 12px;
  border: 1px solid rgba(148, 163, 184, 0.7);
  max-width: 520px;
  width: 90%;
  max-height: 80vh;
  padding: 14px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6);
  font-size: 12px;
  color: #e5e7eb;
  overflow-y: auto;
`;

export const TpModalTop = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
  gap: 8px;
`;

export const TpCloseBtn = styled.button`
  border: none;
  background: transparent;
  color: #9ca3af;
  font-size: 16px;
  cursor: pointer;
`;

export const TpLaneRow = styled.div`
  margin-bottom: 4px;
`;

interface TpPillButtonProps {
  $active?: boolean;
  $variant?: "rank" | "other";
}

export const TpPillButton = styled.button<TpPillButtonProps>`
  padding: 4px 10px;
  font-size: 12px;
  border-radius: 999px;
  border: 1px solid
    ${({ $active, $variant }) =>
      $variant === "rank"
        ? $active
          ? "rgba(52,211,153,0.9)"
          : "rgba(75,85,99,0.9)"
        : $active
        ? "rgba(59,130,246,0.9)"
        : "rgba(75,85,99,0.9)"};

  background: ${({ $active, $variant }) =>
    $variant === "rank"
      ? $active
        ? "rgba(16,185,129,0.2)"
        : "rgba(15,23,42,0.95)"
      : $active
      ? "rgba(37,99,235,0.25)"
      : "rgba(15,23,42,0.95)"};

  color: ${({ $active }) => ($active ? "#e5e7eb" : "#9ca3af")};
  cursor: pointer;
  transition: all 0.12s ease-out;
  min-width: 70px;
`;
