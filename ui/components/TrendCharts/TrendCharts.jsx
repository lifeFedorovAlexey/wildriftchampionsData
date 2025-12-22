"use client";

import React, { useEffect, useRef, useState } from "react";

import {
  getChartAutoWidthContainerStyle,
  trendChartBlockContainerStyle,
  trendChartCardStyle,
  trendChartCardTitleStyle,
} from "./TrendCharts.styles.js";

import { WinRateChart } from "./WinRateChart.jsx";
import { PickRateChart } from "./PickRateChart.jsx";
import { BanRateChart } from "./BanRateChart.jsx";

export function pluralizeDays(n) {
  const num = Math.abs(n) % 100;
  const last = num % 10;

  if (num > 10 && num < 20) return "дней";
  if (last === 1) return "день";
  if (last >= 2 && last <= 4) return "дня";

  return "дней";
}

function ChartAutoWidth({ children, height = 200, style, className }) {
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
      className={className}
      style={{ ...getChartAutoWidthContainerStyle(height), ...style }}
    >
      {width > 0 && children(width, height)}
    </div>
  );
}

function TrendChartCard({ title, daysCount, subtitle, children }) {
  return (
    <div style={trendChartCardStyle}>
      <div style={trendChartCardTitleStyle}>
        {title}
        {subtitle ?? ` за последние ${daysCount} ${pluralizeDays(daysCount)}`}
      </div>

      <ChartAutoWidth height={200}>{children}</ChartAutoWidth>
    </div>
  );
}

export function TrendChartBlock({ days }) {
  if (!days || !days.length) return null;

  return (
    <div style={trendChartBlockContainerStyle}>
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
