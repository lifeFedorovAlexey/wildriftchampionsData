import Image from "next/image";

import type { PatchNote } from "./patch-notes-lib";
import styles from "./patch-notes.module.css";

type Change = PatchNote["changes"][number];

export default function PatchNoteEntityHeading({ change }: { change: Change }) {
  const isChampion = change.entityKind === "champion";

  return (
    <div className={`${styles.entityHead} ${isChampion ? styles.entityHeadChampion : ""}`}>
      <div className={styles.entityIcon}>
        {change.imageUrl ? (
          <Image src={change.imageUrl} alt="" width={44} height={44} unoptimized />
        ) : <span aria-hidden="true">{change.entityName.slice(0, 1)}</span>}
      </div>
      <div className={`${styles.entityTitle} ${isChampion ? styles.entityTitleChampion : ""}`}>
        <h4>{change.entityName}</h4>
        <span className={styles.entityKind}>{entityKindLabel(change.entityKind)}</span>
      </div>
    </div>
  );
}

function entityKindLabel(kind: string) {
  if (kind === "champion") return "ЧЕМПИОН";
  if (kind === "item") return "ПРЕДМЕТ";
  if (kind === "rune") return "РУНА";
  if (kind === "spell") return "ЗАКЛИНАНИЕ";
  if (kind === "skin") return "ОБЛИК";
  return "ИГРА / КАРТА";
}
