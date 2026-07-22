const AUTHENTICATED_ONLY_HREFS = new Set(["/quizzes"]);

export function filterSiteNavigation(items, { authenticated = false } = {}) {
  if (authenticated) return items;
  return items.filter((item) => !AUTHENTICATED_ONLY_HREFS.has(item.href));
}
