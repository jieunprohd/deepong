import {DomainEvent} from '@shared/types/domain-event.interface';

export class InvitationCreatedEvent implements DomainEvent {
    readonly eventName = 'InvitationCreatedEvent';
    readonly occurredAt: Date = new Date();

    constructor(readonly aggregateId: number, readonly invitationId: number, readonly issuerUserId: number, readonly token: string, readonly expiresAt: Date, readonly createdAt: Date) {
        this.occurredAt = new Date();
    }
}
