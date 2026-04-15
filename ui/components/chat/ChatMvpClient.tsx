"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { buildChatWsUrl } from "@/lib/chat-api";
import styles from "./ChatMvpClient.module.css";

type ChatGroup = {
  id: number;
  slug: string;
  name: string;
  description?: string | null;
};

type ChatChannel = {
  id: number;
  groupId: number;
  slug: string;
  name: string;
  kind: string;
  position: number;
};

type ChatMessage = {
  id: number;
  channelId: number;
  authorUserId: number;
  body: string;
  createdAt: string;
  author?: {
    id: string;
    displayName?: string;
  };
};

type ChatSessionPayload = {
  session: {
    user: {
      id: string;
      displayName?: string;
    };
  };
  sessionToken: string;
  origin: string;
};

function formatTime(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ChatMvpClient() {
  const wsRef = useRef<WebSocket | null>(null);
  const typingTimerRef = useRef<number | null>(null);

  const [session, setSession] = useState<ChatSessionPayload | null>(null);
  const [groups, setGroups] = useState<ChatGroup[]>([]);
  const [channels, setChannels] = useState<ChatChannel[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<number>(0);
  const [selectedChannelId, setSelectedChannelId] = useState<number>(0);
  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const [messageBody, setMessageBody] = useState("");
  const [presenceText, setPresenceText] = useState("");
  const [typingText, setTypingText] = useState("");
  const [errorText, setErrorText] = useState("");
  const [statusText, setStatusText] = useState("Подключаем чат...");

  const selectedChannel = useMemo(
    () => channels.find((channel) => channel.id === selectedChannelId) || null,
    [channels, selectedChannelId],
  );

  async function loadSession() {
    const response = await fetch("/api/chat/session", { cache: "no-store" });
    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(payload?.error || "chat_session_load_failed");
    }
    setSession(payload);
    return payload as ChatSessionPayload;
  }

  async function loadGroups() {
    const response = await fetch("/api/chat/groups", { cache: "no-store" });
    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(payload?.error || "chat_groups_load_failed");
    }

    const nextGroups = Array.isArray(payload?.groups) ? payload.groups : [];
    setGroups(nextGroups);
    setSelectedGroupId((current) => {
      if (current && nextGroups.some((group: ChatGroup) => group.id === current)) {
        return current;
      }
      return nextGroups[0]?.id || 0;
    });
    return nextGroups;
  }

  async function loadChannels(groupId: number) {
    if (!groupId) {
      setChannels([]);
      setSelectedChannelId(0);
      return [];
    }

    const response = await fetch(`/api/chat/channels?groupId=${groupId}`, {
      cache: "no-store",
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(payload?.error || "chat_channels_load_failed");
    }

    const nextChannels = Array.isArray(payload?.channels) ? payload.channels : [];
    setChannels(nextChannels);
    setSelectedChannelId((current) => {
      if (current && nextChannels.some((channel: ChatChannel) => channel.id === current)) {
        return current;
      }
      return nextChannels[0]?.id || 0;
    });
    return nextChannels;
  }

  async function loadMessages(channelId: number) {
    if (!channelId) {
      setMessages([]);
      return [];
    }

    const response = await fetch(`/api/chat/messages?channelId=${channelId}&limit=80`, {
      cache: "no-store",
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(payload?.error || "chat_messages_load_failed");
    }

    const nextMessages = Array.isArray(payload?.messages) ? payload.messages : [];
    setMessages(nextMessages);
    return nextMessages;
  }

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      try {
        setErrorText("");
        const loadedSession = await loadSession();
        if (cancelled) return;
        await loadGroups();
        if (cancelled) return;
        setStatusText(`Чат подключён как ${loadedSession.session.user.displayName || "user"}`);
      } catch (error) {
        if (!cancelled) {
          setErrorText(error instanceof Error ? error.message : "chat_bootstrap_failed");
          setStatusText("Чат не подключён");
        }
      }
    }

    void bootstrap();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    void loadChannels(selectedGroupId).catch((error) => {
      setErrorText(error instanceof Error ? error.message : "chat_channels_load_failed");
    });
  }, [selectedGroupId]);

  useEffect(() => {
    void loadMessages(selectedChannelId).catch((error) => {
      setErrorText(error instanceof Error ? error.message : "chat_messages_load_failed");
    });
  }, [selectedChannelId]);

  useEffect(() => {
    if (!session?.sessionToken || !session.origin) {
      return undefined;
    }

    const ws = new WebSocket(buildChatWsUrl(session.origin, session.sessionToken));
    wsRef.current = ws;

    ws.onopen = () => {
      setStatusText(`Realtime подключён: ${session.session.user.displayName || "user"}`);
    };

    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(String(event.data || "{}"));

        if (payload.type === "message:new" && Number(payload.channelId) === selectedChannelId) {
          setMessages((current) => [...current, payload.message]);
        }

        if (payload.type === "presence:update" && Number(payload.channelId) === selectedChannelId) {
          setPresenceText(`В канале: ${payload.membersCount || 0}`);
        }

        if (payload.type === "typing:start" && Number(payload.channelId) === selectedChannelId) {
          setTypingText(`${payload.user?.displayName || "Кто-то"} печатает...`);
        }

        if (payload.type === "typing:stop" && Number(payload.channelId) === selectedChannelId) {
          setTypingText("");
        }
      } catch {
        setErrorText("chat_socket_message_invalid");
      }
    };

    ws.onerror = () => {
      setErrorText("chat_socket_error");
    };

    ws.onclose = () => {
      setStatusText("Realtime отключён");
    };

    return () => {
      if (typingTimerRef.current) {
        window.clearTimeout(typingTimerRef.current);
      }
      ws.close();
      wsRef.current = null;
    };
  }, [session?.origin, session?.sessionToken, session?.session.user.displayName, selectedChannelId]);

  useEffect(() => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN || !selectedChannelId) {
      return undefined;
    }

    ws.send(JSON.stringify({ type: "channel:join", channelId: String(selectedChannelId) }));

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "channel:leave", channelId: String(selectedChannelId) }));
      }
    };
  }, [selectedChannelId]);

  async function handleCreateGroup() {
    try {
      setErrorText("");
      const response = await fetch("/api/chat/groups", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: groupName,
          description: groupDescription,
        }),
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error || "chat_group_create_failed");
      }

      setGroupName("");
      setGroupDescription("");
      const nextGroups = await loadGroups();
      if (payload?.group?.id) {
        setSelectedGroupId(payload.group.id);
      } else if (nextGroups[0]?.id) {
        setSelectedGroupId(nextGroups[0].id);
      }
    } catch (error) {
      setErrorText(error instanceof Error ? error.message : "chat_group_create_failed");
    }
  }

  function emitTyping() {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN || !selectedChannelId) {
      return;
    }

    ws.send(JSON.stringify({ type: "typing:start", channelId: String(selectedChannelId) }));

    if (typingTimerRef.current) {
      window.clearTimeout(typingTimerRef.current);
    }

    typingTimerRef.current = window.setTimeout(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "typing:stop", channelId: String(selectedChannelId) }));
      }
    }, 1200);
  }

  async function handleSendMessage() {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN || !selectedChannelId) {
      setErrorText("chat_socket_not_ready");
      return;
    }

    const body = messageBody.trim();
    if (!body) {
      return;
    }

    setErrorText("");
    ws.send(
      JSON.stringify({
        type: "message:new",
        channelId: String(selectedChannelId),
        body,
      }),
    );
    setMessageBody("");
    setTypingText("");
  }

  return (
    <div className={styles.shell}>
      <div className={styles.noticeOk}>{statusText}</div>
      {errorText ? <div className={styles.noticeError}>{errorText}</div> : null}

      <div className={styles.grid}>
        <section className={styles.card}>
          <div className={styles.titleRow}>
            <h2 className={styles.cardTitle}>Группы</h2>
          </div>
          <p className={styles.cardCopy}>Минимальный локальный preview текстового чата.</p>

          <div className={styles.formRow}>
            <input
              className={styles.input}
              value={groupName}
              onChange={(event) => setGroupName(event.target.value)}
              placeholder="Название группы"
            />
          </div>
          <div className={styles.formRow}>
            <textarea
              className={styles.textarea}
              value={groupDescription}
              onChange={(event) => setGroupDescription(event.target.value)}
              placeholder="Описание"
            />
          </div>
          <div className={styles.formRow}>
            <button type="button" className={styles.button} onClick={handleCreateGroup}>
              Создать группу
            </button>
          </div>

          <div className={styles.list}>
            {groups.map((group) => (
              <button
                key={group.id}
                type="button"
                className={`${styles.listButton} ${selectedGroupId === group.id ? styles.listButtonActive : ""}`.trim()}
                onClick={() => setSelectedGroupId(group.id)}
              >
                <span className={styles.listTitle}>{group.name}</span>
                <span className={styles.listMeta}>{group.slug}</span>
              </button>
            ))}
            {!groups.length ? <div className={styles.subtle}>Групп пока нет.</div> : null}
          </div>
        </section>

        <section className={styles.card}>
          <div className={styles.columns}>
            <div>
              <h2 className={styles.cardTitle}>Каналы</h2>
              <div className={styles.list}>
                {channels.map((channel) => (
                  <button
                    key={channel.id}
                    type="button"
                    className={`${styles.listButton} ${selectedChannelId === channel.id ? styles.listButtonActive : ""}`.trim()}
                    onClick={() => setSelectedChannelId(channel.id)}
                  >
                    <span className={styles.listTitle}>{channel.name}</span>
                    <span className={styles.listMeta}>{channel.slug}</span>
                  </button>
                ))}
                {!channels.length ? <div className={styles.subtle}>Нет каналов.</div> : null}
              </div>
            </div>

            <div>
              <h2 className={styles.cardTitle}>Сообщения</h2>
              {selectedChannel ? (
                <p className={styles.cardCopy}>
                  Канал: {selectedChannel.name} · slug: {selectedChannel.slug}
                </p>
              ) : (
                <p className={styles.cardCopy}>Выбери канал.</p>
              )}
              {presenceText ? <div className={styles.presence}>{presenceText}</div> : null}
              {typingText ? <div className={styles.typing}>{typingText}</div> : null}
            </div>
          </div>

          <div className={styles.messages}>
            {messages.map((message) => (
              <article key={`${message.id}-${message.createdAt}`} className={styles.messageCard}>
                <div className={styles.messageHead}>
                  <span className={styles.messageAuthor}>
                    {message.author?.displayName || `user #${message.authorUserId}`}
                  </span>
                  <span className={styles.messageTime}>{formatTime(message.createdAt)}</span>
                </div>
                <p className={styles.messageBody}>{message.body}</p>
              </article>
            ))}
            {!messages.length ? <div className={styles.subtle}>Сообщений пока нет.</div> : null}
          </div>

          <div className={styles.formRow}>
            <textarea
              className={styles.textarea}
              value={messageBody}
              onChange={(event) => {
                setMessageBody(event.target.value);
                emitTyping();
              }}
              placeholder="Напиши сообщение"
            />
          </div>
          <div className={styles.formRow}>
            <button type="button" className={styles.buttonGhost} onClick={handleSendMessage}>
              Отправить
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
