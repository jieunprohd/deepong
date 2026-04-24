import { DomainEvent } from '@shared/types/domain-event.interface';

export class UserSignedUpEvent implements DomainEvent {
  readonly eventName = 'UserSignedUp';
  readonly occurredAt: Date;

  constructor(
    readonly aggregateId: number,
    readonly email: string,
  ) {
    this.occurredAt = new Date();
  }
}
