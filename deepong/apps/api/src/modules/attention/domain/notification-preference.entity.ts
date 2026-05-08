import { Column, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';
import { AggregateRoot } from '@shared/types/aggregate-root.base';

/**
 * NotificationPreference Aggregate
 *
 * 사용자별 1개. 알림 정책의 사용자 차원 설정.
 *  - batchIntervalMin: BATCHED 알림이 모아지는 단위 시간(분). AttentionPolicyEvaluator가 scheduledAt 계산에 사용.
 *  - allowUrgentInFocus: 집중 모드 중에도 URGENT 알림을 즉시 받을지.
 *  - osNotification / inAppToast: 데스크톱 알림 채널 토글.
 *  - sound*: 톤별 알림음 키.
 */
@Entity('NOTIFICATION_PREFERENCE')
export class NotificationPreference extends AggregateRoot {
  @PrimaryColumn({ type: 'bigint', unsigned: true })
  userId!: number;

  @Column({ type: 'int', unsigned: true, default: 120 })
  batchIntervalMin!: number;

  @Column({ type: 'boolean', default: true })
  allowUrgentInFocus!: boolean;

  @Column({ type: 'varchar', length: 50, nullable: true })
  soundChat!: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  soundAsk!: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  soundUrgent!: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  soundShare!: string | null;

  @Column({ type: 'boolean', default: true })
  osNotification!: boolean;

  @Column({ type: 'boolean', default: true })
  inAppToast!: boolean;

  @UpdateDateColumn()
  updatedAt!: Date;

  // ---- Factory ----

  static defaultsFor(userId: number): NotificationPreference {
    const p = new NotificationPreference();
    p.userId = userId;
    p.batchIntervalMin = 120;
    p.allowUrgentInFocus = true;
    p.soundChat = null;
    p.soundAsk = null;
    p.soundUrgent = null;
    p.soundShare = null;
    p.osNotification = true;
    p.inAppToast = true;
    return p;
  }

  // ---- Domain Methods ----

  update(patch: {
    batchIntervalMin?: number;
    allowUrgentInFocus?: boolean;
    soundChat?: string | null;
    soundAsk?: string | null;
    soundUrgent?: string | null;
    soundShare?: string | null;
    osNotification?: boolean;
    inAppToast?: boolean;
  }): void {
    if (patch.batchIntervalMin !== undefined) {
      if (patch.batchIntervalMin < 5 || patch.batchIntervalMin > 480) {
        throw new Error('batchIntervalMin은 5분~480분 사이여야 합니다.');
      }
      this.batchIntervalMin = patch.batchIntervalMin;
    }
    if (patch.allowUrgentInFocus !== undefined)
      this.allowUrgentInFocus = patch.allowUrgentInFocus;
    if (patch.soundChat !== undefined) this.soundChat = patch.soundChat;
    if (patch.soundAsk !== undefined) this.soundAsk = patch.soundAsk;
    if (patch.soundUrgent !== undefined) this.soundUrgent = patch.soundUrgent;
    if (patch.soundShare !== undefined) this.soundShare = patch.soundShare;
    if (patch.osNotification !== undefined)
      this.osNotification = patch.osNotification;
    if (patch.inAppToast !== undefined) this.inAppToast = patch.inAppToast;
  }
}
