import { DomainEvent } from '@shared/types/domain-event.interface';

export class MessageEditedEvent implements DomainEvent {
  readonly eventName = 'MessageEditedEvent';
  readonly occurredAt = new Date();

  constructor(
    readonly aggregateId: number,
    readonly roomId: number,
    readonly newContent: string,
    readonly version: number,
    readonly editedAt: Date,
  ) {}
}
