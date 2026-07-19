"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { buildChatWsUrl } from "@/lib/chat-api";
import ChatComposer from "./ChatComposer";
import ChatMessageList from "./ChatMessageList";
import ChatModerationDrawer from "./ChatModerationDrawer";
import type {
  ChatChannel,
  ChatGroup,
  ChatMessage,
  ChatUser,
  ModerationState,
  PresenceMember,
} from "./chat-types";
import styles from "./ChatMvpClient.module.css";

type ChatSessionPayload = {
  session: { user: ChatUser };
  sessionToken: string;
  origin: string;
};

type ModerationInput = {
  action: "ban" | "unban" | "kick" | "mute" | "unmute";
  targetUserId: number;
  durationSeconds?: number;
  reason?: string;
};

const MAX_ATTACHMENT_BYTES = 15 * 1024 * 1024;

const ERROR_MESSAGES: Record<string, string> = {
  chat_admin_required: "Это действие доступно только администратору.",
  chat_antispam_muted: "Антиспам временно ограничил отправку сообщений.",
  chat_attachment_create_failed: "Не удалось подготовить загрузку файла.",
  chat_attachment_size_mismatch: "Размер загруженного файла не совпал с заявленным.",
  chat_attachment_too_large: "Размер каждого файла не должен превышать 15 МБ.",
  chat_attachment_type_unsupported: "Разрешены только изображения и видео.",
  chat_banned: "Доступ к этому чату ограничен администратором.",
  chat_muted: "Отправка сообщений временно ограничена.",
  chat_socket_error: "Связь с чатом прервана.",
  message_body_required: "Добавь текст, изображение или видео.",
};

function readableError(value: unknown, fallback = "Не удалось выполнить действие.") {
  const code = value instanceof Error ? value.message : String(value || "");
  return ERROR_MESSAGES[code] || code || fallback;
}

function dedupeMembers(members: PresenceMember[]) {
  const seen = new Set<string>();
  return members.filter((member) => {
    const key = String(member.user?.id || member.clientId || "").trim();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function readJson(response: Response) {
  const payload = await response.json().catch(() => null);
  if (!response.ok) throw new Error(payload?.error || `chat_http_${response.status}`);
  return payload;
}

async function fetchModerationState(groupId: number) {
  return await readJson(
    await fetch(`/api/chat/moderation?groupId=${groupId}`, { cache: "no-store" }),
  ) as ModerationState;
}

export default function ChatMvpClient() {
  const wsRef = useRef<WebSocket | null>(null);
  const typingTimerRef = useRef<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const selectedGroupIdRef = useRef(0);
  const selectedChannelIdRef = useRef(0);

  const [session, setSession] = useState<ChatSessionPayload | null>(null);
  const [groups, setGroups] = useState<ChatGroup[]>([]);
  const [channels, setChannels] = useState<ChatChannel[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [presenceMembers, setPresenceMembers] = useState<PresenceMember[]>([]);
  const [moderationState, setModerationState] = useState<ModerationState | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState(0);
  const [selectedChannelId, setSelectedChannelId] = useState(0);
  const [joinedChannelId, setJoinedChannelId] = useState(0);
  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const [messageBody, setMessageBody] = useState("");
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [typingText, setTypingText] = useState("");
  const [errorText, setErrorText] = useState("");
  const [privateNotice, setPrivateNotice] = useState("");
  const [statusText, setStatusText] = useState("Подключаем чат…");
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [isModerationOpen, setIsModerationOpen] = useState(false);
  const [isSocketReady, setIsSocketReady] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isModerating, setIsModerating] = useState(false);

  const currentUserId = Number(session?.session.user.id || 0);
  const isAdmin = Boolean(
    session?.session.user.roles?.some((role) => String(role).toLowerCase() === "admin"),
  );
  const selectedGroup = useMemo(
    () => groups.find((group) => group.id === selectedGroupId) || null,
    [groups, selectedGroupId],
  );
  const selectedChannel = useMemo(
    () => channels.find((channel) => channel.id === selectedChannelId) || null,
    [channels, selectedChannelId],
  );
  const generalGroup = useMemo(() => groups.find((group) => group.slug === "general"), [groups]);
  const customGroups = useMemo(() => groups.filter((group) => group.slug !== "general"), [groups]);
  const activeMembers = useMemo(() => dedupeMembers(presenceMembers), [presenceMembers]);
  const activeChatTitle = selectedGroup?.slug === "general" || !selectedGroup
    ? "Общий чат"
    : selectedGroup.name;

  async function loadSession() {
    const payload = await readJson(await fetch("/api/chat/session", { cache: "no-store" }));
    setSession(payload);
    return payload as ChatSessionPayload;
  }

  async function loadGroups() {
    const payload = await readJson(await fetch("/api/chat/groups", { cache: "no-store" }));
    const nextGroups = Array.isArray(payload?.groups) ? payload.groups : [];
    setGroups(nextGroups);
    setSelectedGroupId((current) => {
      if (current && nextGroups.some((group: ChatGroup) => group.id === current)) return current;
      return nextGroups.find((group: ChatGroup) => group.slug === "general")?.id || nextGroups[0]?.id || 0;
    });
    return nextGroups;
  }

  async function loadChannels(groupId: number) {
    if (!groupId) {
      setChannels([]);
      setSelectedChannelId(0);
      return;
    }
    const payload = await readJson(
      await fetch(`/api/chat/channels?groupId=${groupId}`, { cache: "no-store" }),
    );
    const nextChannels = Array.isArray(payload?.channels) ? payload.channels : [];
    setChannels(nextChannels);
    setSelectedChannelId((current) => {
      if (current && nextChannels.some((channel: ChatChannel) => channel.id === current)) return current;
      return nextChannels.find((channel: ChatChannel) => channel.slug === "general")?.id || nextChannels[0]?.id || 0;
    });
  }

  async function loadMessages(channelId: number) {
    if (!channelId) {
      setMessages([]);
      return;
    }
    const payload = await readJson(
      await fetch(`/api/chat/messages?channelId=${channelId}&limit=80`, { cache: "no-store" }),
    );
    setMessages(Array.isArray(payload?.messages) ? payload.messages : []);
  }

  async function loadModerationState(groupId = selectedGroupId) {
    if (!isAdmin || !groupId) return;
    try {
      setModerationState(await fetchModerationState(groupId));
    } catch (error) {
      setErrorText(readableError(error, "Не удалось загрузить модерацию."));
    }
  }

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const loadedSession = await loadSession();
        if (cancelled) return;
        await loadGroups();
        if (!cancelled) setStatusText(`online · ${loadedSession.session.user.displayName || "user"}`);
      } catch (error) {
        if (!cancelled) {
          setErrorText(readableError(error, "Не удалось открыть чат."));
          setStatusText("offline");
        }
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    selectedGroupIdRef.current = selectedGroupId;
    void loadChannels(selectedGroupId).catch((error) => setErrorText(readableError(error)));
  }, [selectedGroupId]);

  useEffect(() => {
    void loadMessages(selectedChannelId).catch((error) => setErrorText(readableError(error)));
  }, [selectedChannelId]);

  useEffect(() => {
    selectedChannelIdRef.current = selectedChannelId;
    setPresenceMembers([]);
    setTypingText("");
    setJoinedChannelId(0);
  }, [selectedChannelId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ block: "end" });
  }, [messages]);

  useEffect(() => {
    if (!session?.sessionToken || !session.origin) return;
    const ws = new WebSocket(buildChatWsUrl(session.origin, session.sessionToken));
    wsRef.current = ws;

    ws.onopen = () => {
      setIsSocketReady(true);
      setStatusText(`online · ${session.session.user.displayName || "user"}`);
    };
    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(String(event.data || "{}"));
        const currentChannelId = selectedChannelIdRef.current;
        if (payload.type === "channel:join:ack" && Number(payload.channelId) === currentChannelId) {
          setJoinedChannelId(Number(payload.channelId));
        } else if (payload.type === "message:new" && Number(payload.channelId) === currentChannelId) {
          setMessages((current) => current.some((item) => item.id === payload.message?.id)
            ? current
            : [...current, payload.message]);
        } else if (payload.type === "message:deleted" && Number(payload.channelId) === currentChannelId) {
          setMessages((current) => current.filter((item) => item.id !== Number(payload.messageId)));
        } else if (payload.type === "presence:update" && Number(payload.channelId) === currentChannelId) {
          setPresenceMembers(Array.isArray(payload.members) ? payload.members : []);
        } else if (payload.type === "typing:start" && Number(payload.channelId) === currentChannelId) {
          setTypingText(`${payload.user?.displayName || "Кто-то"} печатает…`);
        } else if (payload.type === "typing:stop" && Number(payload.channelId) === currentChannelId) {
          setTypingText("");
        } else if (payload.type === "moderation:muted") {
          const expiresAt = payload.mute?.expiresAt
            ? ` До ${new Date(payload.mute.expiresAt).toLocaleTimeString("ru-RU")}.`
            : "";
          setPrivateNotice(`${payload.warning || "Отправка сообщений временно ограничена."}${expiresAt}`);
          setIsSending(false);
        } else if (payload.type === "moderation:unmuted") {
          setPrivateNotice("Мут снят. Можно снова отправлять сообщения.");
        } else if (payload.type === "moderation:removed") {
          setPrivateNotice(payload.action === "ban" ? "Администратор заблокировал доступ к чату." : "Администратор исключил тебя из чата.");
          void loadGroups();
        } else if (payload.type === "moderation:update" || payload.type === "moderation:ack") {
          setIsModerating(false);
          if (isAdmin && selectedGroupIdRef.current) {
            void fetchModerationState(selectedGroupIdRef.current).then(setModerationState);
          }
        } else if (payload.type === "error") {
          setErrorText(readableError(payload.error));
          setIsSending(false);
          setIsModerating(false);
        }
      } catch {
        setErrorText("Получен повреждённый ответ чата.");
      }
    };
    ws.onerror = () => setErrorText(ERROR_MESSAGES.chat_socket_error);
    ws.onclose = () => {
      setIsSocketReady(false);
      setJoinedChannelId(0);
      setStatusText("offline");
    };

    return () => {
      if (typingTimerRef.current) window.clearTimeout(typingTimerRef.current);
      ws.close();
      wsRef.current = null;
    };
  }, [session?.origin, session?.session.user.displayName, session?.sessionToken, isAdmin]);

  useEffect(() => {
    const ws = wsRef.current;
    if (!ws || !isSocketReady || ws.readyState !== WebSocket.OPEN || !selectedChannelId) return;
    ws.send(JSON.stringify({ type: "channel:join", channelId: String(selectedChannelId) }));
    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "channel:leave", channelId: String(selectedChannelId) }));
      }
    };
  }, [isSocketReady, selectedChannelId]);

  function emitTyping() {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN || !selectedChannelId) return;
    ws.send(JSON.stringify({ type: "typing:start", channelId: String(selectedChannelId) }));
    if (typingTimerRef.current) window.clearTimeout(typingTimerRef.current);
    typingTimerRef.current = window.setTimeout(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "typing:stop", channelId: String(selectedChannelId) }));
      }
    }, 1200);
  }

  async function uploadAttachments(files: File[]) {
    const invalidFile = files.find((file) => file.size <= 0 || file.size > MAX_ATTACHMENT_BYTES);
    if (invalidFile) throw new Error("chat_attachment_too_large");

    return await Promise.all(files.map(async (file) => {
      const prepared = await readJson(await fetch("/api/chat/attachments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channelId: selectedChannelId,
          fileName: file.name,
          mimeType: file.type,
          sizeBytes: file.size,
        }),
      }));
      const uploadResponse = await fetch(prepared.upload.url, {
        method: prepared.upload.method || "PUT",
        headers: prepared.upload.headers || { "Content-Type": file.type },
        body: file,
      });
      if (!uploadResponse.ok) throw new Error(`chat_media_upload_${uploadResponse.status}`);
      return Number(prepared.attachment.id);
    }));
  }

  async function handleSendMessage() {
    const body = messageBody.trim();
    if ((!body && !pendingFiles.length) || !selectedChannelId || isSending) return;
    setErrorText("");
    setPrivateNotice("");
    setIsSending(true);
    try {
      const attachmentIds = await uploadAttachments(pendingFiles);
      const input = { channelId: selectedChannelId, body, attachmentIds };
      const ws = wsRef.current;
      if (ws && ws.readyState === WebSocket.OPEN && joinedChannelId === selectedChannelId) {
        ws.send(JSON.stringify({ type: "message:new", ...input }));
      } else {
        await readJson(await fetch("/api/chat/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input),
        }));
        await loadMessages(selectedChannelId);
      }
      setMessageBody("");
      setPendingFiles([]);
      setTypingText("");
    } catch (error) {
      setErrorText(readableError(error, "Не удалось отправить сообщение."));
    } finally {
      setIsSending(false);
    }
  }

  async function handleDeleteMessage(message: ChatMessage) {
    if (!window.confirm("Удалить сообщение? Оно сразу исчезнет из чата.")) return;
    setErrorText("");
    try {
      const ws = wsRef.current;
      if (ws && ws.readyState === WebSocket.OPEN && joinedChannelId === selectedChannelId) {
        ws.send(JSON.stringify({
          type: "message:delete",
          channelId: String(selectedChannelId),
          messageId: message.id,
          reason: isAdmin && Number(message.authorUserId) !== currentUserId ? "Удалено администратором" : "Удалено автором",
        }));
      } else {
        await readJson(await fetch("/api/chat/messages", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messageId: message.id }),
        }));
        setMessages((current) => current.filter((item) => item.id !== message.id));
      }
    } catch (error) {
      setErrorText(readableError(error, "Не удалось удалить сообщение."));
    }
  }

  async function handleModerationAction(input: ModerationInput) {
    if (!selectedGroupId || isModerating) return;
    setIsModerating(true);
    setErrorText("");
    const event = { type: "moderation:action", groupId: selectedGroupId, ...input };
    try {
      const ws = wsRef.current;
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(event));
      } else {
        await readJson(await fetch("/api/chat/moderation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(event),
        }));
        await loadModerationState();
        setIsModerating(false);
      }
    } catch (error) {
      setErrorText(readableError(error, "Не удалось применить действие."));
      setIsModerating(false);
    }
  }

  async function handleCreateGroup() {
    try {
      const payload = await readJson(await fetch("/api/chat/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: groupName, description: groupDescription }),
      }));
      setGroupName("");
      setGroupDescription("");
      setIsCreateGroupOpen(false);
      await loadGroups();
      if (payload?.group?.id) setSelectedGroupId(payload.group.id);
    } catch (error) {
      setErrorText(readableError(error, "Не удалось создать группу."));
    }
  }

  return (
    <div className={styles.shell}>
      {errorText ? (
        <div className={styles.noticeError} role="alert">
          <span>{errorText}</span>
          <button type="button" onClick={() => setErrorText("")} aria-label="Закрыть">×</button>
        </div>
      ) : null}
      {privateNotice ? (
        <div className={styles.noticePrivate} role="status">
          <span>{privateNotice}</span>
          <button type="button" onClick={() => setPrivateNotice("")} aria-label="Закрыть">×</button>
        </div>
      ) : null}

      <section className={styles.chatCard}>
        <header className={styles.chatHead}>
          <div className={styles.chatMain}>
            <div className={styles.chatTopline}>
              <span className={styles.statusDot} />
              <span className={styles.statusText}>{statusText}</span>
            </div>
            <h2 className={styles.chatTitle}>{activeChatTitle}</h2>
            <div className={styles.chatSubline}>
              <span>{selectedGroup?.slug === "general" ? "Все пользователи" : "Группа"}</span>
              <span>{activeMembers.length} онлайн</span>
            </div>
          </div>
          <div className={styles.actions}>
            {isAdmin ? (
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={() => {
                  setIsModerationOpen(true);
                  void loadModerationState();
                }}
              >
                Модерация
              </button>
            ) : null}
            <button
              type="button"
              className={styles.iconButton}
              onClick={() => setIsCreateGroupOpen(true)}
              aria-label="Создать группу"
              title="Создать группу"
            >
              +
            </button>
          </div>
        </header>

        <div className={styles.layout}>
          <aside className={styles.sidebar}>
            <div className={styles.sidebarLabel}>Чаты</div>
            <div className={styles.sidebarList}>
              {generalGroup ? (
                <button
                  type="button"
                  className={`${styles.listButton} ${selectedGroupId === generalGroup.id ? styles.listButtonActive : ""}`.trim()}
                  onClick={() => setSelectedGroupId(generalGroup.id)}
                >
                  <span className={styles.listTitle}>Общий чат</span>
                  <span className={styles.listMeta}>Для всех пользователей</span>
                </button>
              ) : null}
              {customGroups.map((group) => (
                <button
                  key={group.id}
                  type="button"
                  className={`${styles.listButton} ${selectedGroupId === group.id ? styles.listButtonActive : ""}`.trim()}
                  onClick={() => setSelectedGroupId(group.id)}
                >
                  <span className={styles.listTitle}>{group.name}</span>
                  <span className={styles.listMeta}>{group.description || "Групповой чат"}</span>
                </button>
              ))}
            </div>
          </aside>

          <div className={styles.chatColumn}>
            {channels.length > 1 ? (
              <div className={styles.channelStrip}>
                {channels.map((channel) => (
                  <button
                    key={channel.id}
                    type="button"
                    className={`${styles.channelChip} ${selectedChannelId === channel.id ? styles.channelChipActive : ""}`.trim()}
                    onClick={() => setSelectedChannelId(channel.id)}
                  >
                    {channel.name}
                  </button>
                ))}
              </div>
            ) : null}
            <ChatMessageList
              messages={messages}
              currentUserId={currentUserId}
              isAdmin={isAdmin}
              hasChannel={Boolean(selectedChannel)}
              endRef={messagesEndRef}
              onDelete={handleDeleteMessage}
            />
            {typingText ? <div className={styles.typing}>{typingText}</div> : null}
            <ChatComposer
              value={messageBody}
              files={pendingFiles}
              disabled={!selectedChannel}
              busy={isSending}
              onChange={setMessageBody}
              onFilesChange={setPendingFiles}
              onSend={() => void handleSendMessage()}
              onTyping={emitTyping}
            />
          </div>

          <aside className={styles.members}>
            <div className={styles.sidebarLabel}>Сейчас в чате</div>
            <div className={styles.memberList}>
              {activeMembers.map((member) => (
                <div key={member.user?.id || member.clientId} className={styles.memberCard}>
                  <span className={styles.memberDot} />
                  <span className={styles.memberName}>
                    {member.user?.displayName || `user #${member.user?.id || member.clientId}`}
                  </span>
                </div>
              ))}
              {!activeMembers.length ? <div className={styles.sidebarEmpty}>Никого не видно.</div> : null}
            </div>
          </aside>
        </div>
      </section>

      {isCreateGroupOpen ? (
        <div className={styles.overlay} onClick={() => setIsCreateGroupOpen(false)}>
          <div className={styles.modal} onClick={(event) => event.stopPropagation()}>
            <div className={styles.panelHead}>
              <h3 className={styles.panelTitle}>Новая группа</h3>
              <button type="button" className={styles.panelClose} onClick={() => setIsCreateGroupOpen(false)}>×</button>
            </div>
            <div className={styles.formStack}>
              <input className={styles.input} value={groupName} onChange={(event) => setGroupName(event.target.value)} placeholder="Название" />
              <textarea className={styles.textarea} value={groupDescription} onChange={(event) => setGroupDescription(event.target.value)} placeholder="Описание" />
              <button type="button" className={styles.primaryButton} onClick={() => void handleCreateGroup()}>Создать группу</button>
            </div>
          </div>
        </div>
      ) : null}

      {isModerationOpen ? (
        <ChatModerationDrawer
          state={moderationState}
          currentUserId={currentUserId}
          busy={isModerating}
          onClose={() => setIsModerationOpen(false)}
          onReload={() => void loadModerationState()}
          onAction={(input) => void handleModerationAction(input)}
        />
      ) : null}
    </div>
  );
}
