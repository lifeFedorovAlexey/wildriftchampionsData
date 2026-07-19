import { useRef } from "react";
import { FaPaperclip, FaXmark } from "react-icons/fa6";
import styles from "./ChatMvpClient.module.css";

type Props = {
  value: string;
  files: File[];
  disabled: boolean;
  busy: boolean;
  onChange: (value: string) => void;
  onFilesChange: (files: File[]) => void;
  onSend: () => void;
  onTyping: () => void;
};

export default function ChatComposer({
  value,
  files,
  disabled,
  busy,
  onChange,
  onFilesChange,
  onSend,
  onTyping,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  return (
    <div className={styles.composer}>
      {files.length ? (
        <div className={styles.pendingFiles}>
          {files.map((file, index) => (
            <span key={`${file.name}-${file.size}-${index}`} className={styles.pendingFile}>
              {file.name}
              <button
                type="button"
                onClick={() => onFilesChange(files.filter((_, fileIndex) => fileIndex !== index))}
                aria-label={`Убрать ${file.name}`}
              >
                <FaXmark aria-hidden="true" />
              </button>
            </span>
          ))}
        </div>
      ) : null}
      <div className={styles.composerRow}>
        <button
          type="button"
          className={styles.attachButton}
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || busy}
          aria-label="Добавить изображение или видео"
          title="До 15 МБ на файл"
        >
          <FaPaperclip aria-hidden="true" />
        </button>
        <input
          ref={fileInputRef}
          className={styles.fileInput}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,image/avif,video/mp4,video/webm,video/quicktime"
          multiple
          onChange={(event) => {
            onFilesChange(Array.from(event.target.files || []));
            event.target.value = "";
          }}
        />
        <textarea
          className={styles.composerTextarea}
          value={value}
          onChange={(event) => {
            onChange(event.target.value);
            onTyping();
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              onSend();
            }
          }}
          placeholder={disabled ? "Сначала выбери чат" : "Сообщение"}
          disabled={disabled || busy}
          maxLength={4000}
        />
        <button
          type="button"
          className={styles.sendButton}
          onClick={onSend}
          disabled={disabled || busy || (!value.trim() && !files.length)}
        >
          {busy ? "Загрузка…" : "Отправить"}
        </button>
      </div>
      <span className={styles.composerHint}>Enter — отправить · Shift+Enter — новая строка · файл до 15 МБ</span>
    </div>
  );
}
