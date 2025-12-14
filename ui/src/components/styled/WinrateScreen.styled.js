// ui/src/components/styled/WinrateScreen.styled.js
import styled from "styled-components";
import { BREAKPOINTS, mqMin } from "./tokens";

export const WrWrap = styled.div`
  width: 100%;
  margin: 0 auto;
`;

export const WrGrid = styled.div`
  display: grid;
  grid-template-columns: 36px 2fr 0.7fr 0.9fr 0.9fr 0.9fr;
  column-gap: 4px;
  padding: 6px 8px;
  align-items: center;

  ${mqMin(BREAKPOINTS.desktop)} {
    grid-template-columns: 54px 2.6fr 0.9fr 1fr 1fr 1fr;
    column-gap: 10px;
    padding: 10px 12px;
  }
`;

export const WrHeader = styled(WrGrid)`
  font-size: 11px;
  opacity: 0.8;
  border-bottom: 1px solid rgba(31, 41, 55, 1);
  position: sticky;
  top: 0;
  background: rgba(15, 23, 42, 0.96);
  backdrop-filter: blur(8px);
  z-index: 1;

  ${mqMin(BREAKPOINTS.desktop)} {
    font-size: 14px;
  }
`;

export const WrRow = styled(WrGrid)`
  font-size: 12px;
  border-bottom: 1px solid rgba(15, 23, 42, 1);

  ${mqMin(BREAKPOINTS.desktop)} {
    font-size: 14px;
  }
`;

export const WrHeroCell = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;

  ${mqMin(BREAKPOINTS.desktop)} {
    gap: 10px;
  }
`;

export const WrHeroName = styled.span`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const WrRight = styled.div`
  text-align: right;
`;

export const WrSortable = styled.div`
  text-align: right;
  cursor: pointer;
  user-select: none;
`;

export const WrIndex = styled.div`
  opacity: 0.8;
`;

export const WrAvatar = styled.div`
  width: 28px;
  height: 32px;
  border-radius: 4px;
  overflow: hidden;
  background: rgba(15, 23, 42, 0.85);
  flex-shrink: 0;

  ${mqMin(BREAKPOINTS.desktop)} {
    width: 40px;
    height: 46px;
    border-radius: 8px;
  }
`;

export const WrAvatarImg = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
`;

export const WrEmpty = styled.div`
  padding: 10px 8px;
  font-size: 13px;
  opacity: 0.7;
`;
