export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function normalizeRu(str) {
  return str ? str.trim().toLowerCase() : "";
}
