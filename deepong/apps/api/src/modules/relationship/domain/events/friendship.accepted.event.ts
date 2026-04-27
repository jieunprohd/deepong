import {DomainEvent} from '@shared/types/domain-event.interface';

export class FriendshipAcceptedEvent implements DomainEvent {
    readonly eventName = 'FriendshipAcceptedEvent';
    readonly occurredAt: Date = new Date();

    constructor(
        readonly aggregateId: number,
        readonly requestUserId: number,
        readonly addressedUserId: number,
        readonly acceptedAt: Date,
    ) {}
}
