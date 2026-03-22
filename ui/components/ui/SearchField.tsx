"use client";

import styles from "./SearchField.module.css";

type SearchFieldProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  ariaLabel?: string;
  type?: "search" | "text";
  onFocus?: React.FocusEventHandler<HTMLInputElement>;
  className?: string;
  autoComplete?: string;
};

export default function SearchField({
  value,
  onChange,
  placeholder,
  ariaLabel,
  type = "search",
  onFocus,
  className = "",
  autoComplete = "off",
}: SearchFieldProps) {
  const composedClassName = [styles.field, className].filter(Boolean).join(" ");

  return (
    <input
      className={composedClassName}
      type={type}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      aria-label={ariaLabel}
      onFocus={onFocus}
      autoComplete={autoComplete}
    />
  );
}
