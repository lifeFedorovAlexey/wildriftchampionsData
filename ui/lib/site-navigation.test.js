import test from "node:test";
import assert from "node:assert/strict";

import { filterSiteNavigation } from "./site-navigation.js";

const items = [
  { label: "Гайды", href: "/guides" },
  { label: "Квизы", href: "/quizzes" },
  { label: "Поддержать", href: "/support" },
];

test("quiz navigation is hidden from unauthenticated visitors", () => {
  assert.deepEqual(
    filterSiteNavigation(items, { authenticated: false }).map((item) => item.href),
    ["/guides", "/support"],
  );
});

test("quiz navigation is visible to authenticated users", () => {
  assert.deepEqual(
    filterSiteNavigation(items, { authenticated: true }).map((item) => item.href),
    ["/guides", "/quizzes", "/support"],
  );
});
