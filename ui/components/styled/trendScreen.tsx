"use client";

import styled from "styled-components";

import { BREAKPOINTS, mqMin } from "./tokens";

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
