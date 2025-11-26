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

export const WinRateChart = React.memo(function WinRateChart({
  days,
  width,
  height,
}) {
  return (
    <AreaChart
      width={width}
      height={height}
      data={days}
      margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
    >
      <defs>
        <linearGradient id="trendWin" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4ade80" stopOpacity={0.6} />
          <stop offset="100%" stopColor="#4ade80" stopOpacity={0.05} />
        </linearGradient>
      </defs>

      <CartesianGrid stroke="#1f2933" strokeDasharray="3 3" />

      <XAxis {...COMMON_X_AXIS_PROPS} />

      <YAxis
        tickFormatter={formatPercent}
        tick={COMMON_Y_TICK}
        axisLine={{ stroke: "#2a3240" }}
        width={56}
        domain={["dataMin - 1", "dataMax + 1"]}
      />

      <Tooltip
        {...commonTooltipProps}
        formatter={(value) => formatPercent(Number(value))}
        labelFormatter={(_, payload) => payload?.[0]?.payload?.fullDate ?? ""}
      />

      <Area
        type="monotone"
        dataKey="winRate"
        name="Победы"
        stroke="#4ade80"
        strokeWidth={2}
        fill="url(#trendWin)"
        activeDot={{ r: 4 }}
      />
    </AreaChart>
  );
});
