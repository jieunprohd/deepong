import {DomainEvent} from '@shared/types/domain-event.interface';

export class FriendshipRemovedEvent implements DomainEvent {
    readonly eventName = 'FriendshipRemovedEvent';
    readonly occurredAt: Date = new Date();

    constructor(
        readonly aggregateId: number,
        readonly ownerUserId: number,
        readonly peerUserId: number,
        readonly removedAt: Date
    ) {
    }
}
