import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';
import {AggregateRoot} from '@shared/types/aggregate-root.base';
import {FriendshipStatus} from "@modules/relationship/domain/friendship.status.type";
import {FriendshipInviteSource} from "@modules/relationship/domain/friendship.invite.source.type";
import {FriendshipAcceptedEvent} from "@modules/relationship/domain/events/friendship.accepted.event";
import {User} from "@modules/identity/domain/user.entity";

@Entity('FRIENDSHIP')
export class Friendship extends AggregateRoot {
    @PrimaryGeneratedColumn({type: 'bigint', unsigned: true})
    id!: number;

    @Column({type: 'bigint', unsigned: true})
    requesterUserId!: number;

    @ManyToOne(() => User, {createForeignKeyConstraints: false})
    @JoinColumn({name: 'REQUESTER_USER_ID'})
    requesterUser?: User;

    @Column({type: 'bigint', unsigned: true})
    addresseeUserId!: number;

    @ManyToOne(() => User, {createForeignKeyConstraints: false})
    @JoinColumn({name: 'ADDRESSEE_USER_ID'})
    addresseeUser?: User;

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
                '(friendship.requesterUserId = :a AND friendship.addresseeUserId = :b) OR ' +
                '(friendship.requesterUserId = :b AND friendship.addresseeUserId = :a)',
                {a: userIdA, b: userIdB},
            )
            .getOne();
    }

    public static findFriendList(
        userId: number,
        cursor?: Date,
        limit: number = 20,
    ): Promise<[Friendship[], number]> {
        const qb = this.createQueryBuilder<Friendship>('f')
            .leftJoinAndSelect('f.requesterUser', 'requestUser')
            .leftJoinAndSelect('f.addresseeUser', 'addressedUser')
            .where('(f.requesterUserId = :userId OR f.addresseeUserId = :userId)', {userId})
            .andWhere('f.status = :status', {status: FriendshipStatus.ACCEPTED})
            .orderBy('f.acceptedAt', 'ASC')
            .limit(limit);

        if (cursor) {
            qb.andWhere('f.acceptedAt > :cursor', {cursor});
        }

        return qb.getManyAndCount();
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
        friendship.requesterUserId = props.requestUserId;
        friendship.addresseeUserId = props.addressedUserId;
        friendship.status = FriendshipStatus.PENDING;
        friendship.inviteSource = props.inviteSource;
        friendship.acceptedAt = null;
        friendship.blockedAt = null;
        return friendship;
    }

    public getPeerUserId(myUserId: number): number {
        return this.requesterUserId === myUserId
            ? this.addresseeUserId
            : this.requesterUserId;
    }

    public getPeerUser(myUserId: number): User | undefined {
        return this.requesterUserId === myUserId
            ? this.addresseeUser
            : this.requesterUser;
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
                this.requesterUserId,
                this.addresseeUserId,
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
        return this.requesterUserId === userId || this.addresseeUserId === userId;
    }
}
