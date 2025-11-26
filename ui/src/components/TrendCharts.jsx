// ui/src/components/TrendCharts.jsx
import React, { useEffect, useRef, useState } from "react";
import {
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

const formatPercent = (v) => `${v.toFixed(2)}%`;

/**
 * Контейнер, который:
 *  - занимает всю доступную ширину
 *  - имеет фиксированную высоту
 *  - измеряет реальную ширину через ResizeObserver
 *  - рендерит чарт только когда width > 0
 *
 * children — это функция (render-prop): (width, height) => <AreaChart ... />
 */
function ChartAutoWidth({ children, height = 200 }) {
  const ref = useRef(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const update = () => {
      const w = el.clientWidth || 0;
      setWidth(w);
    };

    update();

    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", update);
      return () => window.removeEventListener("resize", update);
    }

    const ro = new ResizeObserver(() => {
      update();
    });

    ro.observe(el);

    return () => {
      ro.disconnect();
    };
  }, []);

  return (
    <div
      ref={ref}
      style={{
        width: "100%",
        height,
        minWidth: 0,
      }}
    >
      {width > 0 && children(width, height)}
    </div>
  );
}

function TrendChartCard({ title, daysCount, children }) {
  return (
    <div
      style={{
        borderRadius: 12,
        background: "rgba(15,23,42,0.95)",
        padding: 8,
      }}
    >
      <div
        style={{
          fontSize: 13,
          opacity: 0.85,
          padding: "4px 4px 8px",
        }}
      >
        {title} за последние {daysCount} дней
      </div>

      <ChartAutoWidth height={200}>{children}</ChartAutoWidth>
    </div>
  );
}

// ---------- отдельные графики ----------

function WinRateChart({ days, width, height }) {
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

      <XAxis
        dataKey="date"
        tick={{ fill: "#9ba3b4", fontSize: 10 }}
        tickMargin={6}
        axisLine={{ stroke: "#2a3240" }}
        height={26}
        interval="preserveStartEnd"
      />

      <YAxis
        tickFormatter={formatPercent}
        tick={{ fill: "#9ba3b4", fontSize: 10 }}
        axisLine={{ stroke: "#2a3240" }}
        width={56}
        domain={["dataMin - 1", "dataMax + 1"]}
      />

      <Tooltip
        formatter={(value) => formatPercent(Number(value))}
        labelFormatter={(_, payload) => payload?.[0]?.payload?.fullDate ?? ""}
        contentStyle={{
          background: "#111623",
          border: "1px solid #242b3a",
          borderRadius: 8,
          fontSize: 12,
        }}
        labelStyle={{ color: "#ffffff", marginBottom: 4 }}
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
}

function PickRateChart({ days, width, height }) {
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

      <XAxis
        dataKey="date"
        tick={{ fill: "#9ba3b4", fontSize: 10 }}
        tickMargin={6}
        axisLine={{ stroke: "#2a3240" }}
        height={26}
        interval="preserveStartEnd"
      />

      <YAxis
        tickFormatter={formatPercent}
        tick={{ fill: "#9ba3b4", fontSize: 10 }}
        axisLine={{ stroke: "#2a3240" }}
        width={56}
        domain={["dataMin - 0.5", "dataMax + 0.5"]}
      />

      <Tooltip
        formatter={(value) => formatPercent(Number(value))}
        labelFormatter={(_, payload) => payload?.[0]?.payload?.fullDate ?? ""}
        contentStyle={{
          background: "#111623",
          border: "1px solid #242b3a",
          borderRadius: 8,
          fontSize: 12,
        }}
        labelStyle={{ color: "#ffffff", marginBottom: 4 }}
      />

      <Area
        type="monotone"
        dataKey="pickRate"
        name="Пики"
        stroke="#60a5fa"
        strokeWidth={2}
        fill="url(#trendPick)"
        activeDot={{ r: 3 }}
      />
    </AreaChart>
  );
}

function BanRateChart({ days, width, height }) {
  return (
    <AreaChart
      width={width}
      height={height}
      data={days}
      margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
    >
      <defs>
        <linearGradient id="trendBan" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f97316" stopOpacity={0.5} />
          <stop offset="100%" stopColor="#f97316" stopOpacity={0.03} />
        </linearGradient>
      </defs>

      <CartesianGrid stroke="#1f2933" strokeDasharray="3 3" />

      <XAxis
        dataKey="date"
        tick={{ fill: "#9ba3b4", fontSize: 10 }}
        tickMargin={6}
        axisLine={{ stroke: "#2a3240" }}
        height={26}
        interval="preserveStartEnd"
      />

      <YAxis
        tickFormatter={formatPercent}
        tick={{ fill: "#9ba3b4", fontSize: 10 }}
        axisLine={{ stroke: "#2a3240" }}
        width={56}
        domain={["dataMin - 0.5", "dataMax + 0.5"]}
      />

      <Tooltip
        formatter={(value) => formatPercent(Number(value))}
        labelFormatter={(_, payload) => payload?.[0]?.payload?.fullDate ?? ""}
        contentStyle={{
          background: "#111623",
          border: "1px solid #242b3a",
          borderRadius: 8,
          fontSize: 12,
        }}
        labelStyle={{ color: "#ffffff", marginBottom: 4 }}
      />

      <Area
        type="monotone"
        dataKey="banRate"
        name="Баны"
        stroke="#f97316"
        strokeWidth={2}
        fill="url(#trendBan)"
        activeDot={{ r: 3 }}
      />
    </AreaChart>
  );
}

export function TrendChartBlock({ days }) {
  if (!days || !days.length) return null;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 8,
        marginBottom: 10,
      }}
    >
      <TrendChartCard title="Динамика винрейта" daysCount={days.length}>
        {(width, height) => (
          <WinRateChart days={days} width={width} height={height} />
        )}
      </TrendChartCard>

      <TrendChartCard title="Динамика пикрейта" daysCount={days.length}>
        {(width, height) => (
          <PickRateChart days={days} width={width} height={height} />
        )}
      </TrendChartCard>

      <TrendChartCard title="Динамика банрейта" daysCount={days.length}>
        {(width, height) => (
          <BanRateChart days={days} width={width} height={height} />
        )}
      </TrendChartCard>
    </div>
  );
}

export default TrendChartBlock;
