import Link from "next/link";
import styles from "./Footer.module.css";

const navLinks = [
  { href: "/", label: "Статистика чемпионов" },
  { href: "/tier-inq", label: "Тир-лист" },
  { href: "/trends", label: "Тренды" },
  { href: "/guides", label: "Гайды" },
  { href: "/skins", label: "3D скины" },
];

const sourceLinks = [
  { href: "https://lolm.qq.com", label: "lolm.qq.com" },
  {
    href: "https://wildrift.leagueoflegends.com",
    label: "wildrift.leagueoflegends.com",
  },
];

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.shell}>
        <div className={styles.topRow}>
          <div className={styles.brandBlock}>
            <span className={styles.brand}>wildrift all stats.ru</span>
          </div>

          <nav className={styles.nav} aria-label="Разделы сайта">
            {navLinks.map((item) => (
              <Link key={item.href} href={item.href} className={styles.textLink}>
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className={styles.bottomRow}>
          <div className={styles.sources}>
            <span className={styles.label}>Источники данных</span>
            <div className={styles.linkRow}>
              {sourceLinks.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.textLink}
                >
                  {item.label}
                </a>
              ))}
            </div>
          </div>

          <div className={styles.legal}>
            <p className={styles.copyright}>© 2026 wildrift all stats.ru</p>
            <p className={styles.disclaimer}>
              Фан-проект. Права на оригинальный контент принадлежат соответствующим
              правообладателям.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
