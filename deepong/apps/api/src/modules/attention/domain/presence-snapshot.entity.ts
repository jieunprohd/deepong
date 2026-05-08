import { Column, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';
import { AggregateRoot } from '@shared/types/aggregate-root.base';
import { Presence, PresenceType } from './presence.vo';
import { PresenceChangedEvent } from './events/presence-changed.event';

/**
 * PresenceSnapshot Aggregate
 *
 * 사용자별 1개. 마지막으로 관측된 프레즌스를 DB에 영속화한다.
 * 실시간 정확도가 필요한 경우는 Redis(`presence:{userId}` TTL 60s)를 보고,
 * Redis에 키가 없을 때 fallback으로 이 스냅샷을 사용한다.
 *
 * AttentionPolicyEvaluator는 Redis가 우선, 없으면 LAST_STATUS를 입력으로 받는다.
 */
@Entity('PRESENCE_SNAPSHOT')
export class PresenceSnapshot extends AggregateRoot {
  @PrimaryColumn({ type: 'bigint', unsigned: true })
  userId!: number;

  @Column({
    type: 'enum',
    enum: ['FREE', 'WORKING', 'FOCUS', 'OFF'],
    default: 'OFF',
    name: 'LAST_STATUS',
  })
  lastStatus!: PresenceType;

  @Column({ type: 'datetime', nullable: true, name: 'LAST_ONLINE_AT' })
  lastOnlineAt!: Date | null;

  @Column({ type: 'datetime', nullable: true, name: 'LAST_FOCUS_START_AT' })
  lastFocusStartAt!: Date | null;

  @UpdateDateColumn({ name: 'UPDATED_AT' })
  updatedAt!: Date;

  // ---- Factory ----

  static initial(userId: number): PresenceSnapshot {
    const s = new PresenceSnapshot();
    s.userId = userId;
    s.lastStatus = 'OFF';
    s.lastOnlineAt = null;
    s.lastFocusStartAt = null;
    return s;
  }

  // ---- Domain Methods ----

  /** 현재 프레즌스를 VO로 반환 */
  getPresence(): Presence {
    return Presence.from(this.lastStatus);
  }

  /**
   * 새 프레즌스로 전환. 같은 값이면 no-op.
   * FOCUS로 전환 시 lastFocusStartAt 갱신.
   * 변경이 발생하면 도메인 이벤트 추가.
   */
  changeTo(next: Presence, now: Date = new Date()): void {
    const previous = this.lastStatus;
    if (previous === next.value) {
      this.lastOnlineAt = now;
      return;
    }

    this.lastStatus = next.value;
    this.lastOnlineAt = now;
    if (next.isFocus()) {
      this.lastFocusStartAt = now;
    }

    this.addDomainEvent(
      new PresenceChangedEvent(this.userId, previous, next.value, now),
    );
  }
}
