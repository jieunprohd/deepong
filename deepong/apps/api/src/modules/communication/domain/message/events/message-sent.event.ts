import { DomainEvent } from '@shared/types/domain-event.interface';

export class MessageSentEvent implements DomainEvent {
  readonly eventName = 'MessageSentEvent';
  readonly occurredAt = new Date();

  constructor(
    readonly aggregateId: number,
    readonly roomId: number,
    readonly senderUserId: number,
    readonly tone: string,
    readonly seq: number,
    readonly content: string,
    readonly sentAt: Date,
  ) {}
}
