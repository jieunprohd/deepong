# 백엔드 남은 작업 체크리스트 (Phase 1)

> **기준**: `backend-spec-phase1.md` 대조 + 현재 코드베이스 실사  
> **Last updated**: 2026-05-10

---

## 목업/미완성 항목 (현재 코드가 실제로 동작하지 않는 부분)

### 🔴 Catchup — senderUserId, senderNickname 항상 null

`list-catchup-feed.usecase.ts` L49–50:

```ts
senderUserId: null,    // TODO: Communication.MESSAGE.SENDER_USER_ID join
senderNickname: null,  // TODO: USER nickname join
```

피드 아이템의 발신자 정보가 전혀 내려가지 않는 상태. Communication 모듈의 Message 엔티티 구현 후 ACL 경유 join으로 채워야 함.

---

### 🔴 Identity — logout Redis 블랙리스트 미구현

스펙 2.4: _"현재 access token을 Redis `session:blacklist:{jti}` 로 TTL 15분 기록"_

현재 `LogoutUseCase`는 Refresh Token revoke만 하고 Access Token 블랙리스트는 없음.  
결과적으로 로그아웃 후에도 Access Token이 만료 전까지 유효하게 사용됨.

---

### 🔴 Redis 연결 자체 없음

`ioredis`는 설치되어 있으나 Redis 연결 모듈이 없음.  
아래 기능 모두 Redis 없이는 동작 불가:

| 기능 | Redis 키 |
|---|---|
| 메시지 SEQ 발급 | `room:seq:{ROOM_ID}` |
| Access Token 블랙리스트 | `session:blacklist:{jti}` |
| 프레즌스 실시간 상태 | `presence:{USER_ID}` |
| URGENT 쿼터 | `urgent:quota:{UID}:{YYYYMMDD}` |

---

### 🟡 Identity — `PATCH /me` 엔드포인트 없음

`me.controller.ts`에 `GET /me`만 있고 `PATCH /me` (프로필 수정) 없음.  
`UpdateProfileUseCase`도 미구현.

---

### 🟡 Identity — logout 응답 스펙 불일치

| 항목 | 스펙 | 현재 |
|---|---|---|
| HTTP status | 204 No Content | 200 + body |
| 요청 방식 | Bearer 헤더 필수, body는 선택 | body 필수 (`refreshToken`) |

---

### 🟡 Relationship — `DELETE /friendships/:id` 불완전

스펙 3.6 step 3: _"양방향 COMMUNICATION_NORM 삭제"_ 미구현.  
현재 Friendship status만 REMOVED로 변경하고 COMMUNICATION_NORM은 그대로 남음.

스펙 3.6 step 1: `NOT_FRIENDSHIP_PARTY` 검증 (요청자가 당사자인지 확인) 없음.

---

## 남은 구현 체크리스트

### P0 — Redis 모듈 (공통 인프라, 모든 것이 여기에 블록됨)

- [ ] **Redis 모듈** — `shared/redis/redis.module.ts` + `REDIS_CLIENT` provider
- [ ] `packages/shared-types` — 도메인 이벤트 Zod 스키마 (`MessageSent`, `RoomCreated`, `FriendshipEstablished` 등)
- [ ] TypeORM 마이그레이션 파일 정리 (현재 synchronize 의존 — 프로덕션 전 migration:run 전환 필요)

---

### P1 — Communication 모듈 핵심 도메인 (팀 B)

#### 도메인

- [ ] `Message` 엔티티 + 도메인 로직 (`tone.vo.ts`, `content.vo.ts`, `message-sent.event.ts`, `message-edited.event.ts`, `message-deleted.event.ts`)
- [ ] `Room` 엔티티 도메인 로직 추가 (팩토리 메서드, `AggregateRoot` 상속, `RoomCreated` 이벤트)
- [ ] TypeORM 마이그레이션: `ROOM`, `ROOM_MEMBER`, `MESSAGE` (MESSAGE는 월별 RANGE 파티션 포함)

#### 인프라

- [ ] `RoomSequenceGenerator` — Redis `INCR room:seq:{ROOM_ID}`
- [ ] `RelationshipAcl` — `POST /rooms` 시 친구 여부 검증 (Relationship 컨텍스트 직접 import 금지, ACL 경유)

---

### P2 — Communication Use Cases + Interface (팀 B)

- [ ] `CreateRoomUseCase` — upsert 로직 (DIRECT 방 중복 방지), `RoomCreated` 이벤트 + `gateway.emitRoomCreated()`
- [ ] `GetRoomsUseCase` — cursor 페이지네이션, `LAST_MESSAGE_AT DESC`, 마지막 메시지 포함
- [ ] `GetRoomUseCase` — 단건 조회 + 멤버 목록
- [ ] `SendMessageUseCase` — 멱등성(`CLIENT_MESSAGE_ID`) + SEQ 발급 + `gateway.emitMessageNew()`
- [ ] `GetMessagesUseCase` — `beforeSeq` cursor, `SEQ DESC`
- [ ] `EditMessageUseCase` — 낙관적 동시성(`VERSION`) + `gateway.emitMessageUpdated()`
- [ ] `DeleteMessageUseCase` — soft delete + `gateway.emitMessageDeleted()`
- [ ] `RoomController` — `POST /rooms`, `GET /rooms`, `GET /rooms/:id`
- [ ] `MessageController` — `POST /rooms/:id/messages`, `GET /rooms/:id/messages`, `PATCH /rooms/:id/messages/:messageId`, `DELETE /rooms/:id/messages/:messageId`

---

### P3 — Identity 보완 (팀 A, Redis 모듈 완료 후 가능)

- [ ] `LogoutUseCase` — Access Token Redis 블랙리스트 추가 (`session:blacklist:{jti}`, TTL 15분)
- [ ] `JwtAuthGuard` — Redis 블랙리스트 확인 로직 추가
- [ ] `UpdateProfileUseCase` + `PATCH /me` 엔드포인트 (nickname, bio, avatarUrl, timezone)
- [ ] logout HTTP status 204로 수정 + Bearer 헤더에서 Access Token 추출

---

### P4 — Relationship 보완 (팀 A)

- [ ] `DeleteFriendshipUseCase` — `NOT_FRIENDSHIP_PARTY` 검증 추가
- [ ] `DeleteFriendshipUseCase` — 양방향 `COMMUNICATION_NORM` 삭제 (soft delete or hard)
- [ ] `AcceptInvitationUseCase` — `FriendshipEstablished` 이벤트 수신 후 `gateway.emitFriendshipEstablished()` 호출
- [ ] `DeleteFriendshipUseCase` — `gateway.emitFriendshipRemoved()` 호출

---

### P5 — 연결 및 마무리

- [ ] `ListCatchupFeedUseCase` — `senderUserId`, `senderNickname` Communication ACL 경유 채우기 (Message 엔티티 구현 후)

---

### P6 — 테스트 (전체 구현 완료 후)

- [ ] `SendMessageUseCase` — `CLIENT_MESSAGE_ID` 멱등성 테스트
- [ ] `SendMessageUseCase` — SEQ 동시성 테스트
- [ ] `EditMessageUseCase` — `VERSION` 충돌 테스트
- [ ] `Friendship` — 상태 전이 규칙 테스트 (PENDING → ACCEPTED → REMOVED 등)
- [ ] E2E — 가입 → 초대 → 수락 → 방 생성 → 메시지 송수신 (Testcontainers MySQL + Redis)

---

## 우선순위 요약

```
P0  Redis 모듈          ← 🔴 블로킹 이슈. SEQ·블랙리스트·Presence·쿼터 전부 의존
P1  Message + Room 도메인 ← SendMessageUseCase 선행 조건. Catchup도 여기 의존
P2  Room + Message UseCase/Controller ← Communication 핵심 기능
P3  Identity 보완       ← Redis 완료 후 즉시 가능 (logout 블랙리스트, PATCH /me)
P4  Relationship 보완   ← DELETE /friendships 검증 + NORM 삭제
P5  Catchup sender 연결 ← Message 엔티티 완성 후
P6  통합 테스트         ← 모든 구현 완료 후
```
