"use client";

import { PillButton, PillGroup } from "./ui/PillGroup";

type RangeValue = "week" | "month" | "all";

type Props = {
  value: RangeValue;
  onChange: (v: RangeValue) => void;
};

export default function RangeFilter({ value, onChange }: Props) {
  return (
    <div style={{ marginTop: 12, marginBottom: 12, minHeight: 34 }}>
      <PillGroup>
        <PillButton active={value === "week"} onClick={() => onChange("week")}>
          Неделя
        </PillButton>

        <PillButton active={value === "month"} onClick={() => onChange("month")}>
          Месяц
        </PillButton>

        <PillButton active={value === "all"} onClick={() => onChange("all")}>
          Всё
        </PillButton>
      </PillGroup>
    </div>
  );
}
