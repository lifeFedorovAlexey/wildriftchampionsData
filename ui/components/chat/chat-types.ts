export type ChatUser = {
  id: number | string;
  displayName?: string;
  avatarUrl?: string;
  roles?: string[];
};

export type ChatGroup = {
  id: number;
  slug: string;
  name: string;
  description?: string | null;
  membershipRole?: string;
};

export type ChatChannel = {
  id: number;
  groupId: number;
  slug: string;
  name: string;
  kind: string;
  position: number;
};

export type ChatAttachment = {
  id: number;
  fileName: string;
  mimeType: string;
  mediaKind: "image" | "video";
  sizeBytes: number;
  url?: string | null;
  expiresAt?: string;
};

export type ChatMessage = {
  id: number;
  channelId: number;
  authorUserId: number;
  body: string;
  createdAt: string;
  author?: ChatUser;
  attachments?: ChatAttachment[];
};

export type PresenceMember = {
  clientId: string;
  user?: ChatUser;
};

export type ChatMute = {
  id: number;
  groupId: number;
  userId: number;
  source: string;
  reason?: string | null;
  startsAt: string;
  expiresAt: string;
};

export type ModerationState = {
  members: Array<{
    user: ChatUser;
    membershipRole: string;
    joinedAt: string;
  }>;
  bans: Array<{
    groupId: number;
    userId: number;
    reason?: string | null;
    createdAt: string;
    user: ChatUser;
  }>;
  mutes: ChatMute[];
  recentActions: Array<{
    id: number;
    action: string;
    actorUserId?: number | null;
    targetUserId?: number | null;
    reason?: string | null;
    durationSeconds?: number | null;
    createdAt: string;
  }>;
};
