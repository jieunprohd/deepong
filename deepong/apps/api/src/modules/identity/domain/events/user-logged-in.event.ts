import { DomainEvent } from '@shared/types/domain-event.interface';

export class UserLoggedInEvent implements DomainEvent {
  readonly eventName = 'UserLoggedIn';
  readonly occurredAt: Date;

  constructor(readonly aggregateId: number) {
    this.occurredAt = new Date();
  }
}
