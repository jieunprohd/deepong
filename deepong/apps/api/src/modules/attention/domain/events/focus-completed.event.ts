import { DomainEvent } from '@shared/types/domain-event.interface';

/**
 * 집중 세션이 종료(완주 또는 중단)됐을 때 발행.
 * Catchup 모듈이 구독하여 보류 알림 flush, 프레즌스를 WORKING/FREE로 복귀.
 */
export class FocusCompletedEvent implements DomainEvent {
  public readonly eventName = 'attention.focus-completed';
  public readonly occurredAt: Date;
  public readonly aggregateId: number;

  constructor(
    public readonly sessionId: number,
    public readonly userId: number,
    public readonly completed: boolean,
    public readonly actualMinutes: number,
    public readonly endedAt: Date,
  ) {
    this.aggregateId = sessionId;
    this.occurredAt = endedAt;
  }
}
