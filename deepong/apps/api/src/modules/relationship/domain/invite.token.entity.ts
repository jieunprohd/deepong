import {Column, CreateDateColumn, Entity, PrimaryGeneratedColumn,} from 'typeorm';
import {AggregateRoot} from '@shared/types/aggregate-root.base';

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
        const token = new InviteToken();
        token.token = props.token;
        token.issuerUserId = props.issuerUserId;
        token.singleUse = props.singleUse;
        token.maxUseCount = props.maxUseCount;
        token.expiresAt = this.calculateExpiresAt(props.ttlHours);
        return token;
    }

    private static calculateExpiresAt(ttlHours: number): Date {
        const now = new Date();
        return new Date(now.getTime() + ttlHours * 60 * 60 * 1000);
    }

}
