// src/components/KayleTrendChart.jsx
import React, { useMemo } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";

// базовые значения из ТЗ
const BASE_STATS = {
  winRate: 55.67,
  pickRate: 8.07,
  banRate: 3.96,
};

// сколько дней рисуем (последние N дней)
const DAYS = 30;

function randomDelta(spread) {
  // случайное число в диапазоне [-spread, +spread]
  return (Math.random() * 2 - 1) * spread;
}

// генерим "рандом-прогулку" вокруг базового значения
function generateSeries(base, spread, days) {
  let current = base;
  const series = [];

  for (let i = 0; i < days; i++) {
    current += randomDelta(spread);
    series.push(Number(current.toFixed(2)));
  }

  return series;
}

function generateDailyMockData() {
  const today = new Date();
  const winRateSeries = generateSeries(BASE_STATS.winRate, 10.9, DAYS);
  const pickRateSeries = generateSeries(BASE_STATS.pickRate, 1.6, DAYS);
  const banRateSeries = generateSeries(BASE_STATS.banRate, 1.5, DAYS);

  const data = [];

  // идём от старого дня к сегодняшнему
  for (let i = DAYS - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);

    const label = d.toLocaleDateString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
    });

    const index = DAYS - 1 - i;

    data.push({
      date: d.toISOString(),
      label, // "дд.мм"
      winRate: winRateSeries[index],
      pickRate: pickRateSeries[index],
      banRate: banRateSeries[index],
    });
  }

  return data;
}

const formatPercent = (value) => `${value.toFixed(2)}%`;

export default function KayleTrendChart() {
  const data = useMemo(() => generateDailyMockData(), []);

  return (
    <div
      style={{
        width: "100%",
        height: 420,
        background: "#05070d",
        borderRadius: 16,
        padding: "20px 24px",
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
        }}
      >
        <div>
          <div
            style={{
              fontSize: 18,
              fontWeight: 600,
              color: "#ffffff",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            }}
          >
            КЕЙЛ
          </div>
          <div style={{ fontSize: 13, color: "#9ba3b4", marginTop: 4 }}>
            Заглушка: ежедневные данные за последние 30 дней, сгенерированы
            вокруг 55.67% / 8.07% / 3.96%.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: 8,
            fontSize: 12,
            color: "#9ba3b4",
            opacity: 0.8,
          }}
        >
          <span>Диапазон:</span>
          <span>последние {DAYS} дней</span>
        </div>
      </div>

      <div style={{ flex: 1, minHeight: 0 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 20, right: 24, left: 0, bottom: 10 }}
          >
            <CartesianGrid stroke="#1b222c" strokeDasharray="3 3" />
            <XAxis
              dataKey="label"
              tick={{ fill: "#9ba3b4", fontSize: 11 }}
              tickMargin={10}
              axisLine={{ stroke: "#2a3240" }}
            />
            <YAxis
              tickFormatter={formatPercent}
              tick={{ fill: "#9ba3b4", fontSize: 11 }}
              axisLine={{ stroke: "#2a3240" }}
              width={60}
            />
            <Tooltip
              formatter={(value) => formatPercent(Number(value))}
              contentStyle={{
                background: "#111623",
                border: "1px solid #242b3a",
                borderRadius: 8,
                fontSize: 12,
              }}
              labelStyle={{ color: "#ffffff", marginBottom: 4 }}
            />
            <Legend
              verticalAlign="top"
              align="right"
              iconType="circle"
              wrapperStyle={{ fontSize: 12, paddingBottom: 8 }}
            />

            {/* Победы */}
            <Line
              type="monotone"
              dataKey="winRate"
              name="Победы"
              stroke="#2ecc71"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />

            {/* Пики */}
            <Line
              type="monotone"
              dataKey="pickRate"
              name="Пики"
              stroke="#3498db"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />

            {/* Баны */}
            <Line
              type="monotone"
              dataKey="banRate"
              name="Баны"
              stroke="#e74c3c"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
