import {Column, CreateDateColumn, Entity, PrimaryGeneratedColumn,} from 'typeorm';
import {AggregateRoot} from '@shared/types/aggregate-root.base';

@Entity('INVITE_TOKEN')
export class InviteToken extends AggregateRoot {
    // ---- Factory Methods ----
    public static issueInviteToken
    @PrimaryGeneratedColumn({type: 'bigint', unsigned: true})
    id!: number;
    @Column({type: 'bigint'})
    requestUserId!: number;
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

    // ---- Query Methods ----
    @CreateDateColumn()
    createdAt!: Date;

}
