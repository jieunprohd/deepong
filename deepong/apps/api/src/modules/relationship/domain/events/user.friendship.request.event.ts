import {DomainEvent} from '@shared/types/domain-event.interface';

export class UserFriendshipRequestEvent implements DomainEvent {
    readonly eventName = 'UserFriendshipRequestEvent';
    readonly occurredAt: Date;

    constructor(readonly aggregateId: number) {
        this.occurredAt = new Date();
    }
}
