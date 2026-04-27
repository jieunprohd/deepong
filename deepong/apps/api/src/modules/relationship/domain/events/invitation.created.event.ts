import {DomainEvent} from '@shared/types/domain-event.interface';

export class InvitationCreatedEvent implements DomainEvent {
    readonly eventName = 'InvitationCreatedEvent';
    readonly occurredAt: Date;

    constructor(readonly aggregateId: number) {
        this.occurredAt = new Date();
    }
}
