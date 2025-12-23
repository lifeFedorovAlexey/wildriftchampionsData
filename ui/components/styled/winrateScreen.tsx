import styled from "styled-components";
import Image from "next/image";
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
  margin-top: 16px;

  ${mqMin(BREAKPOINTS.desktop)} {
    font-size: 14px;
  }

  &:nth-child(even) {
    background: linear-gradient(
      90deg,
      rgba(255, 255, 255, 0.02),
      rgba(255, 255, 255, 0.04)
    );
  }
`;

export const WrRow = styled(WrGrid)`
  font-size: 12px;
  border-bottom: 1px solid rgba(15, 23, 42, 1);

  /* зебра */
  &:nth-child(even) {
    background: rgba(255, 255, 255, 0.03);
  }

  &:hover {
    background: rgba(255, 255, 255, 0.06);
  }

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

  /* FIX: чтобы стрелка не съезжала вниз на мобилках */
  display: inline-flex;
  align-items: center;
  justify-content: flex-end;
  gap: 4px;
  white-space: nowrap;
  line-height: 1;

  .wr-sortArrow {
    display: inline-block;
    width: 14px;
    text-align: center;
    opacity: 0.9;
    flex: 0 0 14px;
  }
`;

export const WrIndex = styled.div`
  opacity: 0.8;
`;

export const WrAvatar = styled.div`
  width: 32px;
  height: 32px;

  display: flex;
  align-items: center;
  justify-content: center;

  flex-shrink: 0;
`;

export const WrAvatarImg = styled(Image)`
  width: 32px;
  height: 32px;
  display: block;
  border-radius: 8px;
  object-fit: cover;
`;

export const WrEmpty = styled.div`
  padding: 10px 8px;
  font-size: 13px;
  opacity: 0.7;
`;
