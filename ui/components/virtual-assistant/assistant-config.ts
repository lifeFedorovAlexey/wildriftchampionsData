export const ASSISTANT_STORAGE = {
  introduced: "wr-assistant-introduced-v1",
  minimized: "wr-assistant-minimized-v1",
} as const;

export const ASSISTANT_ANIMATIONS = {
  flash_entrance: { frames: 13, duration: 812, loop: false },
  wave: { frames: 13, duration: 812, loop: false },
  idle_smile: { frames: 13, duration: 1450, loop: true },
  smile: { frames: 13, duration: 812, loop: false },
  thoughtful: { frames: 13, duration: 812, loop: false },
  frown: { frames: 13, duration: 812, loop: false },
  hurt: { frames: 13, duration: 812, loop: false },
  victory: { frames: 13, duration: 812, loop: false },
  laugh: { frames: 13, duration: 812, loop: false },
  angry: { frames: 13, duration: 812, loop: false },
  air_kiss: { frames: 13, duration: 812, loop: false },
  attack: { frames: 13, duration: 812, loop: false },
  cast_spell: { frames: 13, duration: 812, loop: false },
  jump_back: { frames: 13, duration: 812, loop: false },
  jump_forward: { frames: 13, duration: 812, loop: false },
  battle_stance: { frames: 17, duration: 1062, loop: false },
  weapon_spin: { frames: 17, duration: 1062, loop: false },
  // Spritesheets contain 24 cells (12288 / 512), while the source MP4 has
  // 25 frames because its final frame duplicates the loop boundary.
  walk_left: { frames: 24, duration: 1500, loop: false },
  walk_right: { frames: 24, duration: 1500, loop: false },
} as const;

export type AssistantAnimation = keyof typeof ASSISTANT_ANIMATIONS;

export const IDLE_REACTION_SEQUENCES: ReadonlyArray<
  ReadonlyArray<AssistantAnimation>
> = [
  ["smile"],
  ["thoughtful"],
  ["wave"],
  ["laugh"],
  ["air_kiss"],
];

export const INTRO_MESSAGE =
  "Привет! Я Люкс. Прольём свет на текущую мету!";

export const CLOSE_MESSAGES: ReadonlyArray<string> = [
  "Стой! У меня слишком мало скинов. Поднимайся к баннеру D&D Shop и купи мне новый!",
  "Сворачиваешь меня? Тогда сначала загляни в D&D Shop наверху и выбери мне новый скин!",
  "Не отпущу с пустыми руками! Купи мне скин в D&D Shop — у Люкс должно быть больше образов.",
  "Моей коллекции не хватает сияния. Баннер D&D Shop уже наверху — пора купить мне скин!",
  "Хочешь меня выключить? Хорошо, но сначала выбери мне новый скин в D&D Shop!",
  "Слишком мало скинов для Леди Сияния! Поднимайся к D&D Shop и срочно исправляй это.",
  "Я согласна отдохнуть только после подарка. Новый скин ждёт меня в D&D Shop наверху!",
  "Закрываешь помощницу — пополняй её гардероб. Купи мне скин в D&D Shop!",
];

export const CLICK_REACTIONS: ReadonlyArray<{
  animation: AssistantAnimation;
  message: string;
}> = [
  { animation: "wave", message: "Что проверим дальше?" },
  { animation: "laugh", message: "Вот это настрой!" },
  { animation: "air_kiss", message: "Пусть следующая игра будет яркой!" },
  { animation: "angry", message: "Эй! Даже у света есть предел терпения." },
  { animation: "cast_spell", message: "Немного магии — и цифры уже понятнее." },
  { animation: "weapon_spin", message: "Всегда готова к следующему анализу!" },
  { animation: "attack", message: "Цель вижу. Проверим её показатели?" },
  { animation: "battle_stance", message: "К серьёзной статистике нужен серьёзный подход." },
];
