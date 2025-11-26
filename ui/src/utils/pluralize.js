// правильные русские окончания для слова "день"
export function pluralizeDays(n) {
  const num = Math.abs(n) % 100;
  const last = num % 10;

  if (num > 10 && num < 20) return "дней";
  if (last === 1) return "день";
  if (last >= 2 && last <= 4) return "дня";

  return "дней";
}
