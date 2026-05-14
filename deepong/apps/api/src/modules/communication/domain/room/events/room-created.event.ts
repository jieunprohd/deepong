import { DomainEvent } from '@shared/types/domain-event.interface';

export class RoomCreatedEvent implements DomainEvent {
  readonly eventName = 'RoomCreatedEvent';
  readonly occurredAt = new Date();

  constructor(
    readonly aggregateId: number,
    readonly type: string,
    readonly memberIds: number[],
  ) {}
}
