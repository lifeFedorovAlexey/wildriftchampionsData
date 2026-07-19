import {
  FaArrowTrendUp,
  FaChartColumn,
  FaComments,
  FaCrosshairs,
  FaCrown,
  FaHeart,
  FaNewspaper,
  FaRankingStar,
  FaWandMagicSparkles,
} from "react-icons/fa6";

type IconProps = {
  size?: number;
};

const iconProps = {
  "aria-hidden": true,
  focusable: false,
  style: { display: "block" },
} as const;

export function IconWinrate({ size = 22 }: IconProps) {
  return <FaChartColumn size={size} {...iconProps} />;
}

export function IconTierInq({ size = 22 }: IconProps) {
  return <FaCrown size={size} {...iconProps} />;
}

export function IconTierlist({ size = 22 }: IconProps) {
  return <FaRankingStar size={size} {...iconProps} />;
}

export function IconPicksBans({ size = 22 }: IconProps) {
  return <FaCrosshairs size={size} {...iconProps} />;
}

export function IconTrends({ size = 22 }: IconProps) {
  return <FaArrowTrendUp size={size} {...iconProps} />;
}

export function IconSkins({ size = 24 }: IconProps = {}) {
  return <FaWandMagicSparkles size={size} {...iconProps} />;
}

export function IconSupport({ size = 22 }: IconProps) {
  return <FaHeart size={size} {...iconProps} />;
}

export function IconChat({ size = 22 }: IconProps) {
  return <FaComments size={size} {...iconProps} />;
}

export function IconNews({ size = 22 }: IconProps) {
  return <FaNewspaper size={size} {...iconProps} />;
}
