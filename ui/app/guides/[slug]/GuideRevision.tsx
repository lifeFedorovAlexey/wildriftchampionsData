import Image from "next/image";
import data from "./approved-guide-data.json";
import base from "./page.module.css";
import s from "./revision.module.css";

type Icon = { name: string; icon: number };
type Tip = { label: string; text: string };
type Match = { name: string; icon: number; headline: string; win: number | null; tips: string[] };
type Level = { level: number; key: string; src?: string | null; title?: string; icon?: number };
type Approved = {
  reviewedPatch: string;
  heroTip: string;
  itemLabels?: string[];
  itemNote?: string;
  matchupNote?: string;
  items: Icon[][]; itemTip: string;
  runes: (Icon & { tip: string })[]; runeStats: string[];
  runeAlternative: string; spells: Icon[];
  levels: { key: string; icon: number }[];
  spikes: Tip[]; plan: Tip[];
  groups: { title: string; cards: Match[] }[];
};
type Collection = { sprite: string; evidenceDate: string; roles: Partial<Record<string, Approved>> };
type ApprovedEntry = { page: Approved; sprite: string; evidenceDate: string; sample: boolean };
const collections: Record<string, Collection> = data;
export function hasApprovedGuide(slug: string) {
  return Object.hasOwn(collections, slug);
}

const tips = ["Дистанция", "Когда бить", "Чего не делать"];
const percent = new Intl.NumberFormat("ru-RU", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

export function getApprovedGuide(slug: string, lane: string): ApprovedEntry | null {
  const set = collections[slug];
  const page = set?.roles[lane];
  if (!set || !page) return null;
  return { page, sprite: set.sprite, evidenceDate: set.evidenceDate, sample: page.groups.some((g) => g.cards.some((c) => c.win !== null)) };
}

function Art({ sprite, icon }: { sprite: string; icon: number }) {
  return <span aria-hidden="true" className={s.art} style={{
    backgroundImage: `url("${sprite}")`,
    backgroundPosition: `${-48 * (icon % 10)}px ${-48 * Math.floor(icon / 10)}px`,
  }} />;
}

function Tiles({ list, sprite }: { list: Icon[]; sprite: string }) {
  return (
    <ul className={s.tiles}>
      {list.map((x) => <li key={x.name}><Art sprite={sprite} icon={x.icon} /><span>{x.name}</span></li>)}
    </ul>
  );
}

export function GuideLevels({ levels, sprite }: { levels: Level[]; sprite?: string }) {
  return (
    <ol className={s.levels} aria-label="Порядок прокачки с 1 по 15 уровень">
      {levels.map((entry) => (
        <li key={entry.level} className={entry.key === "R" ? s.ultimate : undefined}
            aria-label={`${entry.level} уровень: ${entry.title || entry.key}`}>
          <span>{entry.level}</span>
          {sprite && typeof entry.icon === "number" ? <Art sprite={sprite} icon={entry.icon} /> :
            entry.src ? <Image src={entry.src} alt="" width={36} height={36} unoptimized /> : null}
          <b>{entry.key}</b>
        </li>
      ))}
    </ol>
  );
}

function Decisions({ rows }: { rows: Tip[] }) {
  return (
    <div className={s.decisions}>
      {rows.map((row) => <article key={row.label}><h3>{row.label}</h3><p>{row.text}</p></article>)}
    </div>
  );
}

export function ApprovedGuide({ guide: { page, sprite, evidenceDate, sample } }: { guide: ApprovedEntry }) {
  const date = new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long", timeZone: "UTC" }).format(new Date(evidenceDate));
  return (
    <div className={s.content} data-guide-edition="role">
      <div className={s.duo}>
        <section className={base.panel}>
          <h2 className={base.panelTitle}>Предметы</h2>
          <p className={s.note}>{page.itemNote || "Рекомендации. Иконки не задают порядок покупки."}</p>
          {page.items.map((list, i) => <div key={i}><h3 className={s.sub}>{(page.itemLabels || ["Старт и обувь", "Основа", "По ситуации"])[i]}</h3><Tiles sprite={sprite} list={list} /></div>)}
          <p className={s.tip}>{page.itemTip}</p>
        </section>
        <section className={base.panel}>
          <h2 className={base.panelTitle}>Руны и заклинания</h2>
          {page.runeStats.length ? <p className={s.note}>{page.runeStats.join(" · ")}</p> : null}
          <ul className={s.runes}>{page.runes.map((rune) => (
            <li key={rune.name}><Art sprite={sprite} icon={rune.icon} /><div><strong>{rune.name}</strong><small>{rune.tip}</small></div></li>
          ))}</ul>
          <p className={s.tip}>{page.runeAlternative}</p>
          <h3 className={s.sub}>Заклинания</h3>
          <Tiles sprite={sprite} list={page.spells} />
        </section>
      </div>
      <section id="matchups" className={`${base.panel} ${s.matchups}`}>
        <h2 className={base.panelTitle}>Матчапы</h2>
        <p className={s.note}>{page.matchupNote || (sample
          ? `Проценты — победы в этом матчапе, Китай · Алмаз+ · ${date}. Сложность сравнивается с обычным результатом, а не с порогом 50%.`
          : "Подбор по механикам, не по винрейту.")}</p>
        {page.groups.map((group) => <div key={group.title} className={s.group}>
          <h3 className={s.sub}>{group.title}</h3>
          <div className={s.matchGrid}>
            {group.cards.map((card) => <article key={card.name} className={s.card}>
              <div className={s.cardHead}>
                <Art sprite={sprite} icon={card.icon} />
                <div><h4>{card.name}</h4><small>{card.headline}</small></div>
                {sample ? <span className={s.badge}>{card.win === null ? "По механикам" : `${percent.format(card.win)}%`}</span> : null}
              </div>
              <dl>{card.tips.map((line, i) => <div key={tips[i]}><dt>{tips[i]}</dt><dd>{line}</dd></div>)}</dl>
            </article>)}
          </div>
        </div>)}
      </section>
      <section className={base.panel}><h2 className={base.panelTitle}>Прокачка</h2>
        <GuideLevels levels={page.levels.map((entry, i) => ({ ...entry, level: i + 1 }))} sprite={sprite} />
        <Decisions rows={page.spikes} />
      </section>
      <section className={base.panel}><h2 className={base.panelTitle}>План игры</h2><Decisions rows={page.plan} /></section>
    </div>
  );
}
