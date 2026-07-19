import { useMemo, useState } from "react";
import type { ModerationState } from "./chat-types";
import styles from "./ChatMvpClient.module.css";

type ModerationAction = "ban" | "unban" | "kick" | "mute" | "unmute";

type Props = {
  state: ModerationState | null;
  currentUserId: number;
  busy: boolean;
  onClose: () => void;
  onReload: () => void;
  onAction: (input: {
    action: ModerationAction;
    targetUserId: number;
    durationSeconds?: number;
    reason?: string;
  }) => void;
};

const MUTE_OPTIONS = [
  { label: "5 мин", seconds: 5 * 60 },
  { label: "1 час", seconds: 60 * 60 },
  { label: "1 день", seconds: 24 * 60 * 60 },
];

function formatUserName(userId: number, state: ModerationState | null) {
  const member = state?.members.find((item) => Number(item.user.id) === userId);
  return member?.user.displayName || `user #${userId}`;
}

export default function ChatModerationDrawer({
  state,
  currentUserId,
  busy,
  onClose,
  onReload,
  onAction,
}: Props) {
  const [reason, setReason] = useState("");
  const [muteSeconds, setMuteSeconds] = useState(MUTE_OPTIONS[0].seconds);
  const bannedIds = useMemo(
    () => new Set((state?.bans || []).map((ban) => Number(ban.userId))),
    [state?.bans],
  );
  const mutedIds = useMemo(
    () => new Set((state?.mutes || []).map((mute) => Number(mute.userId))),
    [state?.mutes],
  );

  return (
    <div className={styles.overlay} onClick={onClose}>
      <aside className={styles.panel} onClick={(event) => event.stopPropagation()}>
        <div className={styles.panelHead}>
          <div>
            <span className={styles.panelEyebrow}>Только администратору</span>
            <h3 className={styles.panelTitle}>Модерация</h3>
          </div>
          <button type="button" className={styles.panelClose} onClick={onClose} aria-label="Закрыть">
            ×
          </button>
        </div>

        <label className={styles.fieldLabel}>
          Причина
          <input
            className={styles.input}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Необязательно"
            maxLength={300}
          />
        </label>

        <div className={styles.muteOptions}>
          {MUTE_OPTIONS.map((option) => (
            <button
              key={option.seconds}
              type="button"
              className={`${styles.smallButton} ${muteSeconds === option.seconds ? styles.smallButtonActive : ""}`.trim()}
              onClick={() => setMuteSeconds(option.seconds)}
            >
              {option.label}
            </button>
          ))}
        </div>

        <section className={styles.panelSection}>
          <div className={styles.panelSectionHead}>
            <span className={styles.panelLabel}>Участники</span>
            <button type="button" className={styles.textButton} onClick={onReload} disabled={busy}>
              Обновить
            </button>
          </div>
          <div className={styles.moderationList}>
            {(state?.members || [])
              .filter((member) => Number(member.user.id) !== currentUserId)
              .map((member) => {
                const userId = Number(member.user.id);
                const muted = mutedIds.has(userId);
                const banned = bannedIds.has(userId);
                return (
                  <div key={userId} className={styles.moderationRow}>
                    <div className={styles.moderationIdentity}>
                      <strong>{member.user.displayName || `user #${userId}`}</strong>
                      <span>#{userId}</span>
                    </div>
                    <div className={styles.moderationActions}>
                      <button
                        type="button"
                        className={styles.smallButton}
                        disabled={busy || banned}
                        onClick={() =>
                          onAction({
                            action: muted ? "unmute" : "mute",
                            targetUserId: userId,
                            durationSeconds: muted ? undefined : muteSeconds,
                            reason,
                          })
                        }
                      >
                        {muted ? "Снять мут" : "Мут"}
                      </button>
                      <button
                        type="button"
                        className={styles.smallButton}
                        disabled={busy || banned}
                        onClick={() => onAction({ action: "kick", targetUserId: userId, reason })}
                      >
                        Кик
                      </button>
                      <button
                        type="button"
                        className={styles.dangerButton}
                        disabled={busy || banned}
                        onClick={() => onAction({ action: "ban", targetUserId: userId, reason })}
                      >
                        Бан
                      </button>
                    </div>
                  </div>
                );
              })}
            {!state?.members?.length ? <div className={styles.sidebarEmpty}>Участников нет.</div> : null}
          </div>
        </section>

        {state?.bans?.length ? (
          <section className={styles.panelSection}>
            <span className={styles.panelLabel}>Заблокированы</span>
            <div className={styles.moderationList}>
              {state.bans.map((ban) => (
                <div key={ban.userId} className={styles.moderationRow}>
                  <div className={styles.moderationIdentity}>
                    <strong>{ban.user.displayName || `user #${ban.userId}`}</strong>
                    <span>{ban.reason || "Без причины"}</span>
                  </div>
                  <button
                    type="button"
                    className={styles.smallButton}
                    disabled={busy}
                    onClick={() => onAction({ action: "unban", targetUserId: ban.userId, reason })}
                  >
                    Разбанить
                  </button>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {state?.mutes?.length ? (
          <section className={styles.panelSection}>
            <span className={styles.panelLabel}>Активные муты</span>
            <div className={styles.auditList}>
              {state.mutes.map((mute) => (
                <div key={mute.id} className={styles.auditRow}>
                  <span>{formatUserName(Number(mute.userId), state)}</span>
                  <time dateTime={mute.expiresAt}>
                    до {new Date(mute.expiresAt).toLocaleString("ru-RU")}
                  </time>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {state?.recentActions?.length ? (
          <section className={styles.panelSection}>
            <span className={styles.panelLabel}>Последние действия</span>
            <div className={styles.auditList}>
              {state.recentActions.slice(0, 12).map((item) => (
                <div key={item.id} className={styles.auditRow}>
                  <span>{item.action} · user #{item.targetUserId || "—"}</span>
                  <time dateTime={item.createdAt}>{new Date(item.createdAt).toLocaleString("ru-RU")}</time>
                </div>
              ))}
            </div>
          </section>
        ) : null}
      </aside>
    </div>
  );
}
