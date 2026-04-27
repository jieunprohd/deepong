import {DomainEvent} from '@shared/types/domain-event.interface';

export class UserFriendshipResponseEvent implements DomainEvent {
    readonly eventName = 'UserFriendshipResponseEvent';
    readonly occurredAt: Date;

    constructor(
        readonly aggregateId: number,
        readonly email: string,
    ) {
        this.occurredAt = new Date();
    }
}
