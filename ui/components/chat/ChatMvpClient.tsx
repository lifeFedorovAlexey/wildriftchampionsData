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

type PresenceMember = {
  clientId: string;
  user?: {
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

function dedupeMembers(members: PresenceMember[]) {
  const seen = new Set<string>();
  const nextMembers: PresenceMember[] = [];

  for (const member of members) {
    const key = String(member?.user?.id || member?.clientId || "").trim();
    if (!key || seen.has(key)) {
      continue;
    }
    seen.add(key);
    nextMembers.push(member);
  }

  return nextMembers;
}

export default function ChatMvpClient() {
  const wsRef = useRef<WebSocket | null>(null);
  const typingTimerRef = useRef<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

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
  const [presenceMembers, setPresenceMembers] = useState<PresenceMember[]>([]);
  const [typingText, setTypingText] = useState("");
  const [errorText, setErrorText] = useState("");
  const [statusText, setStatusText] = useState("Подключаем чат...");
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [isSocketReady, setIsSocketReady] = useState(false);
  const [joinedChannelId, setJoinedChannelId] = useState<number>(0);

  const selectedGroup = useMemo(
    () => groups.find((group) => group.id === selectedGroupId) || null,
    [groups, selectedGroupId],
  );

  const selectedChannel = useMemo(
    () => channels.find((channel) => channel.id === selectedChannelId) || null,
    [channels, selectedChannelId],
  );

  const generalGroup = useMemo(
    () => groups.find((group) => group.slug === "general") || null,
    [groups],
  );

  const customGroups = useMemo(
    () => groups.filter((group) => group.slug !== "general"),
    [groups],
  );

  const activeChatTitle = useMemo(() => {
    if (selectedGroup?.slug === "general" || !selectedGroup) {
      return "Общий чат";
    }
    return selectedGroup.name;
  }, [selectedGroup]);

  const activeChatMeta = useMemo(() => {
    if (selectedGroup?.slug === "general" || !selectedGroup) {
      return "Все пользователи";
    }
    return "Группа";
  }, [selectedGroup]);

  const activeMembers = useMemo(
    () => dedupeMembers(presenceMembers),
    [presenceMembers],
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
      return nextGroups.find((group: ChatGroup) => group.slug === "general")?.id || nextGroups[0]?.id || 0;
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
      return nextChannels.find((channel: ChatChannel) => channel.slug === "general")?.id || nextChannels[0]?.id || 0;
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
        setStatusText(`online · ${loadedSession.session.user.displayName || "user"}`);
      } catch (error) {
        if (!cancelled) {
          setErrorText(error instanceof Error ? error.message : "chat_bootstrap_failed");
          setStatusText("offline");
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
    setPresenceMembers([]);
    setPresenceText("");
    setTypingText("");
    setJoinedChannelId(0);
  }, [selectedChannelId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ block: "end" });
  }, [messages]);

  useEffect(() => {
    if (!session?.sessionToken || !session.origin) {
      return undefined;
    }

    const ws = new WebSocket(buildChatWsUrl(session.origin, session.sessionToken));
    wsRef.current = ws;
    setIsSocketReady(false);

    ws.onopen = () => {
      setIsSocketReady(true);
      setStatusText(`online · ${session.session.user.displayName || "user"}`);
    };

    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(String(event.data || "{}"));

        if (payload.type === "session:ready") {
          return;
        }

        if (payload.type === "channel:join:ack" && Number(payload.channelId) === selectedChannelId) {
          setJoinedChannelId(Number(payload.channelId));
          return;
        }

        if (payload.type === "message:new" && Number(payload.channelId) === selectedChannelId) {
          setMessages((current) => {
            if (current.some((message) => message.id === payload.message?.id)) {
              return current;
            }
            return [...current, payload.message];
          });
          return;
        }

        if (payload.type === "presence:update" && Number(payload.channelId) === selectedChannelId) {
          setPresenceText(`${payload.membersCount || 0} online`);
          setPresenceMembers(Array.isArray(payload.members) ? payload.members : []);
          return;
        }

        if (payload.type === "typing:start" && Number(payload.channelId) === selectedChannelId) {
          setTypingText(`${payload.user?.displayName || "Кто-то"} печатает...`);
          return;
        }

        if (payload.type === "typing:stop" && Number(payload.channelId) === selectedChannelId) {
          setTypingText("");
          return;
        }

        if (payload.type === "error") {
          setErrorText(payload.error || "chat_socket_error");
        }
      } catch {
        setErrorText("chat_socket_message_invalid");
      }
    };

    ws.onerror = () => {
      setErrorText("chat_socket_error");
    };

    ws.onclose = () => {
      setIsSocketReady(false);
      setJoinedChannelId(0);
      setStatusText("offline");
    };

    return () => {
      if (typingTimerRef.current) {
        window.clearTimeout(typingTimerRef.current);
      }
      ws.close();
      wsRef.current = null;
      setIsSocketReady(false);
    };
  }, [session?.origin, session?.sessionToken, session?.session.user.displayName, selectedChannelId]);

  useEffect(() => {
    const ws = wsRef.current;
    if (!ws || !isSocketReady || !selectedChannelId) {
      return undefined;
    }

    ws.send(JSON.stringify({ type: "channel:join", channelId: String(selectedChannelId) }));

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "channel:leave", channelId: String(selectedChannelId) }));
      }
    };
  }, [isSocketReady, selectedChannelId]);

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
      setIsCreateGroupOpen(false);
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
    const body = messageBody.trim();
    if (!body || !selectedChannelId) {
      return;
    }

    setErrorText("");

    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN && joinedChannelId === selectedChannelId) {
      ws.send(
        JSON.stringify({
          type: "message:new",
          channelId: String(selectedChannelId),
          body,
        }),
      );
      setMessageBody("");
      setTypingText("");
      return;
    }

    try {
      const response = await fetch("/api/chat/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          channelId: selectedChannelId,
          body,
        }),
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error || "chat_message_create_failed");
      }

      setMessageBody("");
      setTypingText("");
      await loadMessages(selectedChannelId);
    } catch (error) {
      setErrorText(error instanceof Error ? error.message : "chat_message_create_failed");
    }
  }

  return (
    <div className={styles.shell}>
      {errorText ? <div className={styles.noticeError}>{errorText}</div> : null}

      <section className={styles.chatCard}>
        <header className={styles.chatHead}>
          <div className={styles.chatMain}>
            <div className={styles.chatTopline}>
              <span className={styles.statusDot} />
              <span className={styles.statusText}>{statusText}</span>
            </div>
            <h2 className={styles.chatTitle}>{activeChatTitle}</h2>
            <div className={styles.chatSubline}>
              <span>{activeChatMeta}</span>
              {presenceText ? <span>{presenceText}</span> : null}
            </div>
          </div>

          <div className={styles.actions}>
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
            <div className={styles.sidebarSection}>
              <div className={styles.sidebarLabel}>Чаты</div>
              <div className={styles.sidebarList}>
                {generalGroup ? (
                  <button
                    key={generalGroup.id}
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
                {!generalGroup && !customGroups.length ? (
                  <div className={styles.sidebarEmpty}>Чаты появятся автоматически после входа.</div>
                ) : null}
              </div>
            </div>
          </aside>

          <div className={styles.chatColumn}>
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
              {!messages.length ? (
                <div className={styles.emptyState}>
                  {selectedChannel ? "Пока пусто. Напиши первым." : "Чат ещё не выбран."}
                </div>
              ) : null}
              <div ref={messagesEndRef} />
            </div>

            {typingText ? <div className={styles.typing}>{typingText}</div> : null}

            <div className={styles.composer}>
              <textarea
                className={styles.textarea}
                value={messageBody}
                onChange={(event) => {
                  setMessageBody(event.target.value);
                  emitTyping();
                }}
                placeholder={selectedChannel ? `Сообщение в ${activeChatTitle.toLowerCase()}` : "Сначала выбери чат"}
                disabled={!selectedChannel}
              />
              <button type="button" className={styles.sendButton} onClick={handleSendMessage}>
                Отправить
              </button>
            </div>
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
              {!activeMembers.length ? (
                <div className={styles.sidebarEmpty}>Пока никого не видно. Список обновится после входа в канал.</div>
              ) : null}
            </div>
          </aside>
        </div>
      </section>

      {isCreateGroupOpen ? (
        <div className={styles.overlay} onClick={() => setIsCreateGroupOpen(false)}>
          <div className={styles.modal} onClick={(event) => event.stopPropagation()}>
            <div className={styles.panelHead}>
              <h3 className={styles.panelTitle}>Новая группа</h3>
              <button
                type="button"
                className={styles.panelClose}
                onClick={() => setIsCreateGroupOpen(false)}
              >
                x
              </button>
            </div>

            <div className={styles.formStack}>
              <input
                className={styles.input}
                value={groupName}
                onChange={(event) => setGroupName(event.target.value)}
                placeholder="Название"
              />
              <textarea
                className={styles.textarea}
                value={groupDescription}
                onChange={(event) => setGroupDescription(event.target.value)}
                placeholder="Описание"
              />
              <button type="button" className={styles.primaryButton} onClick={handleCreateGroup}>
                Создать группу
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
