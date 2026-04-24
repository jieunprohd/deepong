# 디퐁 백엔드 기능명세서 (Phase 1)

> **Scope**: Phase 1 뼈대 (Identity + Relationship 기본 + Communication Room/Message 기본)
> **검증 목표**: 가입 → 친구 초대 → 수락 → 1:1 방 생성 → 메시지 송수신
> **대상**: 팀 A (Identity/Relationship), 팀 B (Communication)
> **참고 문서**: `deepwork-prd.md`, `deepwork-schema.sql`, `CLAUDE.md`
> **Last updated**: 2026-04-24

---

## 목차

1. [공통 규약](#1-공통-규약)
2. [Identity 컨텍스트](#2-identity-컨텍스트)
3. [Relationship 컨텍스트](#3-relationship-컨텍스트)
4. [Communication 컨텍스트](#4-communication-컨텍스트)
5. [WebSocket Gateway](#5-websocket-gateway)
6. [도메인 이벤트 카탈로그](#6-도메인-이벤트-카탈로그)
7. [에러 코드 사전](#7-에러-코드-사전)
8. [Phase 1 범위 외 (참고)](#8-phase-1-범위-외-참고)

---

## 1. 공통 규약

### 1.1 기본

| 항목 | 값 |
|---|---|
| Base URL (API) | `http://localhost:4000/api/v1` (로컬) |
| Base URL (WS)  | `http://localhost:4000/ws` |
| Content-Type | `application/json; charset=utf-8` |
| 인증 헤더 | `Authorization: Bearer <accessToken>` |
| 시간 표현 | ISO 8601 UTC (예: `2026-04-24T10:15:03.120Z`) |
| 페이지네이션 | cursor 기반 (`cursor`, `limit`, `nextCursor`) |
| 네이밍 | 요청/응답 JSON은 camelCase, DB는 UPPER_SNAKE_CASE (NamingStrategy) |
| ID 노출 | DB는 `BIGINT UNSIGNED`지만 API 응답은 **문자열**로 내려 JS number precision 이슈 방지 (`"id": "142"`) |

### 1.2 성공 응답

- 2xx 상태코드
- 단일 리소스: `{ <resource>: { ... } }`
- 컬렉션: `{ items: [...], nextCursor?: string }`
- 빈 응답 필요 시 204 No Content

### 1.3 에러 응답 포맷

모든 4xx/5xx 응답은 다음 스키마를 따른다.

```json
{
  "error": {
    "code": "INVITATION_EXPIRED",
    "message": "이 초대 링크는 만료되었습니다",
    "details": { "expiresAt": "2026-04-23T00:00:00Z" }
  }
}
```

- `code`: ENUM (에러 코드 사전 참조). 영문 UPPER_SNAKE_CASE.
- `message`: 한국어, 사용자에게 노출 가능한 수준.
- `details`: 선택. 디버그/UX에 쓸 부가 정보.

### 1.4 인증

- **Access Token**: JWT (HS256), TTL **15분**. 페이로드: `{ sub: userId, iat, exp }`
- **Refresh Token**: Opaque UUID, TTL **7일**. DB `REFRESH_TOKEN` 저장, SHA-256 해시.
- 리프레시 시 **회전(rotation)** — 기존 토큰은 즉시 REVOKE, 새 토큰 발급.
- 로그아웃 시 refresh token REVOKE + access token은 Redis 블랙리스트 TTL 15분.
- Access Token 실패 → 401, 에러 코드는 `TOKEN_INVALID` / `TOKEN_EXPIRED`.

### 1.5 Rate Limit (Phase 1 참고용)

- 인증 없음 엔드포인트 (signup, login, invite preview): IP 기준 10 req/min
- 나머지: User 기준 120 req/min
- 초과 시 429, 에러 코드 `RATE_LIMITED`

---

## 2. Identity 컨텍스트

### 2.1 POST /auth/signup — 이메일 가입

신규 User 생성 + 기본 WORKSPACE 레코드 생성 + 세션 발급.

**Request**
```json
{
  "email": "oscar@example.com",
  "password": "Passw0rd!",
  "nickname": "Oscar"
}
```

**검증 규칙**
- email: RFC 5322, 소문자로 정규화하여 저장
- password: 최소 8자 + 영문/숫자/특수문자 중 2종 이상
- nickname: 1~50자, trim 후 검증

**처리 로직**
1. 이메일 중복 확인 → `EMAIL_ALREADY_EXISTS` (409)
2. password hash (bcrypt cost 12)
3. HANDLE 자동 생성: `${slug(nickname)}#${random 4chars}` — 충돌 시 재시도 최대 5회
4. USER insert
5. WORKSPACE insert (기본값: 월~금 09:30~18:30, KST)
6. access/refresh 토큰 발급
7. `UserSignedUp` 이벤트 발행

**Response 201**
```json
{
  "user": {
    "id": "142",
    "email": "oscar@example.com",
    "nickname": "Oscar",
    "handle": "oscar#7k3n",
    "avatarUrl": null,
    "createdAt": "2026-04-24T10:15:03.120Z"
  },
  "accessToken": "eyJhbGc...",
  "refreshToken": "rt_01H..."
}
```

**에러**
- 409 `EMAIL_ALREADY_EXISTS`
- 422 `INVALID_PASSWORD`, `INVALID_EMAIL`, `INVALID_NICKNAME`

---

### 2.2 POST /auth/login — 이메일 로그인

**Request**
```json
{ "email": "oscar@example.com", "password": "Passw0rd!" }
```

**처리 로직**
1. USER 조회 (소프트 삭제 제외)
2. bcrypt 비교
3. 실패 시 `INVALID_CREDENTIALS` (401) — **이메일 존재 여부를 에러로 구분하지 않는다** (enumeration 방지)
4. 토큰 발급 + `UserLoggedIn` 이벤트

**Response 200**: signup과 동일 구조

**에러**
- 401 `INVALID_CREDENTIALS`
- 429 `RATE_LIMITED`

---

### 2.3 POST /auth/refresh — 토큰 갱신

**Request**
```json
{ "refreshToken": "rt_01H..." }
```

**처리 로직**
1. TOKEN_HASH 조회 → 없거나 `REVOKED_AT IS NOT NULL` 또는 `EXPIRES_AT < NOW()` → `REFRESH_TOKEN_INVALID` (401)
2. 기존 토큰 REVOKE
3. 새 access + refresh 발급 (rotation)

**Response 200**
```json
{ "accessToken": "...", "refreshToken": "..." }
```

**에러**
- 401 `REFRESH_TOKEN_INVALID`

---

### 2.4 POST /auth/logout — 로그아웃

**Request (body 없음, Bearer 필요)**

**처리 로직**
1. Authorization에서 userId 추출
2. 요청 body 또는 헤더의 refreshToken REVOKE
3. 현재 access token을 Redis `session:blacklist:{jti}` 로 TTL 15분 기록

**Response 204**

---

### 2.5 GET /me — 내 정보

**Response 200**
```json
{
  "user": {
    "id": "142",
    "email": "oscar@example.com",
    "nickname": "Oscar",
    "handle": "oscar#7k3n",
    "bio": null,
    "avatarUrl": null,
    "timezone": "Asia/Seoul",
    "locale": "ko-KR"
  },
  "workspace": {
    "workDays": [1, 2, 3, 4, 5],
    "workStartTime": "09:30",
    "workEndTime": "18:30",
    "lunchBreak": true,
    "shareWorktime": true
  }
}
```

---

### 2.6 PATCH /me — 프로필 수정

**Request** (부분 업데이트, 주어진 필드만 변경)
```json
{
  "nickname": "Oscar Choi",
  "bio": "PM @ Lane4",
  "avatarUrl": "https://cdn.../o_142.jpg",
  "timezone": "Asia/Seoul"
}
```

**Response 200**: `{ user: {...} }` (업데이트된 전체)

**에러**
- 422 `INVALID_NICKNAME`, `INVALID_TIMEZONE`

> handle은 변경 불가 (Phase 1). Phase 2에서 `PATCH /me/handle` 별도로.

---

### 2.7 PUT /me/workspace — 업무시간 설정

**Request**
```json
{
  "workDays": [1, 2, 3, 4, 5],
  "workStartTime": "09:30",
  "workEndTime": "18:30",
  "lunchBreak": true,
  "shareWorktime": true
}
```

**검증**
- workDays: 0~6 정수 배열, 중복 없음
- workStartTime < workEndTime

**Response 200**: `{ workspace: {...} }`

**이벤트**: `WorkspaceUpdated` (Phase 2에서 Attention이 구독)

---

## 3. Relationship 컨텍스트

### 3.1 POST /invitations — 초대 토큰 생성

친구 초대 링크 발급. 발급자 인증 필수.

**Request**
```json
{
  "singleUse": true,
  "ttlHours": 24
}
```

- singleUse: true면 MAX_USE_COUNT=1, false면 MAX_USE_COUNT=10 고정 (Phase 1)
- ttlHours: 1~168 (기본 24)

**처리 로직**
1. 32byte 랜덤 토큰 생성 (URL-safe base64)
2. INVITE_TOKEN insert
3. `InvitationCreated` 이벤트

**Response 201**
```json
{
  "invitation": {
    "id": "55",
    "token": "abc123...",
    "inviteUrl": "deepwork://invite?token=abc123...",
    "singleUse": true,
    "expiresAt": "2026-04-25T10:00:00Z"
  }
}
```

- `inviteUrl`은 Electron deep-link scheme (`deepwork://`) 으로 제공. 웹 폴백 링크는 Phase 2.

---

### 3.2 GET /invitations/:token — 초대 미리보기

**인증 옵션**: Bearer 있어도 되고 없어도 됨. 미리보기만 가능.

**처리 로직**
1. 토큰 조회
2. 미존재 → `INVITATION_NOT_FOUND` (404)
3. 만료 → `INVITATION_EXPIRED` (410)
4. 소진(`USED_COUNT >= MAX_USE_COUNT`) → `INVITATION_CONSUMED` (409)

**Response 200**
```json
{
  "invitation": {
    "token": "abc123...",
    "issuer": {
      "nickname": "Oscar",
      "handle": "oscar#7k3n",
      "avatarUrl": null
    },
    "expiresAt": "2026-04-25T10:00:00Z"
  }
}
```

발급자 이메일은 노출하지 않는다 (프라이버시).

---

### 3.3 POST /invitations/:token/accept — 초대 수락

**인증 필수**

**처리 로직**
1. 토큰 유효성 확인 (3.2와 동일)
2. 발급자 === 수락자 → `CANNOT_FRIEND_SELF` (422)
3. 기존 FRIENDSHIP 레코드 확인:
   - `ACCEPTED` 존재 → `ALREADY_FRIENDS` (409)
   - `BLOCKED` 존재 → `FRIENDSHIP_BLOCKED` (403)
   - `PENDING`/`REMOVED` 존재 → 재활용 (STATUS=ACCEPTED 업데이트)
   - 없으면 신규 insert (REQUESTER=발급자, ADDRESSEE=수락자, STATUS=ACCEPTED)
4. INVITE_TOKEN.USED_COUNT++
5. **양방향 COMMUNICATION_NORM 2개 auto-insert** (소유자/친구 스왑, 모두 기본값)
6. 이벤트 발행: `InvitationAccepted`, `FriendshipEstablished` (2회 — 양쪽 관점)

**Response 201**
```json
{
  "friendship": {
    "id": "88",
    "peer": {
      "id": "142",
      "nickname": "Oscar",
      "handle": "oscar#7k3n",
      "avatarUrl": null
    },
    "status": "ACCEPTED",
    "acceptedAt": "2026-04-24T10:20:00Z"
  }
}
```

---

### 3.4 GET /friendships — 친구 목록

**Query**
- `cursor` (선택): 마지막 항목의 `id`
- `limit` (선택, 기본 50, 최대 100)
- `status` (선택, 기본 `ACCEPTED`): `ACCEPTED` | `PENDING` | `BLOCKED`

**처리 로직**
- 현재 유저가 `REQUESTER_USER_ID` 또는 `ADDRESSEE_USER_ID`인 레코드 조회
- 상대방 USER join + 정렬: `UPDATED_AT DESC`

**Response 200**
```json
{
  "items": [
    {
      "id": "88",
      "peer": {
        "id": "142",
        "nickname": "Oscar",
        "handle": "oscar#7k3n",
        "avatarUrl": null
      },
      "status": "ACCEPTED",
      "createdAt": "2026-04-24T10:20:00Z"
    }
  ],
  "nextCursor": null
}
```

---

### 3.5 GET /users/search?handle={handle} — 핸들로 유저 검색

친구가 아닌 유저를 핸들로 정확 조회하여 수동 추가 플로우에 사용.

**검증**
- handle: `xxx#NNNN` 형식 완전 일치만 (prefix 검색 금지 — PRD 보안 원칙)

**Response 200**
```json
{
  "user": {
    "id": "301",
    "nickname": "Jiny",
    "handle": "jiny#a1b2",
    "avatarUrl": null
  }
}
```

**에러**
- 404 `USER_NOT_FOUND`
- 422 `INVALID_HANDLE_FORMAT`

> Phase 1에서는 조회만. 친구 추가는 여전히 초대 토큰 플로우를 거쳐야 한다(양방향 수락 원칙).

---

### 3.6 DELETE /friendships/:friendId — 친구 삭제

**처리 로직**
1. FRIENDSHIP 조회, 현재 유저가 당사자인지 확인
2. STATUS = `REMOVED`, UPDATED_AT = NOW()
3. 양방향 COMMUNICATION_NORM 삭제 (또는 soft mark)
4. `FriendshipRemoved` 이벤트

**Response 204**

**에러**
- 404 `FRIENDSHIP_NOT_FOUND`
- 403 `NOT_FRIENDSHIP_PARTY`

---

## 4. Communication 컨텍스트

### 4.1 POST /rooms — 1:1 방 생성 또는 조회 (upsert)

친구와 최초 채팅 시작 시 호출. 동일한 쌍에 대해 DIRECT 방은 1개만 존재.

**Request**
```json
{ "type": "DIRECT", "peerUserId": "142" }
```

**처리 로직**
1. peer가 현재 유저와 `ACCEPTED` 친구인지 검증 → 아니면 `NOT_FRIENDS` (403)
2. 기존 DIRECT 방 조회 (두 유저만 멤버인 DIRECT):
   ```sql
   SELECT r.* FROM ROOM r
   JOIN ROOM_MEMBER rm1 ON rm1.ROOM_ID = r.ID AND rm1.USER_ID = :me AND rm1.LEFT_AT IS NULL
   JOIN ROOM_MEMBER rm2 ON rm2.ROOM_ID = r.ID AND rm2.USER_ID = :peer AND rm2.LEFT_AT IS NULL
   WHERE r.TYPE = 'DIRECT'
   LIMIT 1;
   ```
3. 존재하면 200 반환 (신규 생성 없음)
4. 없으면:
   - ROOM insert (TYPE=DIRECT, DEFAULT_TONE=CHAT, CREATED_BY=me)
   - ROOM_MEMBER 2건 insert
   - `RoomCreated` 이벤트

**Response 201 (신규) 또는 200 (기존)**
```json
{
  "room": {
    "id": "11",
    "type": "DIRECT",
    "name": null,
    "defaultTone": "CHAT",
    "members": [
      { "userId": "142", "nickname": "Oscar", "avatarUrl": null },
      { "userId": "143", "nickname": "Jiny", "avatarUrl": null }
    ],
    "lastMessageAt": null,
    "createdAt": "2026-04-24T10:30:00Z"
  }
}
```

**에러**
- 403 `NOT_FRIENDS`
- 422 `INVALID_ROOM_TYPE` (Phase 1은 DIRECT만)

---

### 4.2 GET /rooms — 방 목록

**Query**
- `cursor`, `limit` (기본 30)

**처리 로직**
- 현재 유저가 멤버인 방 중 `LEFT_AT IS NULL`
- 정렬: `LAST_MESSAGE_AT DESC NULLS LAST`, `CREATED_AT DESC`
- 각 방의 마지막 메시지 1건 동반 (`LEFT JOIN`)

**Response 200**
```json
{
  "items": [
    {
      "id": "11",
      "type": "DIRECT",
      "peer": {
        "id": "143",
        "nickname": "Jiny",
        "handle": "jiny#a1b2",
        "avatarUrl": null
      },
      "lastMessage": {
        "id": "9021",
        "senderUserId": "143",
        "tone": "CHAT",
        "content": "고마워!",
        "createdAt": "2026-04-24T11:02:10.500Z"
      },
      "unreadCount": 2,
      "lastMessageAt": "2026-04-24T11:02:10.500Z"
    }
  ],
  "nextCursor": null
}
```

- `peer`는 DIRECT 방에 한함 (GROUP은 Phase 2). GROUP이면 `peer` 대신 `memberCount` 등.
- `unreadCount`: Phase 1에서는 Redis `read:{ROOM_ID}:{USER_ID}` 기준 계산. 구현 미루면 항상 0.

---

### 4.3 GET /rooms/:id — 방 상세

**Response 200**
```json
{
  "room": {
    "id": "11",
    "type": "DIRECT",
    "name": null,
    "defaultTone": "CHAT",
    "members": [ ... ],
    "createdAt": "2026-04-24T10:30:00Z",
    "lastMessageAt": "2026-04-24T11:02:10.500Z"
  }
}
```

**에러**
- 404 `ROOM_NOT_FOUND`
- 403 `NOT_ROOM_MEMBER`

---

### 4.4 POST /rooms/:id/messages — 메시지 전송

Phase 1에서는 **TEXT + CHAT 톤만** 지원.

**Request**
```json
{
  "clientMessageId": "01H...-client-uuid",
  "content": "안녕 오스카",
  "replyToMessageId": null
}
```

**검증**
- clientMessageId: UUID v4 또는 ULID, 1~64자
- content: 1~4000자, trim 후 길이 체크
- replyToMessageId: 같은 방의 메시지여야 함 (Phase 1은 optional)

**처리 로직** (Use Case: `SendMessageUseCase`)
1. 방 멤버 검증 → `NOT_ROOM_MEMBER` (403)
2. **멱등성 체크**: `CLIENT_MESSAGE_ID`로 조회 → 존재하면 기존 Message 반환 (200)
3. Redis `INCR room:seq:{ROOM_ID}` 로 SEQ 발급
4. Message Aggregate 생성, `message.save()` (Active Record)
5. ROOM.LAST_MESSAGE_AT 갱신
6. `MessageSent` 도메인 이벤트 발행
7. WebSocket으로 방 멤버에게 `message:new` 브로드캐스트

**Response 201 (신규) 또는 200 (멱등 재요청)**
```json
{
  "message": {
    "id": "9022",
    "roomId": "11",
    "senderUserId": "142",
    "clientMessageId": "01H...-client-uuid",
    "seq": 31,
    "tone": "CHAT",
    "contentType": "TEXT",
    "content": "안녕 오스카",
    "replyToMessageId": null,
    "version": 1,
    "createdAt": "2026-04-24T11:05:23.450Z",
    "editedAt": null
  }
}
```

**에러**
- 403 `NOT_ROOM_MEMBER`
- 422 `CONTENT_TOO_LONG`, `CONTENT_EMPTY`, `INVALID_CLIENT_MESSAGE_ID`
- 404 `REPLY_MESSAGE_NOT_FOUND`

---

### 4.5 GET /rooms/:id/messages — 메시지 목록

**Query**
- `beforeSeq` (선택): 이보다 작은 SEQ만 조회 (오래된 메시지 스크롤 업)
- `limit` (선택, 기본 50, 최대 100)

**처리 로직**
- 방 멤버 검증
- `ROOM_ID = :id AND DELETED_AT IS NULL AND (beforeSeq ? SEQ < :beforeSeq : true)`
- 정렬: `SEQ DESC`, limit

**Response 200**
```json
{
  "items": [ { "id": "9022", ... }, { "id": "9021", ... } ],
  "nextBeforeSeq": 8991
}
```

클라이언트는 timeline 표시 시 reverse 해서 오름차순 렌더. `nextBeforeSeq`가 null이면 방의 첫 메시지까지 도달.

**에러**
- 404 `ROOM_NOT_FOUND`
- 403 `NOT_ROOM_MEMBER`

---

### 4.6 PATCH /rooms/:id/messages/:messageId — 메시지 수정

Phase 1은 본인 메시지의 CONTENT만 수정 가능.

**Request**
```json
{ "content": "안녕 오스카!", "version": 1 }
```

**처리 로직**
- 소유자 검증 → `NOT_MESSAGE_OWNER` (403)
- `DELETED_AT IS NOT NULL` → `MESSAGE_DELETED` (410)
- 낙관적 동시성: 요청 version ≠ DB version → `VERSION_CONFLICT` (409)
- content 업데이트, `VERSION++`, `EDITED_AT = NOW()`
- `MessageEdited` 이벤트, WebSocket `message:updated`

**Response 200**: `{ message: {...} }`

---

### 4.7 DELETE /rooms/:id/messages/:messageId — 메시지 삭제

본인 메시지만 soft delete.

**처리 로직**
- `DELETED_AT = NOW()`
- content 유지 (감사용). 응답에서는 `content: null, deleted: true`로 노출 (4.5 참조)
- `MessageDeleted` 이벤트, WebSocket `message:deleted`

**Response 204**

> 4.5 응답에서 삭제 메시지는 `{ id, seq, senderUserId, deleted: true, deletedAt, ... }` 로 content 숨김. Phase 2에서 "삭제된 메시지입니다" UX.

---

## 5. WebSocket Gateway

### 5.1 연결

- URL: `ws://localhost:4000/ws`
- 프로토콜: **socket.io v4** (Phase 1에서 단순화 목적)
- 핸드셰이크 인증:
  ```js
  io('/ws', { auth: { token: accessToken } })
  ```
- 서버는 토큰 검증 실패 시 `connect_error` 로 끊음 (code `TOKEN_INVALID`)
- 연결 성공 시 사용자가 속한 모든 방을 자동 join (socket.io room)

### 5.2 Server → Client 이벤트

| 이벤트 | payload | 언제 |
|---|---|---|
| `message:new` | Message 객체 (4.4 응답 스키마) | 방에 메시지 생성 |
| `message:updated` | Message 객체 | 메시지 편집 |
| `message:deleted` | `{ roomId, messageId, seq, deletedAt }` | 메시지 삭제 |
| `room:created` | Room 객체 (4.1 응답 스키마) | 새 방에 본인이 추가됨 |
| `friendship:established` | Friendship 객체 (3.3 응답) | 초대 수락됨 — 양쪽에 발사 |
| `friendship:removed` | `{ friendshipId, peerUserId }` | 친구 해제 |

### 5.3 Client → Server 이벤트

**Phase 1 범위 외** — 메시지 전송은 HTTP로만. WS 클라는 수신 전용.

### 5.4 재연결 정책

- socket.io 기본 exponential backoff (min 1s, max 30s, factor 2) 유지
- 서버는 재연결 시 클라가 마지막으로 본 SEQ 이후 메시지를 **별도 REST 폴링** 으로 채우도록 안내 (Phase 4에 서버 푸시로 개선)

---

## 6. 도메인 이벤트 카탈로그

모든 이벤트는 Zod 스키마로 `packages/shared-types/events/` 아래 정의. Phase 1은 **in-memory 이벤트 버스** (NestJS EventEmitter2) 를 사용한다.

### 6.1 Identity

| 이벤트 | payload |
|---|---|
| `UserSignedUp` | `{ userId, email, nickname, handle, signedUpAt }` |
| `UserLoggedIn` | `{ userId, loggedInAt, ip?, userAgent? }` |
| `UserProfileUpdated` | `{ userId, changes: {...}, updatedAt }` |
| `WorkspaceUpdated` | `{ userId, workDays, workStartTime, workEndTime, ... }` |

### 6.2 Relationship

| 이벤트 | payload |
|---|---|
| `InvitationCreated` | `{ invitationId, issuerUserId, token, expiresAt, createdAt }` |
| `InvitationAccepted` | `{ invitationId, issuerUserId, accepterUserId, acceptedAt }` |
| `FriendshipEstablished` | `{ friendshipId, ownerUserId, peerUserId, establishedAt }` (양쪽 관점으로 2회 발행) |
| `FriendshipRemoved` | `{ friendshipId, ownerUserId, peerUserId, removedAt }` |

### 6.3 Communication

| 이벤트 | payload |
|---|---|
| `RoomCreated` | `{ roomId, type, memberIds, createdBy, createdAt }` |
| `MessageSent` | `{ messageId, roomId, senderUserId, clientMessageId, seq, tone, content, sentAt }` |
| `MessageEdited` | `{ messageId, newContent, version, editedAt }` |
| `MessageDeleted` | `{ messageId, roomId, deletedAt }` |

### 6.4 발행 규칙

- save 성공 이후 `pullDomainEvents()` → publish (CLAUDE.md 참조)
- Phase 1은 **같은 프로세스 내 비동기 소비** — EventEmitter2
- Phase 3에서 Redis pub/sub로 교체할 때 페이로드 스키마는 변경 없이 유지

---

## 7. 에러 코드 사전

### 7.1 공통

| 코드 | HTTP | 설명 |
|---|---|---|
| `VALIDATION_FAILED` | 422 | 요청 형식 오류 (기본) |
| `UNAUTHORIZED` | 401 | 인증 필요 |
| `TOKEN_INVALID` | 401 | 토큰 서명/구조 오류 |
| `TOKEN_EXPIRED` | 401 | Access 토큰 만료 |
| `REFRESH_TOKEN_INVALID` | 401 | Refresh 토큰 무효/만료/REVOKED |
| `FORBIDDEN` | 403 | 권한 없음 (기본) |
| `NOT_FOUND` | 404 | 리소스 없음 (기본) |
| `RATE_LIMITED` | 429 | 요청 과다 |
| `INTERNAL_ERROR` | 500 | 서버 오류 |

### 7.2 Identity

| 코드 | HTTP | 설명 |
|---|---|---|
| `INVALID_CREDENTIALS` | 401 | 이메일 또는 비밀번호 불일치 |
| `EMAIL_ALREADY_EXISTS` | 409 | 이메일 중복 |
| `INVALID_EMAIL` | 422 | 이메일 형식 오류 |
| `INVALID_PASSWORD` | 422 | 비밀번호 규칙 미충족 |
| `INVALID_NICKNAME` | 422 | 닉네임 규칙 미충족 |
| `INVALID_TIMEZONE` | 422 | IANA 타임존 아님 |
| `USER_NOT_FOUND` | 404 | 유저 없음 |

### 7.3 Relationship

| 코드 | HTTP | 설명 |
|---|---|---|
| `INVITATION_NOT_FOUND` | 404 | 초대 토큰 없음 |
| `INVITATION_EXPIRED` | 410 | 초대 만료 |
| `INVITATION_CONSUMED` | 409 | 초대 사용 한도 초과 |
| `CANNOT_FRIEND_SELF` | 422 | 본인 초대 수락 불가 |
| `ALREADY_FRIENDS` | 409 | 이미 친구 |
| `FRIENDSHIP_BLOCKED` | 403 | 차단된 관계 |
| `FRIENDSHIP_NOT_FOUND` | 404 | 친구 관계 없음 |
| `NOT_FRIENDSHIP_PARTY` | 403 | 관계 당사자 아님 |
| `INVALID_HANDLE_FORMAT` | 422 | 핸들 형식 오류 |

### 7.4 Communication

| 코드 | HTTP | 설명 |
|---|---|---|
| `ROOM_NOT_FOUND` | 404 | 방 없음 |
| `NOT_ROOM_MEMBER` | 403 | 방 멤버 아님 |
| `NOT_FRIENDS` | 403 | DIRECT 방 생성 시 친구 아님 |
| `INVALID_ROOM_TYPE` | 422 | Phase 1은 DIRECT만 |
| `CONTENT_EMPTY` | 422 | 메시지 본문 비어있음 |
| `CONTENT_TOO_LONG` | 422 | 본문 4000자 초과 |
| `INVALID_CLIENT_MESSAGE_ID` | 422 | clientMessageId 형식 오류 |
| `REPLY_MESSAGE_NOT_FOUND` | 404 | 답장 대상 메시지 없음 |
| `MESSAGE_NOT_FOUND` | 404 | 메시지 없음 |
| `MESSAGE_DELETED` | 410 | 삭제된 메시지 수정 불가 |
| `NOT_MESSAGE_OWNER` | 403 | 본인 메시지 아님 |
| `VERSION_CONFLICT` | 409 | 낙관적 동시성 실패 |

---

## 8. Phase 1 범위 외 (참고)

다음은 **이번 명세에서 제외** — Phase 2 이후 별도 스펙으로 추가된다.

- **Tone 확장**: ASK / URGENT / SHARE (Phase 1은 CHAT 하드코딩)
- **HandRaise** (B8): ASK 톤에 대한 응답 의사
- **CommunicationNorm 편집** (A9): 친구별 톤/프레즌스 공유/급함 허용 — Phase 1은 기본값 자동 생성만, 수정 API는 Phase 2
- **Presence** (C5~C6): 상태 조회/변경, Redis 기반
- **AttentionPolicyEvaluator** (C7): 톤×프레즌스 매트릭스 — 북극성
- **Notification**: 알림 파이프라인 (BullMQ)
- **FocusSession** (C10~C11): 뽀모도로
- **Catchup Feed** (C12~C13): 따라잡기 피드
- **그룹 채팅** (B7): Room TYPE=GROUP, 3명 이상
- **읽음 표시** (B9): Redis 기반 `read:{ROOM_ID}:{USER_ID}` + 30초 플러시
- **검색** (B11): Meilisearch
- **첨부/미디어** (B10, B12): S3 업로드
- **OAuth** (A2): Google/Kakao
- **2FA** (A13)

---

## 9. 구현 체크리스트 (팀 A/B용)

### 팀 A — Identity + Relationship
- [ ] `apps/api` NestJS 스캐폴드, `UpperSnakeNamingStrategy` 적용
- [ ] `USER`, `REFRESH_TOKEN`, `WORKSPACE` 엔티티 + 마이그레이션
- [ ] `INVITE_TOKEN`, `FRIENDSHIP`, `COMMUNICATION_NORM` 엔티티 + 마이그레이션
- [ ] `AuthModule`: signup/login/refresh/logout/me/profile
- [ ] `RelationshipModule`: invitation + friendship
- [ ] `UserSignedUp` 구독 → WORKSPACE 자동 생성 verify
- [ ] `FriendshipEstablished` 구독 → 양방향 NORM 자동 생성
- [ ] 단위 테스트: handle 자동 생성 충돌 재시도, password 규칙, Friendship 상태 전이

### 팀 B — Communication
- [ ] `ROOM`, `ROOM_MEMBER`, `MESSAGE` 엔티티 + 마이그레이션 (MESSAGE 파티션 포함)
- [ ] `RoomSequenceGenerator` (Redis INCR)
- [ ] `CommunicationModule`: rooms CRUD + messages CRUD
- [ ] `MessageGateway` (socket.io) + JWT 검증 미들웨어
- [ ] `SendMessageUseCase`: 멱등성 + SEQ 발급 + 이벤트 발행 + WS 브로드캐스트
- [ ] Relationship ACL: `POST /rooms` 호출 시 친구 여부 검증 (Relationship Repository 직접 import 금지, ACL 경유)
- [ ] 단위 테스트: ClientMessageId 멱등성, SEQ 동시성, VERSION 충돌

### 공통
- [ ] `packages/shared-types`: 이벤트 Zod 스키마
- [ ] `shared/event-bus`: EventEmitter2 래퍼
- [ ] 통합 테스트: 가입 → 초대 → 수락 → 방 생성 → 메시지 송수신 E2E (Testcontainers MySQL + Redis)
- [ ] Postman/Hoppscotch 컬렉션 공유

---

*문서 끝. Phase 2 명세는 Tone×Presence×Norm 매트릭스와 AttentionPolicyEvaluator를 중심으로 별도 작성한다.*
