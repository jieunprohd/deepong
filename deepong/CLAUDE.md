## 프로젝트 개요
**디퐁(Deepong)** 는 친구와 편히 소통하면서도 서로의 집중을 지켜주는 데스크톱 메신저입니다.

### 핵심 철학 (북극성)
**"메시지는 언제든 보내도 된다. 알림은 상대방이 받을 준비가 되었을 때만 간다."**가 모든 설계 결정의 최상위 기준입니다. 이 원칙이 곧 **Communication 컨텍스트**와 **Attention 컨텍스트**를 분리하는 근거입니다.

## 아키텍처: DDD + TDD + 실용주의
이 프로젝트는 **DDD 원칙으로 설계하되, TypeORM Active Record로 구현**합니다. 엄격한 DDD보다 3인팀 개발 속도를 우선합니다.

### 무엇을 엄격히 지키고, 무엇을 느슨히 가는가
**엄격하게 지킴 (양보 불가)**
- 6개 바운디드 컨텍스트 경계
- 컨텍스트 간 통신은 도메인 이벤트로만
- Value Object는 pure (TypeORM 데코레이터 없음)
- Use Case 중심 비즈니스 로직 조율
- TDD는 Domain/Application 레이어에 엄격 적용

**느슨하게 감 (실용 선택)**
- Aggregate에 `@Entity` 데코레이터 직접 부착 (Persistence Entity 분리 안 함)
- Active Record 패턴 (`message.save()` 호출)
- Mapper 레이어 없음 (대신 매핑 규칙은 TypeORM 설정으로 일괄)

### 6개 바운디드 컨텍스트
**Core (3개) — 디퐁의 차별화**
- `Communication` — 메시지·톤·대화방·손들기 (팀 B)
- `Attention` — 프레즌스·알림 파이프라인·집중 모드 (팀 C)
- `Relationship` — 친구 관계·커뮤니케이션 규범 (팀 A)

**Supporting (3개) — 표준적인 기능**
- `Identity` — 계정·인증·세션 (팀 A)
- `Catchup` — 따라잡기 피드 (CQRS Read Model, 팀 C)
- `Workspace` — 업무 시간·캘린더 (팀 A)

### 컨텍스트 간 통신 원칙
1. **동일 프로세스 내 동기 호출은 ACL(Anti-Corruption Layer)을 통해서만**
2. **컨텍스트 경계를 넘는 통신은 무조건 도메인 이벤트**
3. **다른 컨텍스트의 Repository·Entity 직접 import 금지**
4. **조회는 ACL의 Query 메서드 또는 Read Model로만**

### 주요 컨텍스트 관계
| From | To | 관계 유형 |
|---|---|---|
| Relationship | Communication | Shared Kernel (Norm 참조) |
| Relationship | Attention | ACL (Norm → Attention 규칙 변환) |
| Communication | Attention | Event Collaboration (MessageSent) |
| Workspace | Attention | Customer-Supplier (WorkHoursChanged) |
| Communication + Attention | Catchup | Published Language (이벤트 구독) |
| Identity | Relationship | Open Host (UserId 참조) |

## 기술 스택 (확정)
- **모노레포**: Turborepo + pnpm
- **데스크톱**: Electron + Next.js (TypeScript)
- **서버**: NestJS (TypeScript) — **모듈 = 바운디드 컨텍스트**
- **DB**: MySQL 8.0 (utf8mb4_0900_ai_ci)
- **ORM**: **TypeORM** (Active Record 패턴, `@nestjs/typeorm`)
- **캐시/큐**: Redis + BullMQ
- **로컬 저장소**: SQLite (better-sqlite3)
- **검색** (Phase 3+): Meilisearch
- **분석** (Phase 4+): ClickHouse
- **객체 저장**: S3 또는 Cloudflare R2
- **이벤트 버스**: Redis pub/sub (Phase 3+)

---

## 프로젝트 구조
### 모노레포 루트

```
deepong/
├── apps/
│   ├── desktop/          # Electron + Next.js (렌더러)
│   ├── api/              # NestJS (아래 구조 참조)
│   └── electron-main/    # Electron 메인 프로세스
├── packages/
│   ├── shared-types/     # 컨텍스트 간 공유 이벤트 스키마 (Zod)
│   ├── ui/               # 공통 컴포넌트·디자인 토큰
│   └── config/           # eslint, tsconfig 공통
├── docs/
│   ├── prd/deepwork-prd.md
│   ├── schema/deepwork-schema.sql
│   ├── adr/
│   └── runbook/
└── .github/
```

### apps/api 내부 구조

```
apps/api/src/
├── modules/                            # 바운디드 컨텍스트 = NestJS 모듈
│   ├── communication/
│   │   ├── domain/                     # 도메인 레이어
│   │   │   ├── message/
│   │   │   │   ├── message.entity.ts   # Aggregate Root (@Entity 부착)
│   │   │   │   ├── tone.vo.ts          # Value Object (pure)
│   │   │   │   ├── content.vo.ts       # Value Object (pure)
│   │   │   │   └── events/
│   │   │   │       ├── message-sent.event.ts
│   │   │   │       └── message-edited.event.ts
│   │   │   ├── room/
│   │   │   ├── hand-raise/
│   │   │   └── services/               # Domain Services
│   │   │       ├── sequence-generator.service.ts
│   │   │       ├── urgent-quota.service.ts
│   │   │       └── quota-counter.interface.ts
│   │   ├── application/                # Use Cases
│   │   │   ├── send-message.usecase.ts
│   │   │   ├── create-room.usecase.ts
│   │   │   └── queries/
│   │   ├── infrastructure/
│   │   │   ├── redis-quota-counter.ts  # QuotaCounter 구현체
│   │   │   ├── acl/
│   │   │   │   └── relationship.acl.ts
│   │   │   └── http/
│   │   ├── interface/
│   │   │   ├── message.controller.ts
│   │   │   └── message.gateway.ts      # WebSocket
│   │   └── communication.module.ts
│   │
│   ├── attention/                      # 동일 구조
│   ├── relationship/
│   ├── identity/
│   ├── catchup/
│   └── workspace/
│
└── shared/
    ├── event-bus/
    ├── logger/
    ├── database/
    │   ├── data-source.ts              # TypeORM DataSource
    │   ├── naming.strategy.ts          # 대문자 컬럼명 자동 매핑
    │   └── migrations/
    └── types/
        ├── aggregate-root.ts           # 공통 Aggregate Root 기반 클래스
        └── value-object.ts
```

### 레이어 의존성 규칙

```
interface → application → domain ← infrastructure
```

- **Domain**: TypeORM 데코레이터 외 외부 의존 최소화. Value Object는 완전 pure
- **Application**: Domain만 의존
- **Infrastructure**: Domain 인터페이스 구현 (QuotaCounter 등)
- **Interface**: Application Use Case만 호출

---

## TypeORM Active Record 규칙

### Aggregate Entity 정의

```typescript
// src/modules/communication/domain/message/message.entity.ts
import { BaseEntity, Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { AggregateRoot } from '@shared/types/aggregate-root';
import { Tone } from './tone.vo';
import { MessageContent } from './content.vo';
import { MessageSentEvent } from './events/message-sent.event';

@Entity('MESSAGE')
export class Message extends BaseEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'ID' })
  id!: string;

  @Column({ type: 'varchar', length: 50, name: 'ROOM_ID' })
  roomId!: string;

  @Column({ type: 'varchar', length: 50, name: 'SENDER_USER_ID' })
  senderUserId!: string;

  @Column({ type: 'varchar', length: 50, name: 'CLIENT_MESSAGE_ID' })
  clientMessageId!: string;

  @Column({ type: 'bigint', unsigned: true, name: 'SEQ', nullable: true })
  seq!: number | null;

  @Column({ type: 'varchar', length: 20, name: 'TONE' })
  private _tone!: string;

  @Column({ type: 'text', name: 'CONTENT' })
  private _content!: string;

  @Column({ type: 'int', unsigned: true, name: 'VERSION', default: 1 })
  version!: number;

  @Column({ type: 'datetime', precision: 3, name: 'CREATED_AT' })
  createdAt!: Date;

  // 도메인 이벤트 수집 (BaseEntity 외 AggregateRoot 혼합)
  private _domainEvents: DomainEvent[] = [];

  // ---- 팩토리 메서드 ----
  static create(props: {
    roomId: string;
    senderUserId: string;
    clientMessageId: string;
    tone: Tone;
    content: MessageContent;
  }): Message {
    if (!props.tone) throw new Error('Tone is required');

    const message = new Message();
    message.roomId = props.roomId;
    message.senderUserId = props.senderUserId;
    message.clientMessageId = props.clientMessageId;
    message._tone = props.tone.value;
    message._content = props.content.value;
    message.createdAt = new Date();
    message.version = 1;

    message.addDomainEvent(new MessageSentEvent(message));
    return message;
  }

  // ---- 도메인 동작 ----
  get tone(): Tone { return Tone.from(this._tone as any); }
  get content(): MessageContent { return MessageContent.of(this._content); }

  assignSequence(seq: number): void {
    if (this.seq !== null) throw new Error('Sequence already assigned');
    this.seq = seq;
  }

  edit(newContent: MessageContent): void {
    if (this.deletedAt) throw new Error('Cannot edit deleted message');
    this._content = newContent.value;
    this.version++;
    this.addDomainEvent(new MessageEditedEvent(this));
  }

  // ---- 도메인 이벤트 관리 ----
  addDomainEvent(event: DomainEvent) { this._domainEvents.push(event); }
  pullDomainEvents(): DomainEvent[] {
    const events = [...this._domainEvents];
    this._domainEvents = [];
    return events;
  }
}
```

### Value Object는 완전 pure 유지

```typescript
// src/modules/communication/domain/message/tone.vo.ts
// ⚠️ TypeORM 데코레이터 절대 붙이지 않음
export type ToneType = 'CHAT' | 'ASK' | 'URGENT' | 'SHARE';

export class Tone {
  private constructor(readonly value: ToneType) {}

  static chat() { return new Tone('CHAT'); }
  static ask() { return new Tone('ASK'); }
  static urgent() { return new Tone('URGENT'); }
  static share() { return new Tone('SHARE'); }
  static from(value: ToneType) { return new Tone(value); }

  canBypassFocus(): boolean { return this.value === 'URGENT'; }
  requiresQuota(): boolean { return this.value === 'URGENT'; }
  equals(other: Tone): boolean { return this.value === other.value; }
}
```

Value Object는 DB에 원시값(string)으로 저장되므로 `@Column`으로 원시값을 받고, getter에서 VO로 변환합니다.

### save() 규율 (중요)

Active Record의 편의성을 DDD 원칙과 맞추기 위한 규칙:

✅ **허용**
- **Use Case 내부에서만** `message.save()` 호출
- 하나의 Use Case가 하나의 Aggregate만 저장
- Aggregate 메서드는 상태만 변경, 저장은 Use Case가 책임

❌ **금지**
- Domain Service에서 `save()` 호출
- Controller나 Gateway에서 `save()` 직접 호출
- 한 Use Case에서 여러 Aggregate를 순차 저장 (이벤트로 연결)
- Aggregate 메서드(`message.edit()`) 내부에서 `save()` 호출

```typescript
// ✅ 좋음
public async execute(cmd: SendMessageCommand) {
  const message = Message.create({ ... });
  await message.save();  // Use Case가 명시적으로 저장
  await this.eventBus.publishAll(message.pullDomainEvents());
  return message;
}

// ❌ 나쁨
edit(newContent: MessageContent) {
  this._content = newContent.value;
  await this.save();  // Aggregate 내부에서 저장 금지
}
```

### NamingStrategy로 대문자 컬럼 자동 매핑

매 `@Column`마다 `{ name: 'FIELD_NAME' }` 적는 게 번거로우니 NamingStrategy로 camelCase → UPPER_SNAKE_CASE 자동 변환:

```typescript
// src/shared/database/naming.strategy.ts
import { DefaultNamingStrategy, NamingStrategyInterface } from 'typeorm';
import { snakeCase } from 'lodash';

export class UpperSnakeNamingStrategy extends DefaultNamingStrategy
  implements NamingStrategyInterface {

  tableName(className: string, customName: string): string {
    return customName || snakeCase(className).toUpperCase();
  }

  columnName(propertyName: string, customName: string): string {
    return customName || snakeCase(propertyName).toUpperCase();
  }

  relationName(propertyName: string): string {
    return snakeCase(propertyName).toUpperCase();
  }

  joinColumnName(relationName: string, referencedColumnName: string): string {
    return `${snakeCase(relationName).toUpperCase()}_${referencedColumnName}`;
  }
}
```

적용:

```typescript
// src/shared/database/data-source.ts
import { DataSource } from 'typeorm';
import { UpperSnakeNamingStrategy } from './naming.strategy';

export const AppDataSource = new DataSource({
  type: 'mysql',
  charset: 'utf8mb4',
  namingStrategy: new UpperSnakeNamingStrategy(),
  entities: ['src/modules/**/*.entity.ts'],
  migrations: ['src/shared/database/migrations/*.ts'],
  // ...
});
```

이제 Entity에서 `@Column()` 만 써도 자동으로 대문자 컬럼 매핑. 단 `deepwork-schema.sql`의 컬럼명과 완벽히 일치하는지 마이그레이션 시 확인.

### Domain Event 발행 흐름

```typescript
// 1. Aggregate 내부에서 이벤트 수집
class Message extends BaseEntity {
  private _domainEvents: DomainEvent[] = [];
  // edit() 등에서 this.addDomainEvent(...)
}

// 2. Use Case에서 save 후 pullDomainEvents
public async execute(cmd) {
  const message = Message.create(...);
  await message.save();
  await this.eventBus.publishAll(message.pullDomainEvents());
}

// 3. 다른 컨텍스트(Attention)가 구독
@OnEvent('MessageSent')
public async handleMessageSent(event: MessageSentEvent) {
  const decision = this.policyEvaluator.decide(...);
  // ...
}
```

이벤트는 반드시 **save 성공 이후** 발행. save 전에 발행하면 저장 실패 시 불일치 발생.

---

## 팀 분담

3인 풀스택, **바운디드 컨텍스트 단위로 수직 분담**합니다.

### 팀 A — Identity, Relationship, Workspace
계정·관계 그래프·업무 시간

- Identity: 로그인, OAuth, 2FA, 세션
- Relationship: 초대, 수락, **CommunicationNorm** ★
- Workspace: 업무 시간, Google Calendar 연동

### 팀 B — Communication
대화·메시지·실시간

- Room, Message, **Tone** ★, **HandRaise** ★
- WebSocket 게이트웨이
- 메시지 검색 (Meilisearch, Phase 3+)

### 팀 C — Attention, Catchup
상태·알림·피드·데스크톱

- Attention: **Presence** ★, **알림 파이프라인** ★, **FocusSession** ★
- Catchup: **따라잡기 피드** ★ (CQRS Read Model)
- Electron 메인 프로세스, 배포

### CODEOWNERS

`.github/CODEOWNERS`에 컨텍스트별 책임자 명시.
`packages/shared-types`와 TypeORM 마이그레이션 파일 변경은 **전원 리뷰** 필수.

---

## Core 컨텍스트 상세

### Communication Context

**Ubiquitous Language**: Room, Message, Tone, HandRaise, Sequence, Quota

**Aggregates**:
- `Room` — 2~50명 멤버
- `Message` — Tone 필수, ClientMessageId로 멱등성
- `HandRaise` — ASK 톤에 대한 응답 의사

**Domain Services**:
- `RoomSequenceGenerator` — Redis INCR로 Sequence 발급
- `UrgentQuotaService` — 일일 3회 제한

**주요 Domain Events**:
```typescript
MessageSent        { messageId, roomId, senderId, tone, sequence, content, sentAt }
MessageEdited      { messageId, newContent, version }
HandRaised         { messageId, responderId, roomId }
RoomCreated        { roomId, type, memberIds }
```

**Aggregate 불변식**:
- Tone 없이 Message 생성 불가
- Sequence는 방 내 단조 증가 (Redis INCR 보장)
- URGENT 전송 시 UrgentQuotaService 먼저 consume

### Attention Context

**Ubiquitous Language**: Presence, FocusSession, AttentionDecision, Notification

**Aggregates**:
- `Presence` — User당 1개 (FREE/WORKING/FOCUS/OFF)
- `FocusSession` — 뽀모도로 1회
- `NotificationPolicy` — 사용자별 설정

**핵심 Domain Service**: `AttentionPolicyEvaluator`

| 수신자 \ 톤 | CHAT | ASK | URGENT | SHARE |
|---|---|---|---|---|
| FREE | IMMEDIATE | IMMEDIATE | IMMEDIATE | IMMEDIATE |
| WORKING | BATCHED(2h) | IMMEDIATE | IMMEDIATE | BATCHED(2h) |
| FOCUS | QUEUED | QUEUED | IMMEDIATE_QUIET | QUEUED |
| OFF | QUEUED | QUEUED | IMMEDIATE | DROPPED |

**주의**: Presence의 실시간 상태는 Redis에만. DB `PRESENCE_SNAPSHOT`은 마지막 관측 상태만 기록.

### Relationship Context

**Ubiquitous Language**: Friendship, Invitation, CommunicationNorm, Peer

**Aggregates**:
- `Friendship` — 양방향 수락, PENDING/ACCEPTED/BLOCKED/REMOVED
- `Invitation` — 1회용 토큰
- `CommunicationNorm` — Friendship당 2개 (각자 관점)

---
### AttentionPolicyEvaluator 매트릭스 테스트 (필수)

알림 파이프라인은 **16개 조합 + Norm 오버라이드 전부 테스트**. 이게 제품의 심장이므로 TDD 엄수.

### 반드시 테스트할 것

- **AttentionPolicyEvaluator 매트릭스 16개 조합**
- Aggregate invariant 위반 케이스
- Domain Event 발행
- URGENT 쿼터 경계값 (정확히 3회/4회)
- Message Sequence 동시성
- ClientMessageId 멱등성
- Friendship 상태 전이 규칙

---

## 저장소 전략

### 컨텍스트별 저장소

| 컨텍스트 | 주 저장소 | 보조 |
|---|---|---|
| Communication | MySQL (핫 90일) | S3 Parquet, Meilisearch |
| Attention | **Redis (실시간)** | MySQL (지표 스냅샷) |
| Relationship | MySQL | Redis (Norm 캐시) |
| Identity | MySQL | Redis (세션 블랙리스트) |
| Catchup | **Redis only** | — |
| Workspace | MySQL | — |

### Redis 키 네이밍

```
room:seq:{ROOM_ID}              # Sequence 발급 (INCR, 영구)
presence:{USER_ID}              # 프레즌스 (TTL 60초)
urgent:quota:{UID}:{YYYYMMDD}   # 급함 쿼터 (TTL 48h)
feed:{USER_ID}                  # 피드 캐시 (TTL 1h)
typing:{ROOM_ID}:{UID}          # 타이핑 (TTL 5초)
read:{ROOM_ID}:{UID}            # 읽음 SEQ (영구, 30초 플러시)
norm:{OWNER}:{FRIEND}           # 규범 캐시 (TTL 10분)
```

### BullMQ 큐

```
attention:notification:immediate
attention:notification:scheduled
communication:message:index
```

---

## 코딩 컨벤션

### 도메인 모델링 규칙

1. **Value Object는 pure** — TypeORM 데코레이터 금지
2. **Aggregate는 @Entity 허용** — Active Record의 `BaseEntity` 상속
3. **Aggregate 간 ID로만 참조** — 객체 참조 금지
   ```typescript
   // ✅ Message.roomId: string
   // ❌ Message.room: Room
   ```
4. **도메인 이벤트는 과거형 동사** — `MessageSent` ✅, `SendMessage` ❌
5. **Use Case가 트랜잭션 경계**
6. **Aggregate save는 Use Case에서만**

### 네이밍

| 대상 | 컨벤션 | 예시 |
|---|---|---|
| 파일 | kebab-case | `send-message.usecase.ts` |
| Entity/Aggregate | PascalCase | `Message`, `Presence` |
| Value Object 파일 | `.vo.ts` 접미사 | `tone.vo.ts` |
| Entity 파일 | `.entity.ts` 접미사 | `message.entity.ts` |
| Use Case 파일 | `.usecase.ts` 접미사 | `send-message.usecase.ts` |
| Domain Event 파일 | `.event.ts` 접미사 | `message-sent.event.ts` |
| DB 테이블명 | UPPER_SNAKE_CASE | `MESSAGE`, `COMMUNICATION_NORM` |
| DB 컬럼명 | UPPER_SNAKE_CASE (NamingStrategy 자동) | `CREATED_AT` |
| TS 필드명 | camelCase | `createdAt` |

### TypeScript

- `strict: true` 필수
- `any` 금지. 꼭 필요하면 `unknown` + 타입 가드
- 함수 반환 타입 명시
- `packages/shared-types`의 이벤트 스키마는 Zod

### 커밋 메시지

```
feat(communication): Message Tone 필수 검증 추가
fix(attention): Presence TTL race condition 해결
refactor(relationship): Norm을 VO로 분리
docs: ADR-008 TypeORM Active Record 선택
```

scope는 **바운디드 컨텍스트 이름** 또는 `shared`, `infra`.

### 브랜치

- `main`: 항상 배포 가능
- 작업: `feat/communication-hand-raise`
- 1~3일 안에 머지

---

## 주요 기술 결정 (ADR)

| ID | 결정 | 근거 |
|---|---|---|
| ADR-001 | Message Sequence는 Redis INCR | 방별 단조 증가, 고성능 |
| ADR-002 | 메시지 전송 = HTTP, 수신 = WebSocket | 재시도 분리 |
| ADR-003 | 로컬 캐시는 SQLite | 오프라인 UX |
| ADR-004 | 큐는 BullMQ | 3인팀 운영 부담 최소화 |
| ADR-005 | MESSAGE 월별 RANGE 파티션 | 오래된 데이터 S3 아카이브 |
| ADR-006 | NestJS 모듈 = 바운디드 컨텍스트 | DDD와 NestJS 정합 |
| ADR-007 | 이벤트 버스: in-memory → Redis pub/sub | 단계적 복잡성 |
| ADR-008 | **TypeORM + Active Record** | 3인팀 개발 속도 우선, Persistence Entity 분리 생략 |

---

## 보안·프라이버시

- bcrypt cost factor 12 이상
- JWT access 15분 / refresh 7일, 로테이션
- `.env` 커밋 금지
- 이메일 부분 일치 검색 금지 (정확 일치만)
- 메시지 저장 시 at-rest AES-256
- 삭제 요청 30일 내 파기
- 친구 관계는 양방향 수락만

---

## Claude Code 작업 가이드

### 코드 생성 전 반드시 확인

1. **어느 바운디드 컨텍스트에 속하는가?** → 맞는 `modules/` 폴더
2. **Value Object인가 Aggregate인가?** → VO는 `.vo.ts` (pure), Aggregate는 `.entity.ts`
3. **다른 컨텍스트와 통신 필요?** → 동기면 ACL, 비동기면 Domain Event
4. **`packages/shared-types`에 이벤트 스키마 추가 필요?**
5. **TypeORM 마이그레이션 필요?** (`npm run migration:generate`)

### Claude Code가 지켜야 할 것

- Value Object에는 **절대 TypeORM 데코레이터 부착 금지**
- Aggregate Entity는 `BaseEntity` 상속
- `save()`는 **Use Case에서만** 호출
- Aggregate 간은 **ID로만 참조**
- Domain Event는 과거형, `pullDomainEvents()` 는 save 이후
- Repository 인터페이스 정의 후 TypeORM BaseEntity로 구현 대체 가능
- Use Case 하나 = Aggregate 하나 수정
- Domain Service는 외부 의존을 **인터페이스로** 주입받음 (예: `QuotaCounter`)

### Claude Code가 하지 말아야 할 것

- **Value Object에 `@Entity`, `@Column` 부착**
- **Aggregate 메서드 내부에서 `save()` 호출** (`edit()` 안에서 save 금지)
- **Controller나 Gateway에서 `save()` 직접 호출**
- **한 Use Case에서 여러 Aggregate 저장** (이벤트로 연결)
- **MySQL에 Presence·Quota·Queue·Feed 저장** (Redis·BullMQ로)
- **다른 컨텍스트의 Entity 직접 import** (ACL 경유)
- **MESSAGE Entity에 @ManyToOne 관계 추가** (파티션 테이블, ID 참조만)
- **Tone·Presence 값을 `string` 하드코딩** (VO 사용)
- **save 전에 이벤트 발행** (불일치 위험)
- **NamingStrategy 우회해서 `@Column({ name: 'customCamelCase' })` 작성**

### 새 기능 구현 체크리스트

- [ ] 기능 ID 확인 (A1, B6 등)
- [ ] 소속 바운디드 컨텍스트 확인
- [ ] Aggregate 결정 (새로 / 확장)
- [ ] Value Object 필요성 검토
- [ ] Domain Event 정의 (`shared-types`에 Zod 스키마)
- [ ] TDD: Value Object → Domain Service → Aggregate → Use Case
- [ ] TypeORM 마이그레이션 생성 (`npm run migration:generate src/shared/database/migrations/...`)
- [ ] Controller·Gateway 연결
- [ ] Integration 테스트 (Testcontainers)
- [ ] PR 템플릿 작성

---

## 자주 쓰는 명령어

```bash
# 개발 환경
pnpm install
docker compose up -d                                  # MySQL·Redis·Mailhog
pnpm dev                                              # 전체 실행
pnpm --filter @deepwork/api dev                       # API만

# TypeORM
pnpm --filter @deepwork/api typeorm migration:generate src/shared/database/migrations/AddMessageTable -d src/shared/database/data-source.ts
pnpm --filter @deepwork/api typeorm migration:run -d src/shared/database/data-source.ts
pnpm --filter @deepwork/api typeorm migration:revert -d src/shared/database/data-source.ts
pnpm --filter @deepwork/api typeorm schema:log -d src/shared/database/data-source.ts

# 테스트
pnpm test                                             # 전체
pnpm --filter @deepwork/api test:unit                 # 도메인·VO·유스케이스
pnpm --filter @deepwork/api test:integration          # Testcontainers
pnpm --filter @deepwork/api test:watch                # TDD 모드
pnpm lint
pnpm typecheck

# Turborepo
pnpm build --filter=[HEAD^1]
turbo run lint test
```

---

## 용어 사전 (컨텍스트별)

같은 단어가 컨텍스트마다 다른 의미입니다.

| 용어 | Communication | Attention | Relationship |
|---|---|---|---|
| User | 발신자/수신자 ID | 상태의 주체 | Peer (양쪽) |
| Message | Aggregate | 알림 트리거 | — |
| Tone | Value Object | 정책 입력값 | Norm 기본값 |
| Norm | (참조만) | (참조만) | Aggregate |
| Presence | — | Aggregate | 공유 설정 대상 |

---

## 참고 문서

- `docs/prd/deepwork-prd.md` — 제품 요구사항 문서 (DDD 버전)
- `docs/schema/deepwork-schema.sql` — DDL 원본
- `docs/adr/` — 아키텍처 결정 기록
- `docs/runbook/` — 장애 대응·배포
- 프로토타입: `docs/design/prototype/`