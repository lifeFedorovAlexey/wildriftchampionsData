import type { ReactNode } from "react";
import Link from "next/link";
import styles from "@/app/admin/admin.module.css";

type AdminShellProps = {
  activeSection: "profile" | "imports";
  children: ReactNode;
};

function getLinkClass(isActive: boolean) {
  return `${styles.sidebarLink} ${isActive ? styles.sidebarLinkActive : styles.sidebarLinkMuted}`.trim();
}

export default function AdminShell({ activeSection, children }: AdminShellProps) {
  return (
    <div className={styles.page}>
      <div className={styles.adminShell}>
        <aside className={styles.sidebar}>
          <div className={styles.sidebarHead}>
            <div className={styles.eyebrow}>Private Area</div>
            <h1 className={styles.sidebarTitle}>Админка</h1>
            <p className={styles.sidebarLead}>
              Профиль, ручные импорты и технические проверки живут в одной приватной оболочке.
            </p>
          </div>

          <nav className={styles.sidebarNav} aria-label="Навигация админки">
            <Link href="/admin" className={getLinkClass(activeSection === "profile")}>
              <span>Профиль</span>
              <span className={styles.sidebarLinkMeta}>
                {activeSection === "profile" ? "Сейчас" : "Основное"}
              </span>
            </Link>
            <Link href="/admin/imports" className={getLinkClass(activeSection === "imports")}>
              <span>Импорты</span>
              <span className={styles.sidebarLinkMeta}>
                {activeSection === "imports" ? "Сейчас" : "Аудит"}
              </span>
            </Link>
            <div className={`${styles.sidebarLink} ${styles.sidebarLinkMuted}`}>
              <span>Доступы</span>
              <span className={styles.sidebarLinkMeta}>Скоро</span>
            </div>
          </nav>

          <div className={styles.sidebarFooter}>
            <Link href="/guides" className={styles.button}>Открыть гайды</Link>
            <form action="/api/admin/auth/logout" method="post">
              <button type="submit" className={`${styles.button} ${styles.buttonSecondary}`}>
                Выйти
              </button>
            </form>
          </div>
        </aside>

        <div className={styles.main}>{children}</div>
      </div>
    </div>
  );
}
