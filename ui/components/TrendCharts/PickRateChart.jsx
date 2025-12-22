"use client";
import React from "react";
import {
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import {
  COMMON_X_AXIS_PROPS,
  COMMON_Y_TICK,
  commonTooltipProps,
  formatPercent,
} from "./TrendCharts.styles.js";

export const PickRateChart = React.memo(function PickRateChart({
  days,
  width,
  height,
}) {
  const hasTrend =
    Array.isArray(days) && days.some((d) => Number.isFinite(d?.pickTrend));

  return (
    <AreaChart
      width={width}
      height={height}
      data={days}
      margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
    >
      <defs>
        <linearGradient id="trendPick" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#60a5fa" stopOpacity={0.5} />
          <stop offset="100%" stopColor="#60a5fa" stopOpacity={0.03} />
        </linearGradient>
      </defs>

      <CartesianGrid stroke="#1f2933" strokeDasharray="3 3" />

      <XAxis {...COMMON_X_AXIS_PROPS} />

      <YAxis
        tickFormatter={formatPercent}
        tick={COMMON_Y_TICK}
        axisLine={{ stroke: "#2a3240" }}
        width={56}
        domain={["dataMin - 0.5", "dataMax + 0.5"]}
      />

      <Tooltip
        {...commonTooltipProps}
        formatter={(value) => formatPercent(Number(value))}
        labelFormatter={(_, payload) => payload?.[0]?.payload?.fullDate ?? ""}
      />

      {/* Факт */}
      <Area
        type="monotone"
        dataKey="pickRate"
        name="Пики"
        stroke="#60a5fa"
        strokeWidth={2}
        fill="url(#trendPick)"
        activeDot={{ r: 3 }}
      />

      {/* Тренд (пунктир поверх, без заливки) */}
      {hasTrend && (
        <Area
          type="linear"
          dataKey="pickTrend"
          name="Тренд"
          stroke="#60a5fa"
          strokeWidth={2}
          strokeDasharray="6 6"
          fill="transparent"
          activeDot={false}
          dot={false}
        />
      )}
    </AreaChart>
  );
});
