import Image from "next/image";
import Link from "next/link";
import styles from "./Footer.module.css";

const navLinks = [
  { href: "/", label: "Статистика чемпионов" },
  { href: "/tier-inq", label: "Тир-лист" },
  { href: "/trends", label: "Тренды" },
  { href: "/guides", label: "Гайды" },
  { href: "/support", label: "Поддержать" },
];

const sourceLinks = [
  { href: "https://lolm.qq.com", label: "lolm.qq.com" },
  {
    href: "https://wildrift.leagueoflegends.com",
    label: "wildrift.leagueoflegends.com",
  },
];

const SUPPORT_LINK = "https://boosty.to/lifeonfire/donate";

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.shell}>
        <div className={styles.topRow}>
          <div className={styles.topMain}>
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

            <div className={styles.supportRow}>
              <a
                href={SUPPORT_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.supportLogoLink}
                aria-label="Boosty"
              >
                <Image
                  src="/boosty-logo.svg"
                  alt="Boosty"
                  width={897}
                  height={317}
                  sizes="122px"
                  unoptimized
                  className={styles.supportLogo}
                />
              </a>
              <a
                href={SUPPORT_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.supportQrPanel}
                aria-label="QR-код для поддержки проекта"
              >
                <Image
                  src="/boosty-donate-qr.png"
                  alt="QR-код для поддержки проекта"
                  width={116}
                  height={116}
                  sizes="116px"
                  className={styles.supportQr}
                />
              </a>
            </div>
          </div>
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
