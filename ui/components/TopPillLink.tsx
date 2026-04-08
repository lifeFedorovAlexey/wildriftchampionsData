import Link from "next/link";
import styles from "./TopPillLink.module.css";

export default function TopPillLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link href={href} className={styles.link}>
      {children}
    </Link>
  );
}
