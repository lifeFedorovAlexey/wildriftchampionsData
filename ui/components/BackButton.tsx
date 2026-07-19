"use client";

import { FaChevronLeft } from "react-icons/fa6";
import styles from "./BackButton.module.css";

type Props = {
  onClick: () => void;
  label?: string;
};

export default function BackButton({ onClick, label = "Назад" }: Props) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={styles.backBtn}
    >
      <FaChevronLeft size={18} aria-hidden="true" />
    </button>
  );
}
