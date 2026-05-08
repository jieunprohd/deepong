import { DomainEvent } from '@shared/types/domain-event.interface';
import { PresenceType } from '../presence.vo';

/**
 * 사용자의 프레즌스가 변경됐을 때 발행.
 * Catchup/Notification 모듈이 구독하여 보류 중이던 BATCHED 알림 flush 등을 트리거.
 */
export class PresenceChangedEvent implements DomainEvent {
  public readonly eventName = 'attention.presence-changed';
  public readonly occurredAt: Date;
  public readonly aggregateId: number;

  constructor(
    public readonly userId: number,
    public readonly previousStatus: PresenceType,
    public readonly currentStatus: PresenceType,
    occurredAt: Date = new Date(),
  ) {
    this.aggregateId = userId;
    this.occurredAt = occurredAt;
  }
}
