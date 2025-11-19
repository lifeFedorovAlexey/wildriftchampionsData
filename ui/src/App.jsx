import { useEffect, useState, useMemo } from "react";
import { Header } from "./components/Header";
import { RolesFilter } from "./components/RolesFilter";
import { ChampionCard } from "./components/ChampionCard";
import { ChampionDetails } from "./components/ChampionDetails";

function App() {
  const [tg, setTg] = useState(null);

  const [champions, setChampions] = useState([]);
  const [champDetails, setChampDetails] = useState({});
  const [language, setLanguage] = useState("ru_ru");

  const [rolesDict, setRolesDict] = useState({});
  const [roles, setRoles] = useState([]);
  const [roleLabels, setRoleLabels] = useState({});

  const [loadingList, setLoadingList] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const [selectedRoles, setSelectedRoles] = useState([]);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState("");

  const [error, setError] = useState(null);

  // Telegram WebApp init
  useEffect(() => {
    const webApp = window.Telegram?.WebApp;
    if (webApp) {
      setTg(webApp);
      webApp.ready();
      webApp.expand();
    }
  }, []);

  // roles dictionary
  useEffect(() => {
    async function loadRolesDict() {
      try {
        const res = await fetch("/dictionaries/roles.json");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setRolesDict(data);
      } catch (e) {
        console.error("Ошибка загрузки словаря ролей", e);
      }
    }

    loadRolesDict();
  }, []);

  // roles list + labels from dictionary
  useEffect(() => {
    if (!rolesDict || !Object.keys(rolesDict).length) return;

    const keys = Object.keys(rolesDict);
    const labels = {};

    for (const key of keys) {
      const nameObj = rolesDict[key]?.name || {};
      labels[key] =
        nameObj[language] ||
        nameObj.ru_ru ||
        nameObj.en_us ||
        key.toUpperCase();
    }

    setRoles(keys.sort());
    setRoleLabels(labels);
  }, [rolesDict, language]);

  // champions.json
  useEffect(() => {
    async function loadChampions() {
      try {
        const res = await fetch("/champions.json");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setChampions(data);
      } catch (e) {
        console.error("Ошибка загрузки champions.json", e);
        setError("Не удалось загрузить список чемпионов");
      } finally {
        setLoadingList(false);
      }
    }

    loadChampions();
  }, []);

  // full champions data
  useEffect(() => {
    if (!champions.length) return;

    async function loadDetails() {
      setLoadingDetails(true);
      setError(null);

      try {
        const entries = await Promise.all(
          champions.map(async (ch) => {
            try {
              const res = await fetch(`/champions/${ch.slug}.json`);
              if (!res.ok) throw new Error(`HTTP ${res.status}`);
              const data = await res.json();
              return [ch.slug, data];
            } catch (e) {
              console.error("Ошибка загрузки чемпиона", ch.slug, e);
              return null;
            }
          })
        );

        const detailsMap = {};
        for (const ent of entries) {
          if (!ent) continue;
          const [slug, data] = ent;
          detailsMap[slug] = data;
        }

        setChampDetails(detailsMap);
      } catch (e) {
        console.error("Ошибка пакетной загрузки деталей чемпионов", e);
        setError("Не удалось загрузить детали чемпионов");
      } finally {
        setLoadingDetails(false);
      }
    }

    loadDetails();
  }, [champions]);

  async function openChampion(slug) {
    setError(null);

    if (champDetails[slug]) {
      setSelected(champDetails[slug]);
      return;
    }

    try {
      const res = await fetch(`/champions/${slug}.json`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setSelected(data);
    } catch (e) {
      console.error("Ошибка загрузки чемпиона", slug, e);
      setError(`Не удалось загрузить чемпиона ${slug}`);
    }
  }

  // фильтрация
  const filteredChampions = useMemo(() => {
    const term = search.trim().toLowerCase();

    return champions.filter((ch) => {
      const slug = String(ch.slug || "").toLowerCase();
      const nameStr = String(ch.name || "").toLowerCase();

      if (term) {
        if (!slug.includes(term) && !nameStr.includes(term)) {
          return false;
        }
      }

      if (selectedRoles.length > 0) {
        const details = champDetails[ch.slug];
        const roleKeys = Array.isArray(details?.roles)
          ? details.roles.map((r) => (typeof r === "string" ? r : r.key))
          : [];

        const hasIntersection = selectedRoles.some((r) => roleKeys.includes(r));
        if (!hasIntersection) {
          return false;
        }
      }

      return true;
    });
  }, [champions, champDetails, search, selectedRoles]);

  const bg = tg?.themeParams?.bg_color || "#050816";
  const textColor = tg?.themeParams?.text_color || "#ffffff";

  const getChampionName = (ch) => {
    const full = champDetails[ch.slug];
    return (
      full?.name?.[language] ||
      full?.name?.ru_ru ||
      full?.name?.en_us ||
      ch.name ||
      ch.slug
    );
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "4px 10px 10px 10px",
        background: bg,
        color: textColor,
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      <Header
        search={search}
        onSearchChange={setSearch}
        language={language}
        onLanguageChange={setLanguage}
      />

      <RolesFilter
        roles={roles.map((key) => ({
          key,
          label: roleLabels[key] || key.toUpperCase(),
        }))}
        selectedRoles={selectedRoles}
        onChange={setSelectedRoles}
      />

      {error && (
        <div
          style={{
            marginTop: 6,
            padding: "6px 8px",
            borderRadius: 8,
            background: "#402020",
            fontSize: 13,
          }}
        >
          {error}
        </div>
      )}

      {loadingList && (
        <div style={{ marginTop: 8, fontSize: 13 }}>Загружаю чемпионов...</div>
      )}

      {/* список чемпов */}
      {!loadingList && !selected && (
        <div
          style={{
            marginTop: 8,
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            columnGap: 10,
            rowGap: 12,
            maxHeight: "calc(100vh - 140px)",
            overflowY: "auto",
            paddingBottom: 14,
          }}
        >
          {filteredChampions.map((ch) => {
            const full = champDetails[ch.slug];
            const name = getChampionName(ch);
            const image = full?.baseImgUrl || "/fallback.png";

            return (
              <ChampionCard
                key={ch.slug}
                name={name}
                slug={ch.slug}
                image={image}
                onClick={() => openChampion(ch.slug)}
              />
            );
          })}

          {!filteredChampions.length && (
            <div
              style={{
                gridColumn: "1 / -1",
                fontSize: 13,
                opacity: 0.7,
                marginTop: 8,
                textAlign: "center",
              }}
            >
              Никого не нашёл под такой фильтр 🤷‍♂️
            </div>
          )}
        </div>
      )}

      {/* детальная карточка чемпиона */}
      {selected && (
        <ChampionDetails
          champ={selected}
          language={language}
          onBack={() => setSelected(null)}
        />
      )}
    </div>
  );
}

export default App;
