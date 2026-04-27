import {Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn,} from 'typeorm';
import {AggregateRoot} from '@shared/types/aggregate-root.base';
import {FriendshipStatus} from "@modules/relationship/domain/friendship.status.type";
import {FriendshipInviteSource} from "@modules/relationship/domain/friendship.invite.source.type";

@Entity('FRIENDSHIP')
export class FriendshipEntity extends AggregateRoot {
    @PrimaryGeneratedColumn({type: 'bigint', unsigned: true})
    id!: number;

    @Column({type: 'bigint'})
    requestUserId!: number;

    @Column({type: 'bigint'})
    addressedUserId!: number;

    @Column({type: 'enum', enum: FriendshipStatus})
    status!: FriendshipStatus;

    @Column({type: 'enum', enum: FriendshipInviteSource})
    inviteSource!: FriendshipInviteSource;

    @Column({type: 'datetime', nullable: true})
    acceptedAt!: Date | null;

    @Column({type: 'datetime', nullable: true})
    blockedAt!: Date | null;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;

    // ---- Query Methods ----

    // ---- Factory Methods ----

}
