"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  FaBars,
  FaChevronDown,
  FaCircleUser,
  FaXmark,
} from "react-icons/fa6";
import {
  IconChat,
  IconPicksBans,
  IconSupport,
  IconTierInq,
  IconTierlist,
  IconTrends,
  IconWinrate,
} from "@/components/icons/MenuIcons";
import { filterSiteNavigation } from "@/lib/site-navigation.js";

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
      { label: "Стримеры", href: "/streamers", icon: <IconTierInq size={18} /> },
    ],
  },
  {
    label: "Графики",
    href: "/picks-bans",
    icon: <IconTrends size={20} />,
    children: [
      { label: "Пики и баны", href: "/picks-bans", icon: <IconPicksBans size={18} /> },
      { label: "Тренды", href: "/trends", icon: <IconTrends size={18} /> },
    ],
  },
  { label: "Гайды", href: "/guides", icon: <IconTierInq size={20} /> },
  { label: "Квизы", href: "/quizzes", icon: <IconTierInq size={20} /> },
  { label: "Чат", href: "/me/chat", icon: <IconChat size={20} /> },
  { label: "Поддержать", href: "/support", icon: <IconSupport size={20} /> },
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

function isSupportItem(item: NavItem) {
  return item.href === "/support";
}

function BrandMark({ priority = false, size }: { priority?: boolean; size: number }) {
  return (
    <Image
      src="/favicon.ico"
      alt=""
      width={size}
      height={size}
      sizes={`${size}px`}
      priority={priority}
      unoptimized
      className={styles.markImage}
    />
  );
}

export default function AppHeader() {
  const pathname = usePathname();
  const [authenticated, setAuthenticated] = useState(false);
  const [menuOpenPath, setMenuOpenPath] = useState<string | null>(null);
  const [mobileOpenGroup, setMobileOpenGroup] = useState<string | null>("/tier-inq");
  const [desktopOpenGroup, setDesktopOpenGroup] = useState<string | null>(null);
  const desktopGroupRef = useRef<HTMLElement | null>(null);
  const mobileMenuButtonRef = useRef<HTMLButtonElement | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);

  const menuOpen = menuOpenPath === pathname;

  const visibleNavItems = filterSiteNavigation(NAV_ITEMS, { authenticated }) as NavItem[];

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/auth/session", { cache: "no-store", signal: controller.signal })
      .then((response) => (response.ok ? response.json() : null))
      .then((payload) => setAuthenticated(payload?.authenticated === true))
      .catch(() => undefined);
    return () => controller.abort();
  }, [pathname]);

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
    function handlePointerDown(event: MouseEvent) {
      if (!desktopGroupRef.current) return;
      if (!desktopGroupRef.current.contains(event.target as Node)) {
        setDesktopOpenGroup(null);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setDesktopOpenGroup(null);
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
              <BrandMark size={28} priority />
            </span>
            <span className={styles.brandText}>
              <span className={styles.brandWord}>wildrift</span>
              <span className={styles.brandWord}>all</span>
              <span className={styles.brandAccent}>stats.ru</span>
            </span>
          </Link>

          <nav ref={desktopGroupRef} className={styles.desktopNav} aria-label="Разделы сайта">
            {visibleNavItems.map((item) =>
              item.children ? (
                <div
                  key={item.label}
                  className={`${styles.desktopGroup} ${
                    isItemActive(pathname, item) ? styles.desktopGroupActive : ""
                  } ${desktopOpenGroup === item.href ? styles.desktopGroupOpen : ""}`}
                >
                  <button
                    type="button"
                    className={styles.desktopGroupButton}
                    aria-expanded={desktopOpenGroup === item.href}
                    aria-haspopup="menu"
                    onClick={() =>
                      setDesktopOpenGroup((value) =>
                        value === item.href ? null : item.href,
                      )
                    }
                  >
                    <span>{item.label}</span>
                    <FaChevronDown className={styles.chevronIcon} aria-hidden="true" />
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
                    isSupportItem(item) ? styles.desktopLinkSupport : ""
                  } ${
                    isActive(pathname, item.href) ? styles.desktopLinkActive : ""
                  }`}
                >
                  {item.label}
                </Link>
              ),
            )}
          </nav>

          <div className={styles.actions}>
            <Link
              href="/me"
              className={`${styles.utilityButton} ${styles.profileButton}`.trim()}
              aria-label="Профиль"
            >
              <FaCircleUser className={styles.utilityIcon} aria-hidden="true" />
            </Link>

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
              {menuOpen ? (
                <FaXmark className={styles.utilityIcon} aria-hidden="true" />
              ) : (
                <FaBars className={styles.utilityIcon} aria-hidden="true" />
              )}
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
              <FaXmark className={styles.utilityIcon} aria-hidden="true" />
            </button>
          </div>

          <div className={styles.menuList}>
            {visibleNavItems.map((item) =>
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
                    onClick={() =>
                      setMobileOpenGroup((value) => (value === item.href ? null : item.href))
                    }
                    aria-expanded={mobileOpenGroup === item.href}
                  >
                    <span className={styles.menuLinkLead}>
                      <span className={styles.menuLinkIcon}>{item.icon}</span>
                      <span>{item.label}</span>
                    </span>
                    <span
                      className={`${styles.mobileGroupChevron} ${
                        mobileOpenGroup === item.href ? styles.mobileGroupChevronOpen : ""
                      }`}
                    >
                      <FaChevronDown className={styles.chevronIcon} aria-hidden="true" />
                    </span>
                  </button>

                  {mobileOpenGroup === item.href ? (
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
                    isSupportItem(item) ? styles.menuLinkSupport : ""
                  } ${
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
