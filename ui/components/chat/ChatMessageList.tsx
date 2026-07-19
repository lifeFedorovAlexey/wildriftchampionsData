import type { ChatMessage } from "./chat-types";
import { FaTrashCan } from "react-icons/fa6";
import styles from "./ChatMvpClient.module.css";

type Props = {
  messages: ChatMessage[];
  currentUserId: number;
  isAdmin: boolean;
  hasChannel: boolean;
  endRef: React.RefObject<HTMLDivElement | null>;
  onDelete: (message: ChatMessage) => void;
};

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDay(value: string) {
  return new Date(value).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function getDayKey(value: string) {
  const date = new Date(value);
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

export default function ChatMessageList({
  messages,
  currentUserId,
  isAdmin,
  hasChannel,
  endRef,
  onDelete,
}: Props) {
  return (
    <div className={styles.messages} aria-live="polite">
      {messages.map((message, index) => {
        const day = getDayKey(message.createdAt);
        const previousDay = index > 0 ? getDayKey(messages[index - 1].createdAt) : "";
        const showDay = day !== previousDay;
        const canDelete = isAdmin || Number(message.authorUserId) === currentUserId;

        return (
          <div key={`${message.id}-${message.createdAt}`}>
            {showDay ? <div className={styles.dateDivider}>{formatDay(message.createdAt)}</div> : null}
            <article className={styles.messageCard}>
              <div className={styles.messageHead}>
                <div className={styles.authorLine}>
                  {message.author?.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img className={styles.avatar} src={message.author.avatarUrl} alt="" />
                  ) : (
                    <span className={styles.avatarFallback} />
                  )}
                  <span className={styles.messageAuthor}>
                    {message.author?.displayName || `user #${message.authorUserId}`}
                  </span>
                </div>
                <div className={styles.messageMeta}>
                  <time className={styles.messageTime} dateTime={message.createdAt}>
                    {formatTime(message.createdAt)}
                  </time>
                  {canDelete ? (
                    <button
                      type="button"
                      className={styles.messageAction}
                      onClick={() => onDelete(message)}
                      aria-label="Удалить сообщение"
                      title="Удалить сообщение"
                    >
                      <FaTrashCan aria-hidden="true" />
                    </button>
                  ) : null}
                </div>
              </div>
              {message.body ? <p className={styles.messageBody}>{message.body}</p> : null}
              {message.attachments?.length ? (
                <div className={styles.attachmentGrid}>
                  {message.attachments.map((attachment) =>
                    attachment.mediaKind === "image" && attachment.url ? (
                      <a
                        key={attachment.id}
                        href={attachment.url}
                        target="_blank"
                        rel="noreferrer"
                        className={styles.attachmentLink}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          className={styles.attachmentImage}
                          src={attachment.url}
                          alt={attachment.fileName}
                          loading="lazy"
                        />
                      </a>
                    ) : attachment.url ? (
                      <video
                        key={attachment.id}
                        className={styles.attachmentVideo}
                        src={attachment.url}
                        controls
                        preload="metadata"
                      />
                    ) : null,
                  )}
                </div>
              ) : null}
            </article>
          </div>
        );
      })}
      {!messages.length ? (
        <div className={styles.emptyState}>
          {hasChannel ? "Пока пусто. Напиши первым." : "Чат ещё не выбран."}
        </div>
      ) : null}
      <div ref={endRef} />
    </div>
  );
}
