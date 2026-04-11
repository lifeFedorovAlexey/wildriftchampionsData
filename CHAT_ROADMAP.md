# wr-chat Roadmap

## Goal

Launch one additional service on a separate server for:

- realtime text chat
- group creation and membership
- invitations, kick, owner controls
- audio-room signalling on the same host later

`wr-api` stays the source of truth for users, groups, roles, permissions, and message history.

## Architecture Boundary

### `wr-api`

- auth and user identity
- group/business data storage
- group membership and bans
- message persistence
- access rules and moderation rules
- server-to-server token issuing for `wr-chat`

### `wr-chat`

- websocket connections
- realtime delivery
- presence / typing / room membership
- ephemeral room state
- later: audio-room signalling on the same host

## Hard Execution Plan

### Phase 0. Stable release checkpoint

- create stable release branches
- bump version to `1.2.3`
- push `main` and `release/1.2.3`

### Phase 1. Service scaffold and deployment contour

- create `wr-chat/`
- add minimal HTTP service with `/health`
- add env contract for chat host, upstream API, shared secret
- add separate GitHub Actions pipeline
- add separate Timeweb deploy workflow for the second server

Deliverable:

- new deployable service on separate host
- health endpoint reachable
- isolated CI/CD path

### Phase 2. Chat data model in `wr-api`

- add chat tables:
  - `chat_groups`
  - `chat_group_members`
  - `chat_group_invites`
  - `chat_group_bans`
  - `chat_channels`
  - `chat_messages`
  - `chat_message_reads`
- add setup script for chat schema
- add owner/member role rules

Deliverable:

- persistent schema for groups and text chat

### Phase 3. Auth handoff between `wr-api` and `wr-chat`

- server-to-server signed token issuing in `wr-api`
- short-lived chat session exchange
- `wr-chat` verifies trusted token and opens socket session

Deliverable:

- authenticated chat connection without duplicating auth logic

### Phase 4. Text chat MVP

- create group
- invite user
- join/leave group
- kick member by owner
- create default text channel
- send/list messages
- realtime push over websocket

Deliverable:

- working private group chat

### Phase 5. Presence and quality-of-life

- online/offline
- typing indicators
- unread counters
- reconnect handling
- basic rate limiting

Deliverable:

- stable realtime UX

### Phase 6. Audio-room signalling on same server

- voice room metadata
- join/leave voice room events
- participant state
- mute/deafen state
- bridge to media component hosted on same second server

Deliverable:

- controlled voice-room lifecycle without changing main site infra

### Phase 7. UI rollout

- group directory
- group page
- channel list
- message panel
- member list
- invite flow
- voice-room controls

Deliverable:

- end-user accessible chat + voice surface

## Delivery Rules

- no extra server beyond one dedicated chat/voice host
- `wr-api` remains the persistent data owner
- `wr-chat` stays stateless as much as possible
- add features phase-by-phase; no big-bang rewrite
