# 디 메신저 PRD (DDD 버전)

> **Status**: 내부 기획 확정용
> **Owner**: Oscar
> **Version**: v2.0 (DDD 아키텍처 반영)
> **Last updated**: 2026-04-24

---

## 목차

1. [제품 정의](#1-제품-정의)
2. [도메인 개요](#2-도메인-개요)
3. [바운디드 컨텍스트 맵](#3-바운디드-컨텍스트-맵)
4. [Core 컨텍스트](#4-core-컨텍스트)
5. [Supporting 컨텍스트](#5-supporting-컨텍스트)
6. [도메인 이벤트 카탈로그](#6-도메인-이벤트-카탈로그)
7. [Ubiquitous Language](#7-ubiquitous-language)
8. [아키텍처 원칙](#8-아키텍처-원칙)
9. [저장소 전략](#9-저장소-전략)
10. [Phase 로드맵](#10-phase-로드맵)
11. [리스크 & 오픈 이슈](#11-리스크--오픈-이슈)

---

## 1. 제품 정의

### 1.1 한 줄 정의

> **디퐁은 친구와 편히 소통하면서도 서로의 집중을 지켜주는 데스크톱 메신저다.**

### 1.2 핵심 철학 (북극성)

> **"메시지는 언제든 보내도 된다. 알림은 상대방이 받을 준비가 되었을 때만 간다."**

이 문장이 모든 도메인 모델링·설계 결정의 최상위 기준입니다. 이 원칙이 **Communication 컨텍스트**와 **Attention 컨텍스트**를 분리하는 근거이기도 합니다 — 발송은 발송이고 알림은
알림입니다.

### 1.3 도메인 비전 (Domain Vision Statement)

디퐁의 핵심 도메인은 **"비동기 소통의 조율 (Asynchronous Communication Orchestration)"** 입니다.

기존 메신저들은 "메시지 = 알림"으로 간주하지만, 디퐁은 이 둘을 별개의 도메인 개념으로 분리합니다:

- **발송자 도메인**: 언제든 자유롭게 표현할 수 있어야 함
- **수신자 도메인**: 받을 준비가 됐을 때 받아야 함
- **조율자 도메인**: 양쪽의 상태를 기반으로 적절한 타이밍을 결정

이 세 가지 축이 곧 **Communication·Attention·Relationship** 세 개의 Core 컨텍스트로 드러납니다.

### 1.4 타깃 유저

한국 테크·스타트업 업계 20대 후반~30대 직장인. 몰입을 중시하면서도 친구 관계를 놓치고 싶지 않은 지식 노동자.

---

## 2. 도메인 개요

### 2.1 도메인 구조

디퐁은 **6개 바운디드 컨텍스트**로 구성됩니다. 각 컨텍스트는 독립된 ubiquitous language와 모델을 가지며, 명시적 계약으로만 통신합니다.

**Core Subdomain (3개)** — 제품의 차별화, 경쟁력, 집중 투자 대상:

- `Communication` — 메시지·톤·대화방
- `Attention` — 프레즌스·알림·집중 모드
- `Relationship` — 친구 관계·커뮤니케이션 규범

**Supporting Subdomain (3개)** — 표준적인 기능, 최소 비용으로 구현:

- `Identity` — 사용자 계정·인증·세션
- `Catchup` — 따라잡기 피드 (읽기 모델)
- `Workspace` — 업무 시간·캘린더 연동

### 2.2 왜 이렇게 나뉘었는가

> "동일한 이유로 변경되는 것끼리 묶고, 다른 이유로 변경되는 것은 분리한다" — 바운디드 컨텍스트의 핵심

**Identity와 Relationship 분리**: User 자체 관리는 표준적(OAuth, JWT)이지만 친구 관계와 커뮤니케이션 규범은 디퐁만의 독자 개념입니다. Identity가 바뀌어도
Relationship 모델은 그대로여야 합니다.

**Communication과 Attention 분리**: 북극성 철학의 직접 반영입니다. 메시지 전송 로직과 알림 정책이 다른 이유로 변경됩니다. 같은 메시지가 수신자 상태에 따라 다르게 처리되는 건
Attention 컨텍스트의 책임이지 Communication의 책임이 아닙니다.

**Catchup을 별도 컨텍스트로**: 따라잡기 피드는 **CQRS의 Read Model**입니다. Communication과 Attention의 이벤트를 구독해 사용자가 보기 편한 형태로 projection만
담당합니다. 쓰기(메시지 전송, 알림 발사)와 완전히 분리됩니다.

---

## 3. 바운디드 컨텍스트 맵

### 3.1 컨텍스트 간 관계 (Context Map)

```
┌──────────────────┐          ┌──────────────────┐
│ ● Communication  │<──(ACL)──│  ● Attention     │
│   (Core)         │          │    (Core)        │
└────────┬─────────┘          └─────────┬────────┘
         │                              │
      events                         events
         ▼                              ▼
┌──────────────────┐          ┌──────────────────┐
│ ● Relationship   │          │  ○ Catchup       │
│   (Core)         │          │    (Supporting,  │
└────────┬─────────┘          │     Read Model)  │
         │                    └──────────────────┘
      upstream
         ▼
┌──────────────────┐          ┌──────────────────┐
│ ○ Identity       │          │  ○ Workspace     │
│   (Supporting)   │          │    (Supporting)  │
└──────────────────┘          └──────────────────┘
```

### 3.2 컨텍스트 관계 유형

| 관계 | 업스트림                      | 다운스트림         | 패턴                           | 설명                    |
|----|---------------------------|---------------|------------------------------|-----------------------|
| R1 | Identity                  | Relationship  | **Open Host**                | User 참조를 위한 공개 API 제공 |
| R2 | Relationship              | Communication | **Shared Kernel**            | 친구 관계·규범은 공유 개념       |
| R3 | Relationship              | Attention     | **Anti-Corruption Layer**    | 규범을 Attention 용어로 변환  |
| R4 | Workspace                 | Attention     | **Customer-Supplier**        | 업무시간 변경 시 프레즌스 자동 전환  |
| R5 | Communication             | Attention     | **Event Collaboration**      | `MessageSent` 이벤트로 소통 |
| R6 | Communication + Attention | Catchup       | **Published Language (이벤트)** | Read Model을 이벤트로 빌드   |

### 3.3 통신 방식 규칙

- **동기 호출**: 같은 프로세스 내에서만. 주로 애그리게잇 로드 시
- **이벤트**: 컨텍스트 경계를 넘을 때 **무조건 이벤트**. 직접 호출 금지
- **Read Model**: 조회는 projection된 read model만. 다른 컨텍스트의 write model에 직접 접근 금지

---

## 4. Core 컨텍스트

### 4.1 Communication Context

**책임**: 사용자 간 메시지 교환. 대화방, 메시지, 톤 태그, 손들기 UI.

**Ubiquitous Language**:

- `Room` (대화방) — Conversation의 장소
- `Message` (메시지) — 발송된 의사 표현 단위
- `Tone` (톤) — 메시지의 의도 (CHAT/ASK/URGENT/SHARE)
- `HandRaise` (손들기) — 그룹에서 ASK 메시지에 대한 응답 의사 표시
- `Sequence` — 방 내 메시지 순번
- `Tone Quota` — 톤별 사용 제한 (URGENT만 해당, 일 3회)

**Aggregates**:

| Aggregate      | Root         | Invariants                                 |
|----------------|--------------|--------------------------------------------|
| `Room`         | Room         | 멤버 2~50명, 1:1은 정확히 2명                      |
| `Message`      | Message      | 톤 필수, Sequence 단조 증가, 멱등성(ClientMessageId) |
| `Conversation` | Conversation | (선택) 여러 Room을 묶는 개념, v1에는 없음               |

**주요 도메인 규칙**:

1. `Message`는 Tone 없이 생성 불가. 기본값은 `Relationship.Norm.defaultTone`에서 가져옴.
2. `URGENT` 톤은 일일 쿼터 3회 제한. 초과 시 `UrgentQuotaExceeded` 도메인 예외.
3. `ASK` 톤이 `GROUP` Room에 전송되면 `HandRaise` Aggregate 생성 가능성 있음 (자동 아님, 멤버가 의사 표시해야 함).
4. Message는 불변(immutable)에 가깝지만, 편집·삭제는 version 기반 낙관적 동시성.
5. Sequence 발급은 **Domain Service** (RoomSequenceGenerator)로 분리 — 방별 단조 증가 보장.

**Domain Events**:

- `MessageSent` — 메시지 전송됨 (receiverId, tone, content, sequence)
- `MessageEdited` — 메시지 편집됨
- `MessageDeleted` — 메시지 삭제됨
- `HandRaised` — 누군가 손을 들었음
- `HandPassed` — 누군가 패스했음
- `RoomCreated` — 방 생성됨
- `MemberJoined` / `MemberLeft` — 멤버 변경

**담당**: 팀 B

---

### 4.2 Attention Context

**책임**: 수신자의 상태 관리. 메시지를 언제·어떻게 알림으로 전환할지 결정. 집중 모드.

**Ubiquitous Language**:

- `Presence` (프레즌스) — 사용자의 현재 가용성 (FREE/WORKING/FOCUS/OFF)
- `Focus Session` (집중 세션) — 뽀모도로 기반 몰입 시간 단위
- `Attention Decision` — 메시지를 어떻게 알림할지 결정 (IMMEDIATE/BATCHED/QUEUED/DROPPED)
- `Notification` — 실제 사용자에게 전달된(또는 예정된) 알림
- `Delivery Schedule` — 배치·지연 알림 예정표

**Aggregates**:

| Aggregate            | Root               | Invariants                             |
|----------------------|--------------------|----------------------------------------|
| `Presence`           | Presence           | 하나의 User는 정확히 하나의 현재 상태, TTL 기반 자동 OFF |
| `FocusSession`       | FocusSession       | start < end, 중복 활성 세션 금지               |
| `NotificationPolicy` | NotificationPolicy | Tone×Presence 매트릭스 + 사용자 오버라이드         |

**주요 도메인 규칙**:

1. **Attention Decision 매트릭스** — Communication이 `MessageSent` 이벤트를 발행하면, Attention은 수신자의 현재 `Presence`와 메시지의 `Tone`으로
   결정:

| 수신자 \ 톤 | CHAT        | ASK       | URGENT          | SHARE       |
|---------|-------------|-----------|-----------------|-------------|
| FREE    | IMMEDIATE   | IMMEDIATE | IMMEDIATE       | IMMEDIATE   |
| WORKING | BATCHED(2h) | IMMEDIATE | IMMEDIATE       | BATCHED(2h) |
| FOCUS   | QUEUED      | QUEUED    | IMMEDIATE_QUIET | QUEUED      |
| OFF     | QUEUED      | QUEUED    | IMMEDIATE       | DROPPED     |

2. `FocusSession` 중에는 `Presence = FOCUS`로 고정. 세션 종료 시 자동으로 이전 상태로 복귀.

3. `Presence`는 **자동 관리 기본값**. 수동 설정 시 24시간 후 자동 관리 복귀.

4. Attention Decision은 **Domain Service** (`AttentionPolicyEvaluator`). Relationship Context의 `CommunicationNorm`을 ACL을
   통해 참조.

5. **시간 기반 규칙**: Workspace의 업무시간 변경 → `WorkHoursChanged` 이벤트 → Presence 자동 전환.

**Domain Events**:

- `PresenceChanged` — 상태 변경됨
- `FocusSessionStarted` — 집중 시작
- `FocusSessionEnded` — 집중 종료 (정상 완료/중도 해제 구분)
- `NotificationDispatched` — 알림 발사됨
- `NotificationQueued` — 알림 대기 큐에 들어감
- `NotificationDropped` — 알림 드롭됨 (정책에 의해)

**담당**: 팀 C

---

### 4.3 Relationship Context

**책임**: 친구 관계 그래프와 **커뮤니케이션 규범**. 친구별 소통 규칙의 진실 공급원.

**Ubiquitous Language**:

- `Friendship` (친구 관계) — 양방향 수락된 연결
- `Invitation` (초대) — 친구 추가를 위한 1회용 토큰
- `Communication Norm` (커뮤니케이션 규범) — 친구 관계별 소통 규칙
- `Peer` — Friendship의 반대편 User

**Aggregates**:

| Aggregate           | Root       | Invariants                  |
|---------------------|------------|-----------------------------|
| `Friendship`        | Friendship | 양방향, 자기 자신 X, 중복 X          |
| `Invitation`        | Invitation | 만료 시간, 사용 횟수 제한             |
| `CommunicationNorm` | Norm       | Friendship 종속, owner 관점 비대칭 |

**주요 도메인 규칙**:

1. `Friendship`은 양방향 수락 기반. `PENDING → ACCEPTED → REMOVED/BLOCKED` 상태 전이만 가능.

2. `CommunicationNorm`은 **Friendship당 각자 1개씩** (Oscar의 민수에 대한 규범 + 민수의 Oscar에 대한 규범). 양쪽이 비대칭 설정 가능.

3. Norm의 주요 값 객체 (Value Object):
    - `DefaultTone`: 이 친구에게 보낼 때 기본 톤
    - `UrgentAllowed`: 상대방의 URGENT 허용 여부
    - `ShareReadReceipt`, `SharePresence`, `ShareWorktime`: 공유 설정들
    - `FeedPriority`: 따라잡기 피드 우선순위

4. `Friendship` 해제 시 `CommunicationNorm`도 함께 제거 (cascade).

5. `Invitation` 수락 시 `FriendshipEstablished` 이벤트 발행. Communication과 Attention 컨텍스트가 이 이벤트 구독.

**Domain Events**:

- `FriendshipRequested` — 요청 발송
- `FriendshipEstablished` — 양방향 수락 완료
- `FriendshipRemoved` — 관계 해제
- `NormUpdated` — 규범 변경 (상대방에게 알림)
- `InvitationIssued` / `InvitationAccepted` — 초대 관련

**담당**: 팀 A

---

## 5. Supporting 컨텍스트

### 5.1 Identity Context

**책임**: 계정·인증·세션. 다른 컨텍스트는 Identity의 `UserId`만 참조.

**Aggregates**:

- `User` (profile 포함) — Identity의 루트 애그리게잇
- `AuthSession` — JWT refresh 토큰·디바이스 세션
- `OAuthConnection` — Kakao/Google 연결

**주요 규칙**:

- `User` 삭제 시 다른 컨텍스트에는 `UserDeleted` 이벤트만 전달 (해당 컨텍스트가 자체 정리)
- `User` 정보 변경은 Open Host API로만 전파 — 다른 컨텍스트는 이 API를 통해 캐싱

**Domain Events**:

- `UserRegistered` / `UserDeleted`
- `OAuthConnected`
- `LoginSucceeded`

**담당**: 팀 A

---

### 5.2 Catchup Context (Read Model · CQRS)

**책임**: 따라잡기 피드. 다른 컨텍스트의 도메인 이벤트를 구독해서 **읽기 전용 projection** 만듦.

**특징**:

- **Write 모델 없음**. 피드 항목은 projection 결과일 뿐.
- Redis를 저장소로 사용 (TTL 1h).
- Event Sourcing 스타일의 빌드, 아니면 필요할 때만 on-demand 빌드.

**구독하는 이벤트**:

- `MessageSent` (Communication) — 피드에 메시지 후보로 추가
- `NotificationDispatched` / `NotificationQueued` (Attention) — 피드 분류 확정
- `FocusSessionEnded` (Attention) — 피드 재생성 트리거
- `PresenceChanged` (Attention) — OFF → 온라인 복귀 시 피드 트리거

**Read Models**:

- `UrgentSection`: ASK + 미답 메시지 모음
- `SharedSection`: SHARE 링크/이미지 모음
- `ChatDigest`: CHAT 요약 카드

**Domain Events** (피드 내 사용자 행동):

- `FeedItemOpened`
- `FeedItemDeferred` (나중에)
- `FeedItemDismissed` (읽음 처리)

**담당**: 팀 C

---

### 5.3 Workspace Context

**책임**: 업무 시간 프로필·Google 캘린더 연동. Attention 컨텍스트의 자동 전환 규칙을 위한 **정보 공급원**.

**Aggregates**:

- `WorkSchedule` — 업무 요일·시간·점심 예외
- `CalendarConnection` — Google Calendar OAuth·이벤트 polling

**Domain Events**:

- `WorkHoursChanged` — 업무 시간 변경
- `CalendarEventStarted` / `CalendarEventEnded` — 캘린더 이벤트
- `CalendarConnected` / `CalendarDisconnected`

**담당**: 팀 A

---

## 6. 도메인 이벤트 카탈로그

### 6.1 이벤트 설계 원칙

1. **이벤트는 과거형 동사**: `MessageSent`, `FriendshipEstablished` (not `SendMessage`)
2. **이벤트는 불변**: 발행되면 수정 불가
3. **자체 포함**: 구독자가 필요한 최소 정보 포함. 추가 조회는 Open Host API로.
4. **의미 중심**: 기술적 세부사항(DB 컬럼명) 아닌 도메인 언어
5. **버전 관리**: 이벤트 스키마 변경 시 `MessageSent.v2` 형식

### 6.2 주요 이벤트 흐름

**시나리오 1: 1:1 메시지 전송 → 알림**

```
1. POST /messages 요청 (Communication)
2. Relationship Context에서 Norm 조회 (동기, ACL)
3. Communication: Message Aggregate 생성·저장
4. Communication: MessageSent 이벤트 발행
5. Attention 구독자:
   - 수신자 Presence 조회
   - AttentionPolicyEvaluator 실행
   - NotificationDispatched 또는 NotificationQueued 이벤트 발행
6. Catchup 구독자:
   - 피드 read model 업데이트
```

**시나리오 2: 집중 모드 종료 → 대기 알림 처리**

```
1. 사용자 ESC (Attention)
2. Attention: FocusSessionEnded 이벤트 발행
3. Attention 자체 리스너: 대기 중인 Notification 큐 처리
4. Catchup 구독자: 피드 재생성 트리거
```

**시나리오 3: 친구 수락 → 대화 준비**

```
1. POST /friendship/accept (Relationship)
2. Relationship: Friendship ACCEPTED 전환
3. Relationship: FriendshipEstablished 이벤트 발행
4. Communication 구독자: 1:1 Room 자동 생성
5. Relationship 자체 리스너: 양쪽에 기본 Norm 생성
```

### 6.3 이벤트 브로드캐스트 인프라

- **개발 초기**: 같은 프로세스 내 in-memory event bus (NestJS EventEmitter)
- **Phase 3+**: Redis pub/sub로 전환
- **Phase 5+**: 필요 시 별도 메시지 브로커 (하지만 BullMQ로도 충분할 가능성 높음)

---

## 7. Ubiquitous Language

각 컨텍스트별로 **같은 단어가 다른 의미**를 가질 수 있습니다. 번역은 ACL이 담당.

| 단어       | Communication | Attention | Relationship | Identity |
|----------|---------------|-----------|--------------|----------|
| User     | 발신자/수신자 참조    | 상태의 주체    | Peer         | 루트 애그리게잇 |
| Message  | 본체            | 알림 트리거    | —            | —        |
| Tone     | 애그리게잇의 속성     | 정책 입력값    | Norm의 기본값    | —        |
| Norm     | (참조만)         | (참조만)     | 애그리게잇        | —        |
| Presence | —             | 애그리게잇     | 공유 설정 대상     | —        |

**원칙**: 한 컨텍스트 내에서는 한 단어가 한 의미. 번역이 필요하면 ACL로 명시적으로.

---

## 8. 아키텍처 원칙

### 8.1 레이어드 구조 (헥사고날)

각 컨텍스트는 다음 레이어를 가집니다:

```
apps/api/src/
├── modules/
│   ├── communication/        # 바운디드 컨텍스트 = NestJS 모듈
│   │   ├── domain/           # Aggregates, Entities, Value Objects, Events
│   │   │   ├── message/
│   │   │   ├── room/
│   │   │   └── services/     # Domain Services (Sequence, Quota)
│   │   ├── application/      # Use Cases (Application Services), Commands, Queries
│   │   ├── infrastructure/   # Repositories, DB, Adapters
│   │   │   ├── persistence/
│   │   │   └── acl/          # 다른 컨텍스트 호출 래퍼
│   │   └── interface/        # HTTP Controllers, WebSocket Gateway
│   ├── attention/
│   ├── relationship/
│   ├── identity/
│   ├── catchup/
│   └── workspace/
└── shared/                    # 공유 인프라 (EventBus, Logger 등)
```

### 8.2 의존성 규칙

- **Domain** → 아무것도 의존하지 않음 (pure)
- **Application** → Domain만 의존
- **Infrastructure** → Domain + Application (역방향 의존 주입)
- **Interface** → Application (Controller는 Use Case만 호출)

### 8.3 Aggregate 설계 가이드

1. **하나의 트랜잭션에 하나의 애그리게잇만 수정**
    - Message 생성과 Notification 발사는 다른 트랜잭션 (이벤트로 연결)

2. **애그리게잇 간 참조는 ID만**
    - `Message.senderId: UserId` ✅
    - `Message.sender: User` ❌

3. **애그리게잇은 일관성 경계**
    - 애그리게잇 내부는 강한 일관성
    - 애그리게잇 간은 결과적 일관성 (eventual consistency)

4. **작게 유지**
    - 하나의 Room Aggregate가 모든 Message를 포함하면 안 됨
    - Room Aggregate는 Room 본체 + 최소 메타만. Message는 별도 애그리게잇.

### 8.4 Value Object 활용

원시 타입 사용 최소화:

```typescript
// ❌ 나쁨
class Message {
    constructor(public tone: string, public content: string) {
    }
}

// ✅ 좋음
class Tone {
    private constructor(readonly value: 'CHAT' | 'ASK' | 'URGENT' | 'SHARE') {
    }

    static chat() {
        return new Tone('CHAT');
    }

    static urgent() {
        return new Tone('URGENT');
    }

    canBypassFocus(): boolean {
        return this.value === 'URGENT';
    }
}

class Message {
    constructor(public tone: Tone, public content: MessageContent) {
    }
}
```

### 8.5 Repository 패턴

Repository는 **도메인 레이어에 인터페이스**, **인프라 레이어에 구현**:

```typescript
// domain/message/message.repository.ts
export interface MessageRepository {
    findById(id: MessageId): Promise<Message | null>;

    save(message: Message): Promise<void>;

    nextSequence(roomId: RoomId): Promise<Sequence>;  // Redis INCR
}

// infrastructure/persistence/prisma-message.repository.ts
export class PrismaMessageRepository implements MessageRepository {
    constructor(private prisma: PrismaService, private redis: RedisService) {
    }

    // ... 구현
}
```

### 8.6 Domain Service vs Application Service

- **Domain Service**: 여러 애그리게잇에 걸치는 도메인 로직
    - `AttentionPolicyEvaluator`: Presence + Tone + Norm으로 결정
    - `RoomSequenceGenerator`: Sequence 발급

- **Application Service (Use Case)**: 트랜잭션·인증·외부 호출 조율
    - `SendMessageUseCase`: Message 생성 → 저장 → 이벤트 발행

---

## 9. 저장소 전략

도메인별 특성에 맞춰 저장소를 분리합니다. 상세 내용은 `deepwork-schema.sql` 참조.

### 9.1 컨텍스트별 저장소 매핑

| 컨텍스트          | 주 저장소         | 보조 저장소                            | 비고                   |
|---------------|---------------|-----------------------------------|----------------------|
| Communication | MySQL (핫 90일) | S3 Parquet (콜드), Meilisearch (검색) | Message 월별 파티션       |
| Attention     | Redis (실시간)   | MySQL (지표용 스냅샷)                   | Presence는 Redis 전용   |
| Relationship  | MySQL         | Redis 캐시 (Norm)                   | 변경 적고 읽기 많음          |
| Identity      | MySQL         | Redis (JWT 블랙리스트)                 | 표준                   |
| Catchup       | Redis         | —                                 | 순수 Read Model, 쓰기 없음 |
| Workspace     | MySQL         | —                                 | 저빈도 변경               |

### 9.2 이벤트 저장

- 인메모리 버스 (초기): 저장 안 함, 최선 노력(best-effort)
- Phase 3+: 주요 이벤트만 MySQL `domain_events` 테이블에 append-only 기록 (감사·재처리용)
- Phase 5+: 필요 시 Event Store 전용 DB 도입

---

## 10. Phase 로드맵

### Phase 1 (Week 1~3) — 뼈대 구축

- Identity, Relationship 컨텍스트 기본
- Communication 컨텍스트의 Room, Message 기본
- 이벤트 버스 인프라 (in-memory)
- 검증: 친구 추가 → 1:1 메시지 전송

### Phase 2 (Week 4~7) ⭐ MVP — 핵심 차별화

- Communication: Tone, HandRaise
- Relationship: CommunicationNorm
- Attention: Presence, AttentionPolicyEvaluator, 알림 파이프라인
- 검증: 톤×프레즌스 매트릭스 정상 동작

### Phase 3 (Week 8~10) — 몰입 경험

- Attention: FocusSession
- Catchup 컨텍스트 전체
- Communication: 검색(Meilisearch), 미디어·OG 프리뷰
- 검증: 집중 종료 후 피드 생성

### Phase 4 (Week 11~13) — 안정화

- WebSocket 재연결 견고성
- 이벤트 보관·재처리 메커니즘
- 성능 최적화 (가상 스크롤, 캐시 워밍)

### Phase 5 (Week 14~15) — 출시

- 프로덕션 배포, 모니터링, Electron 공증

---

## 11. 리스크 & 오픈 이슈

### 11.1 DDD 도입 리스크

**R-DDD-1: 3인팀에 DDD는 과한가?**

- 리스크: 도메인 모델링 오버헤드가 Phase 1~2 속도를 30% 이상 늦출 수 있음
- 완화: Core 컨텍스트(Communication·Attention·Relationship)에만 엄격 적용. Supporting은 CRUD 수준으로.

**R-DDD-2: 이벤트 유실**

- 리스크: in-memory 버스는 프로세스 크래시 시 이벤트 유실
- 완화: MVP 동안은 허용. Phase 3에 outbox 패턴 도입.

**R-DDD-3: 결과적 일관성 혼란**

- 리스크: 메시지 전송 후 피드에 즉시 안 보이면 사용자 혼란
- 완화: 클라이언트 낙관적 업데이트 + 서버 이벤트 사용. 피드 재생성 < 1초 목표.

### 11.2 도메인 오픈 이슈

- [ ] `Message` Aggregate가 첨부 이미지를 포함해야 하나, 별도 `Attachment` 애그리게잇으로 분리하나?
- [ ] `HandRaise`를 Communication에 둘지 별도 컨텍스트로 뺄지
- [ ] URGENT 쿼터는 Relationship의 Norm에 속하나, Communication의 Tone에 속하나?
- [ ] 그룹 채팅의 기본 톤 변경이 `RoomAdmin` 권한이면, Role 개념을 어디에 두나?
- [ ] Catchup의 projection 실패 시 재시도·재빌드 전략

### 11.3 기술 오픈 이슈

- [ ] NestJS 모듈 = 바운디드 컨텍스트 매핑이 장기적으로 유효한가?
- [ ] Prisma 단일 schema.prisma vs 컨텍스트별 분리 스키마
- [ ] 이벤트 스키마 버전 관리를 Zod로 할지 Protobuf로 할지

---

## 부록 A. 관련 문서

- `docs/schema/deepwork-schema.sql` — DDL
- `docs/adr/` — 아키텍처 결정 기록
- `docs/design/prototype/` — 화면 프로토타입
- `docs/features.md` — 기능 목록 (각 기능이 어느 컨텍스트에 속하는지 매핑됨)

## 부록 B. 기능 ↔ 컨텍스트 매핑

| 기능 ID   | 기능명       | 컨텍스트                                | Aggregate             |
|---------|-----------|-------------------------------------|-----------------------|
| A1~A2   | 로그인·OAuth | Identity                            | User, OAuthConnection |
| A3      | 프로필       | Identity                            | User                  |
| A4      | 온보딩       | (cross-context)                     | —                     |
| A5~A7   | 친구 초대     | Relationship                        | Invitation            |
| A8      | 친구 수락     | Relationship                        | Friendship            |
| A9      | 커뮤니케이션 규범 | Relationship                        | CommunicationNorm     |
| A10~A12 | 설정        | Identity / Workspace / Relationship | 각자                    |
| A13     | 2FA       | Identity                            | User                  |
| B1, B7  | 대화방       | Communication                       | Room                  |
| B2~B5   | 메시지 기본    | Communication                       | Message               |
| B6      | 톤 태그      | Communication                       | Message (Tone VO)     |
| B8      | 손들기       | Communication                       | HandRaise             |
| B9      | 읽음 표시     | Communication                       | Message               |
| B11     | 검색        | Communication                       | (Read)                |
| C5~C6   | 프레즌스      | Attention                           | Presence              |
| C7~C9   | 알림 파이프라인  | Attention                           | NotificationPolicy    |
| C10~C11 | 집중 모드     | Attention                           | FocusSession          |
| C12~C13 | 따라잡기 피드   | Catchup                             | (Read Model)          |

---

*문서 끝. 다음 단계: 각 Core 컨텍스트별 TRD(Technical Design Document) 작성.*
