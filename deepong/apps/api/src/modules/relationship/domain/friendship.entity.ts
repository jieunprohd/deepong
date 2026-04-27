import {Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn,} from 'typeorm';
import {AggregateRoot} from '@shared/types/aggregate-root.base';
import {FriendshipStatus} from "@modules/relationship/domain/friendship.status.type";
import {FriendshipInviteSource} from "@modules/relationship/domain/friendship.invite.source.type";
import {FriendshipAcceptedEvent} from "@modules/relationship/domain/events/friendship.accepted.event";

@Entity('FRIENDSHIP')
export class Friendship extends AggregateRoot {
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
    public static findBetween(userIdA: number, userIdB: number): Promise<Friendship | null> {
        return this.createQueryBuilder<Friendship>('friendship')
            .where(
                '(friendship.requestUserId = :a AND friendship.addressedUserId = :b) OR ' +
                '(friendship.requestUserId = :b AND friendship.addressedUserId = :a)',
                {a: userIdA, b: userIdB},
            )
            .getOne();
    }

    // ---- Factory Methods ----
    public static request(props: {
        requestUserId: number;
        addressedUserId: number;
        inviteSource: FriendshipInviteSource;
    }): Friendship {
        if (props.requestUserId === props.addressedUserId) {
            throw new Error('자기 자신과는 친구 관계를 맺을 수 없습니다.');
        }

        const friendship = new Friendship();
        friendship.requestUserId = props.requestUserId;
        friendship.addressedUserId = props.addressedUserId;
        friendship.status = FriendshipStatus.PENDING;
        friendship.inviteSource = props.inviteSource;
        friendship.acceptedAt = null;
        friendship.blockedAt = null;
        return friendship;
    }

    // ---- Domain Methods ----
    public accept(): void {
        if (this.status !== FriendshipStatus.PENDING) {
            throw new Error(`PENDING 상태에서만 수락할 수 있습니다 (현재: ${this.status}).`);
        }
        this.status = FriendshipStatus.ACCEPTED;
        this.acceptedAt = new Date();
    }

    public block(): void {
        if (this.status === FriendshipStatus.BLOCKED) {
            return;
        }
        this.status = FriendshipStatus.BLOCKED;
        this.blockedAt = new Date();
    }

    public markRemoved(): void {
        if (this.status === FriendshipStatus.REMOVED) {
            return;
        }
        this.status = FriendshipStatus.REMOVED;
    }

    public recordAccepted(): void {
        if (!this.isAccepted() || !this.acceptedAt) {
            throw new Error('수락된 상태에서만 이벤트를 기록할 수 있습니다.');
        }
        this.addDomainEvent(
            new FriendshipAcceptedEvent(
                this.id,
                this.requestUserId,
                this.addressedUserId,
                this.acceptedAt,
            ),
        );
    }

    public isPending(): boolean {
        return this.status === FriendshipStatus.PENDING;
    }

    public isAccepted(): boolean {
        return this.status === FriendshipStatus.ACCEPTED;
    }

    public isBlocked(): boolean {
        return this.status === FriendshipStatus.BLOCKED;
    }

    public involves(userId: number): boolean {
        return this.requestUserId === userId || this.addressedUserId === userId;
    }
}
