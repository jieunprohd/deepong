import {Column, CreateDateColumn, Entity, PrimaryGeneratedColumn,} from 'typeorm';
import {AggregateRoot} from '@shared/types/aggregate-root.base';
import {InvitationCreatedEvent} from '@modules/relationship/domain/events/invitation.created.event';

@Entity('INVITE_TOKEN')
export class InviteToken extends AggregateRoot {
    @PrimaryGeneratedColumn({type: 'bigint', unsigned: true})
    id!: number;

    @Column({type: 'varchar', length: 64})
    token!: string;

    @Column({type: 'bigint'})
    issuerUserId!: number;

    @Column({type: 'boolean'})
    singleUse!: boolean;

    @Column({type: 'int'})
    maxUseCount!: number;

    @Column({type: 'int', default: 0})
    usedCount!: number;

    @Column({type: 'datetime'})
    expiresAt!: Date;

    @CreateDateColumn()
    createdAt!: Date;

    // ---- Query Methods ----

    // ---- Factory Methods ----
    public static issueInviteToken(props: {
        token: string;
        issuerUserId: number;
        singleUse: boolean;
        maxUseCount: number;
        ttlHours: number;
    }): InviteToken {
        if (props.maxUseCount < 1) {
            throw new Error('maxUseCount는 1 이상이어야 합니다.');
        }
        if (props.singleUse && props.maxUseCount !== 1) {
            throw new Error('singleUse 토큰의 maxUseCount는 1이어야 합니다.');
        }
        if (props.ttlHours < 1) {
            throw new Error('ttlHours는 1 이상이어야 합니다.');
        }

        const inviteToken = new InviteToken();
        inviteToken.token = props.token;
        inviteToken.issuerUserId = props.issuerUserId;
        inviteToken.singleUse = props.singleUse;
        inviteToken.maxUseCount = props.maxUseCount;
        inviteToken.usedCount = 0;
        inviteToken.expiresAt = this.calculateExpiresAt(props.ttlHours);
        return inviteToken;
    }

    // ---- Domain Methods ----
    public recordCreated(): void {
        this.addDomainEvent(
            new InvitationCreatedEvent(
                this.id,
                this.issuerUserId,
                this.token,
                this.expiresAt,
                this.createdAt,
            ),
        );
    }

    private static calculateExpiresAt(ttlHours: number): Date {
        const now = new Date();
        return new Date(now.getTime() + ttlHours * 60 * 60 * 1000);
    }
}
