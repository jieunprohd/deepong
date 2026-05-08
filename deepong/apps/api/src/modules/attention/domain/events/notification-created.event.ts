import { DomainEvent } from '@shared/types/domain-event.interface';
import { DeliveryMethod } from '../attention-decision.vo';
import { ToneType } from '../tone.vo';
import { PresenceType } from '../presence.vo';

/**
 * AttentionPolicyEvaluator가 결정한 전달 방식으로 Notification 레코드가 만들어졌을 때 발행.
 *
 * Catchup 모듈이 구독하여 피드 Read Model 갱신.
 * 향후 BullMQ 큐로 발송 처리 단계와 연결한다.
 */
export class NotificationCreatedEvent implements DomainEvent {
  public readonly eventName = 'attention.notification-created';
  public readonly occurredAt: Date;
  public readonly aggregateId: number;

  constructor(
    public readonly notificationId: number,
    public readonly userId: number,
    public readonly messageId: number,
    public readonly deliveryMethod: DeliveryMethod,
    public readonly tone: ToneType,
    public readonly presence: PresenceType,
    public readonly scheduledAt: Date | null,
    occurredAt: Date = new Date(),
  ) {
    this.aggregateId = notificationId;
    this.occurredAt = occurredAt;
  }
}
