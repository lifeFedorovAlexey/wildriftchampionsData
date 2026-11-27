import scopeData from "./ranked-patch-gear-scope.json" with { type: "json" };

// Scope is derived from role-labelled recommendations on the public guide snapshot.
// It only decides where an official change is useful. No historical kit is endorsed.
const notes = Object.freeze({
  "immortal-shieldbow": ["Арбалет бессмертия", "Щит у ближнего боя вырос до 380–700. У дальнего боя нижняя граница выросла до 320, верхняя осталась 550. Смотри на свой тип атаки, а не на цифру другого класса."],
  "berserkers-greaves": ["Наголенники берсерка", "Скорость атаки упала с 35% до 30%, лечение за попадание — с 10 до 5. Не рассчитывай на прежнее лечение в длинном размене."],
  "gunmetal-greaves": ["Наголенники из орудийной стали", "Скорость атаки упала с 50% до 45%, лечение за попадание — с 12 до 5. Улучшение ботинок больше не возвращает прежнее лечение."],
  "ardent-censer": ["Пылающая кадильница", "Бонус скорости атаки снизился с 30% до 25%. Щит или лечение всё ещё запускают бонус, но не закладывай прежнее ускорение в совместный размен."],
  "harmonic-echo": ["Мелодичное эхо", "Сила умений снизилась с 40 до 25. Предмет даёт меньше силы умений; не оценивай его как раньше, если покупал прежде всего ради урона."],
  "guinsoos-rageblade": ["Клинок ярости Гинсу", "Базовая скорость атаки снизилась с 30% до 25%. Ослабла именно скорость, которую даёт покупка, а не каждое срабатывание эффектов при попадании."],
  "absolute-focus": ["Полная сосредоточенность", "Порог здоровья вырос с 65% до 70%, бонус силы атаки и силы умений снижен. После размена проверяй здоровье: при 65–70% больше нельзя рассчитывать на прежний бонус."],
});

/** @type {Record<string, Partial<Record<string, string[]>>>} */
const scopes = scopeData;

export function hasRankedGearNotes(slug) {
  return Object.hasOwn(scopes, slug);
}

/** @returns {string[][]} */
export function rankedGearNotes(slug, role, patch) {
  if (patch !== "7.3g" || !hasRankedGearNotes(slug)) return [];
  const byRole = scopes[slug];
  if (!Object.hasOwn(byRole, role)) return [];
  return (byRole[role] || []).filter(id => Object.hasOwn(notes, id)).map(id => notes[id]);
}
