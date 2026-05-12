import styles from "./TrendSparkline.module.css";

type Props = {
  values: Array<number | null>;
  color: string;
  width?: number;
  height?: number;
};

export default function TrendSparkline({
  values,
  color,
  width = 32,
  height = 12,
}: Props) {
  const points = values
    .map((value, index) => ({ value, index }))
    .filter(
      (point): point is { value: number; index: number } =>
        typeof point.value === "number" && Number.isFinite(point.value),
    );

  if (points.length < 2) {
    return (
      <span
        className={styles.sparkPlaceholder}
        style={{ width: `${width}px`, height: `${height}px` }}
        aria-hidden="true"
      />
    );
  }

  const paddingX = Math.max(2, Math.round(width * 0.06));
  const paddingY = Math.max(2, Math.round(height * 0.16));
  const minValue = Math.min(...points.map((point) => point.value));
  const maxValue = Math.max(...points.map((point) => point.value));
  const valueRange = Math.max(maxValue - minValue, 1);
  const stepX =
    values.length > 1
      ? (width - paddingX * 2) / Math.max(values.length - 1, 1)
      : 0;

  const line = points
    .map((point, pointIndex) => {
      const x = paddingX + point.index * stepX;
      const y =
        height -
        paddingY -
        ((point.value - minValue) / valueRange) * (height - paddingY * 2);

      return `${pointIndex === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");

  const lastPoint = points[points.length - 1];
  const lastX = paddingX + lastPoint.index * stepX;
  const lastY =
    height -
    paddingY -
    ((lastPoint.value - minValue) / valueRange) * (height - paddingY * 2);

  return (
    <svg
      className={styles.sparkline}
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      aria-hidden="true"
    >
      <path
        d={`M${paddingX} ${(height / 2).toFixed(2)} H${(width - paddingX).toFixed(2)}`}
        className={styles.sparkBase}
      />
      <path d={line} stroke={color} className={styles.sparkPath} />
      <circle
        cx={lastX}
        cy={lastY}
        r={Math.max(1.8, Number((width * 0.055).toFixed(2)))}
        fill={color}
        className={styles.sparkDot}
        style={{ color }}
      />
    </svg>
  );
}
