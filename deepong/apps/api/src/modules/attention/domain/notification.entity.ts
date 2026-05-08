import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { AggregateRoot } from '@shared/types/aggregate-root.base';
import { ToneType } from './tone.vo';
import { PresenceType } from './presence.vo';
import { AttentionDecision, DeliveryMethod } from './attention-decision.vo';
import { NotificationCreatedEvent } from './events/notification-created.event';

export type NotificationDeliveryStatus =
  | 'PENDING'
  | 'DELIVERED'
  | 'FAILED'
  | 'CANCELLED';

/**
 * Notification Aggregate
 *
 * 메시지 1건이 수신자에게 어떻게 전달될지 결정된 결과의 영속체.
 * AttentionPolicyEvaluator의 산출물로 만들어진다.
 *
 *  - DELIVERY_METHOD: IMMEDIATE/BATCHED/QUEUED/DROPPED (전달 정책)
 *  - DELIVERY_STATUS: PENDING → DELIVERED/FAILED/CANCELLED (전달 단계 추적)
 *
 *  IMMEDIATE_QUIET은 별도 컬럼이 없어 IMMEDIATE + 별도 플래그로 처리하지만
 *  현재 스키마에는 quiet 플래그가 없어 method=IMMEDIATE 만 저장.
 *  (필요 시 마이그레이션으로 IS_QUIET 컬럼 추가 — 향후 과제)
 */
@Entity('NOTIFICATION')
export class Notification extends AggregateRoot {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: number;

  @Column({ type: 'bigint', unsigned: true })
  userId!: number;

  @Column({ type: 'bigint', unsigned: true })
  messageId!: number;

  @Column({
    type: 'enum',
    enum: ['IMMEDIATE', 'BATCHED', 'QUEUED', 'DROPPED'],
  })
  deliveryMethod!: DeliveryMethod;

  @Column({
    type: 'enum',
    enum: ['PENDING', 'DELIVERED', 'FAILED', 'CANCELLED'],
    default: 'PENDING',
  })
  deliveryStatus!: NotificationDeliveryStatus;

  @Column({ type: 'enum', enum: ['CHAT', 'ASK', 'URGENT', 'SHARE'] })
  triggerTone!: ToneType;

  @Column({ type: 'enum', enum: ['FREE', 'WORKING', 'FOCUS', 'OFF'] })
  triggerPresence!: PresenceType;

  @Column({ type: 'datetime', nullable: true })
  scheduledAt!: Date | null;

  @Column({ type: 'datetime', nullable: true })
  deliveredAt!: Date | null;

  @CreateDateColumn()
  createdAt!: Date;

  // ---- Factory ----

  static fromDecision(props: {
    userId: number;
    messageId: number;
    decision: AttentionDecision;
    tone: ToneType;
    presence: PresenceType;
  }): Notification {
    const n = new Notification();
    n.userId = props.userId;
    n.messageId = props.messageId;
    n.deliveryMethod = props.decision.method;
    n.deliveryStatus = props.decision.isDropped() ? 'CANCELLED' : 'PENDING';
    n.triggerTone = props.tone;
    n.triggerPresence = props.presence;
    n.scheduledAt = props.decision.scheduledAt;
    n.deliveredAt = null;

    n.addDomainEvent(
      new NotificationCreatedEvent(
        n.id,
        n.userId,
        n.messageId,
        n.deliveryMethod,
        n.triggerTone,
        n.triggerPresence,
        n.scheduledAt,
      ),
    );
    return n;
  }

  // ---- Domain Methods ----

  markDelivered(now: Date = new Date()): void {
    if (this.deliveryStatus !== 'PENDING') {
      throw new Error(
        `PENDING 상태가 아닌 알림은 전달 완료 처리할 수 없습니다 (현재: ${this.deliveryStatus}).`,
      );
    }
    this.deliveryStatus = 'DELIVERED';
    this.deliveredAt = now;
  }

  markFailed(): void {
    if (this.deliveryStatus !== 'PENDING') return;
    this.deliveryStatus = 'FAILED';
  }

  cancel(): void {
    if (this.deliveryStatus === 'DELIVERED') {
      throw new Error('이미 전달된 알림은 취소할 수 없습니다.');
    }
    this.deliveryStatus = 'CANCELLED';
  }

  isPending(): boolean {
    return this.deliveryStatus === 'PENDING';
  }
}
