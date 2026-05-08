import { DomainEvent } from '@shared/types/domain-event.interface';

/**
 * 집중 세션이 시작됐을 때 발행.
 * 프레즌스를 FOCUS로 자동 전환하는 후속 처리에 활용.
 */
export class FocusStartedEvent implements DomainEvent {
  public readonly eventName = 'attention.focus-started';
  public readonly occurredAt: Date;
  public readonly aggregateId: number;

  constructor(
    public readonly sessionId: number,
    public readonly userId: number,
    public readonly plannedMinutes: number,
    public readonly startedAt: Date,
  ) {
    this.aggregateId = sessionId;
    this.occurredAt = startedAt;
  }
}
