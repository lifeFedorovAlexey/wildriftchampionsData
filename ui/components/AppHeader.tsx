"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  getTelegramWebApp,
  TELEGRAM_WEBAPP_READY_EVENT,
} from "@/lib/telegram-webapp";
import {
  IconPicksBans,
  IconTierInq,
  IconTierlist,
  IconTrends,
  IconWinrate,
} from "@/components/icons/MenuIcons";

import styles from "./AppHeader.module.css";

type NavLeaf = {
  label: string;
  href: string;
  icon: React.ReactNode;
};

type NavItem = NavLeaf & {
  children?: NavLeaf[];
};

const NAV_ITEMS: NavItem[] = [
  { label: "Статистика чемпионов", href: "/", icon: <IconWinrate size={20} /> },
  {
    label: "Тир-листы",
    href: "/tier-inq",
    icon: <IconTierlist size={20} />,
    children: [
      { label: "Авторский", href: "/tier-inq", icon: <IconTierInq size={18} /> },
      { label: "По статистике", href: "/tierlist", icon: <IconTierlist size={18} /> },
    ],
  },
  { label: "Топ пики / баны", href: "/picks-bans", icon: <IconPicksBans size={20} /> },
  { label: "График трендов", href: "/trends", icon: <IconTrends size={20} /> },
  { label: "Гайды", href: "/guides", icon: <IconTierInq size={20} /> },
];

function isActive(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

function isItemActive(pathname: string, item: NavItem) {
  if (isActive(pathname, item.href)) {
    return true;
  }

  return item.children?.some((child) => isActive(pathname, child.href)) ?? false;
}

function TelegramIcon() {
  return (
    <svg viewBox="0 0 50 50" aria-hidden="true" className={styles.utilityIcon}>
      <path
        d="M46.137 6.552c-.75-.636-1.928-.727-3.146-.238l-.002 0C41.708 6.828 6.728 21.832 5.304 22.445c-.259.09-2.521.934-2.288 2.814.208 1.695 2.026 2.397 2.248 2.478l8.893 3.045c.59 1.964 2.765 9.21 3.246 10.758.3.965.789 2.233 1.646 2.494.752.29 1.5.025 1.984-.355l5.437-5.043 8.777 6.845.209.125c.596.264 1.167.396 1.712.396.421 0 .825-.079 1.211-.237 1.315-.54 1.841-1.793 1.896-1.935l6.556-34.077c.377-1.943-.179-2.869-.717-3.324ZM22 32l-3 8-3-10 23-17L22 32Z"
        fill="currentColor"
      />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={styles.utilityIcon}>
      <path d="M6 7.25h12v1.5H6Zm0 4h12v1.5H6Zm0 4h12v1.5H6Z" fill="currentColor" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={styles.utilityIcon}>
      <path
        d="m7.7 8.76 1.06-1.06L12 10.94l3.24-3.24 1.06 1.06L13.06 12l3.24 3.24-1.06 1.06L12 13.06 8.76 16.3 7.7 15.24 10.94 12 7.7 8.76Z"
        fill="currentColor"
      />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className={styles.chevronIcon}>
      <path
        d="m4.47 6.03 3.53 3.53 3.53-3.53 1.06 1.06-4.59 4.59-4.59-4.59 1.06-1.06Z"
        fill="currentColor"
      />
    </svg>
  );
}

function ProfileIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={styles.utilityIcon}>
      <path
        d="M12 4.75a3.75 3.75 0 1 0 0 7.5 3.75 3.75 0 0 0 0-7.5Zm0 9.5c-3.77 0-6.75 1.86-6.75 4.25v.75h13.5v-.75c0-2.39-2.98-4.25-6.75-4.25Z"
        fill="currentColor"
      />
    </svg>
  );
}

function BrandMark({ size }: { size: number }) {
  return (
    <img
      src="/favicon.ico"
      alt=""
      width={size}
      height={size}
      className={styles.markImage}
      loading="eager"
    />
  );
}

export default function AppHeader() {
  const pathname = usePathname();
  const [menuOpenPath, setMenuOpenPath] = useState<string | null>(null);
  const [mobileTiersOpen, setMobileTiersOpen] = useState(true);
  const [desktopTiersOpenPath, setDesktopTiersOpenPath] = useState<string | null>(null);
  const [isTelegramWebApp, setIsTelegramWebApp] = useState(false);
  const desktopGroupRef = useRef<HTMLDivElement | null>(null);
  const mobileMenuButtonRef = useRef<HTMLButtonElement | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);

  const menuOpen = menuOpenPath === pathname;
  const desktopTiersOpen = desktopTiersOpenPath === pathname;

  function closeMenu({ restoreFocus = false } = {}) {
    setMenuOpenPath(null);
    if (restoreFocus) {
      requestAnimationFrame(() => {
        mobileMenuButtonRef.current?.focus();
      });
    }
  }

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;

    if (menuOpen) {
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [menuOpen]);

  useEffect(() => {
    const overlay = overlayRef.current;
    if (!overlay) return;

    if (menuOpen) {
      overlay.removeAttribute("inert");
      return;
    }

    if (overlay.contains(document.activeElement)) {
      mobileMenuButtonRef.current?.focus();
    }
    overlay.setAttribute("inert", "");
  }, [menuOpen]);

  useEffect(() => {
    const syncTelegramState = () => {
      const webApp = getTelegramWebApp();
      const hasInitData =
        typeof webApp?.initData === "string" && webApp.initData.trim().length > 0;
      const hasUser = Boolean(webApp?.initDataUnsafe?.user);
      setIsTelegramWebApp(hasInitData || hasUser);
    };

    syncTelegramState();
    window.addEventListener(TELEGRAM_WEBAPP_READY_EVENT, syncTelegramState);

    return () => {
      window.removeEventListener(TELEGRAM_WEBAPP_READY_EVENT, syncTelegramState);
    };
  }, []);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!desktopGroupRef.current) return;
      if (!desktopGroupRef.current.contains(event.target as Node)) {
        setDesktopTiersOpenPath(null);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setDesktopTiersOpenPath(null);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  return (
    <header className={styles.header}>
      <div className={styles.bar}>
        <div className={styles.inner}>
          <Link href="/" className={styles.brand} aria-label="wildrift all stats.ru">
            <span className={styles.mark}>
              <BrandMark size={28} />
            </span>
            <span className={styles.brandText}>
              <span className={styles.brandWord}>wildrift</span>
              <span className={styles.brandWord}>all</span>
              <span className={styles.brandAccent}>stats.ru</span>
            </span>
          </Link>

          <nav className={styles.desktopNav} aria-label="Разделы сайта">
            {NAV_ITEMS.map((item) =>
              item.children ? (
                <div
                  key={item.label}
                  ref={desktopGroupRef}
                  className={`${styles.desktopGroup} ${
                    isItemActive(pathname, item) ? styles.desktopGroupActive : ""
                  } ${desktopTiersOpen ? styles.desktopGroupOpen : ""}`}
                >
                  <button
                    type="button"
                    className={styles.desktopGroupButton}
                    aria-expanded={desktopTiersOpen}
                    aria-haspopup="menu"
                    onClick={() =>
                      setDesktopTiersOpenPath((value) =>
                        value === pathname ? null : pathname,
                      )
                    }
                  >
                    <span>{item.label}</span>
                    <ChevronIcon />
                  </button>

                  <div className={styles.desktopDropdown} role="menu">
                    {item.children.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        className={`${styles.desktopDropdownLink} ${
                          isActive(pathname, child.href) ? styles.desktopDropdownLinkActive : ""
                        }`}
                        role="menuitem"
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                </div>
              ) : (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`${styles.desktopLink} ${
                    isActive(pathname, item.href) ? styles.desktopLinkActive : ""
                  }`}
                >
                  {item.label}
                </Link>
              ),
            )}
          </nav>

          <div className={styles.actions}>
            <Link href="/me" className={styles.profileLink} aria-label="Профиль">
              <ProfileIcon />
            </Link>

            {!isTelegramWebApp ? (
              <a
                href="https://t.me/life_wr_bot"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.utilityButton}
                aria-label="Telegram"
              >
                <TelegramIcon />
              </a>
            ) : null}

            <button
              type="button"
              ref={mobileMenuButtonRef}
              className={styles.utilityButton}
              aria-label={menuOpen ? "Закрыть меню" : "Открыть меню"}
              aria-expanded={menuOpen}
              aria-controls="site-menu"
              onClick={() =>
                setMenuOpenPath((value) => (value === pathname ? null : pathname))
              }
            >
              {menuOpen ? <CloseIcon /> : <MenuIcon />}
            </button>
          </div>
        </div>
      </div>

      <div
        ref={overlayRef}
        className={`${styles.overlay} ${menuOpen ? styles.overlayOpen : ""}`}
      >
        <div className={styles.overlayBackdrop} onClick={() => closeMenu({ restoreFocus: true })} />
        <nav id="site-menu" className={styles.menuPanel} aria-label="Меню сайта">
          <div className={styles.menuHeader}>
            <span className={styles.menuLogo}>
              <BrandMark size={24} />
            </span>
            <button
              type="button"
              className={styles.utilityButton}
              aria-label="Закрыть меню"
              onClick={() => closeMenu({ restoreFocus: true })}
            >
              <CloseIcon />
            </button>
          </div>

          <div className={styles.menuList}>
            {NAV_ITEMS.map((item) =>
              item.children ? (
                <div
                  key={item.label}
                  className={`${styles.mobileGroup} ${
                    isItemActive(pathname, item) ? styles.mobileGroupActive : ""
                  }`}
                >
                  <button
                    type="button"
                    className={styles.mobileGroupButton}
                    onClick={() => setMobileTiersOpen((value) => !value)}
                    aria-expanded={mobileTiersOpen}
                  >
                    <span className={styles.menuLinkLead}>
                      <span className={styles.menuLinkIcon}>{item.icon}</span>
                      <span>{item.label}</span>
                    </span>
                    <span
                      className={`${styles.mobileGroupChevron} ${
                        mobileTiersOpen ? styles.mobileGroupChevronOpen : ""
                      }`}
                    >
                      <ChevronIcon />
                    </span>
                  </button>

                  {mobileTiersOpen ? (
                    <div className={styles.mobileSubmenu}>
                      {item.children.map((child) => (
                        <Link
                          key={child.href}
                          href={child.href}
                          className={`${styles.mobileSubmenuLink} ${
                            isActive(pathname, child.href) ? styles.mobileSubmenuLinkActive : ""
                          }`}
                          onClick={() => closeMenu()}
                        >
                          <span className={styles.menuLinkLead}>
                            <span className={styles.menuLinkIcon}>{child.icon}</span>
                            <span>{child.label}</span>
                          </span>
                        </Link>
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`${styles.menuLink} ${
                    isActive(pathname, item.href) ? styles.menuLinkActive : ""
                  }`}
                  onClick={() => closeMenu()}
                >
                  <span className={styles.menuLinkLead}>
                    <span className={styles.menuLinkIcon}>{item.icon}</span>
                    <span>{item.label}</span>
                  </span>
                </Link>
              ),
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}
