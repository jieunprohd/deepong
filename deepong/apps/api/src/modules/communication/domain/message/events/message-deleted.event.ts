import { DomainEvent } from '@shared/types/domain-event.interface';

export class MessageDeletedEvent implements DomainEvent {
  readonly eventName = 'MessageDeletedEvent';
  readonly occurredAt = new Date();

  constructor(
    readonly aggregateId: number,
    readonly roomId: number,
    readonly seq: number,
    readonly deletedAt: Date,
  ) {}
}
