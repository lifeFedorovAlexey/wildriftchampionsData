"use client";

import { eventDateLabel, trendTimeDomain } from "./trend-events-layout.js";

export const getChartAutoWidthContainerStyle = (height) => ({
  width: "100%",
  height,
  minWidth: 0,
});

export const trendChartBlockContainerStyle = {
  display: "flex",
  minWidth: 0,
  flexDirection: "column",
  gap: 8,
  marginBottom: 10,
};

export const trendChartCardStyle = {
  minWidth: 0,
  borderRadius: 12,
  background: "rgba(15,23,42,0.95)",
  padding: 8,
};

export const trendChartCardTitleStyle = {
  fontSize: 13,
  opacity: 0.85,
  padding: "4px 4px 8px",
};

export const COMMON_X_AXIS_PROPS = {
  dataKey: "ts",
  type: "number",
  scale: "time",
  tickFormatter: eventDateLabel,
  tick: { fill: "#9ba3b4", fontSize: 10 },
  tickMargin: 6,
  axisLine: { stroke: "#2a3240" },
  height: 26,
  interval: "preserveStartEnd",
};

export const trendXAxisProps = (days) => ({ ...COMMON_X_AXIS_PROPS, domain: trendTimeDomain(days) });

export const COMMON_Y_TICK = {
  fill: "#9ba3b4",
  fontSize: 10,
};

export const commonTooltipProps = {
  contentStyle: {
    background: "#111623",
    border: "1px solid #242b3a",
    borderRadius: 8,
    fontSize: 12,
  },
  labelStyle: {
    color: "#ffffff",
    marginBottom: 4,
  },
};

// общий форматтер процентов для всех графиков
export const formatPercent = (v) => {
  const num = Number(v);
  if (!Number.isFinite(num)) return "—";
  return `${num.toFixed(2)}%`;
};
