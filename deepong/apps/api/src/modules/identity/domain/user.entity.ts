import {Column, CreateDateColumn, DeleteDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn,} from 'typeorm';
import {AggregateRoot} from '@shared/types/aggregate-root.base';
import {Handle} from './handle.vo';
import {UserSignedUpEvent} from './events/user-signed-up.event';
import {UpdateProfileDto} from '../application/dto/update-profile.dto';

@Entity('USER')
export class User extends AggregateRoot {
    @PrimaryGeneratedColumn({type: 'bigint', unsigned: true})
    id!: number;

    @Column({type: 'varchar', length: 255, unique: true})
    email!: string;

    @Column({type: 'varchar', length: 255, nullable: true})
    passwordHash!: string | null;

    @Column({type: 'varchar', length: 50})
    nickname!: string;

    @Column({type: 'varchar', length: 50})
    handle!: string;

    @Column({type: 'varchar', length: 200, nullable: true})
    bio!: string | null;

    @Column({type: 'text', nullable: true})
    avatarUrl!: string | null;

    @Column({type: 'varchar', length: 50, default: 'Asia/Seoul'})
    timezone!: string;

    @Column({type: 'varchar', length: 10, default: 'ko'})
    locale!: string;

    @Column({type: 'datetime', nullable: true})
    emailVerifiedAt!: Date | null;

    @Column({type: 'datetime', nullable: true})
    lastSeenAt!: Date | null;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;

    @DeleteDateColumn()
    deletedAt!: Date | null;

    // ---- Query Methods ----

    public static async isHandleTaken(handle: string): Promise<boolean> {
        return !!(await User.findOne({where: {handle}}));
    }

    public static async searchUserByHandle(handle: string) {
        return await User.findOne({
            where: {
                handle
            }
        });
    }

    // ---- Factory Methods ----

    public static signup(props: {
        email: string;
        passwordHash: string;
        nickname: string;
        handle: Handle;
    }): User {
        const user = new User();
        user.email = props.email;
        user.passwordHash = props.passwordHash;
        user.nickname = props.nickname;
        user.handle = props.handle.value;
        user.bio = null;
        user.avatarUrl = null;
        user.timezone = 'Asia/Seoul';
        user.locale = 'ko';
        user.emailVerifiedAt = null;
        user.lastSeenAt = null;
        user.deletedAt = null;

        user.addDomainEvent(
            new UserSignedUpEvent(user.id ?? 0, user.email),
        );
        return user;
    }

    public static createFromOAuth(props: {
        email: string;
        nickname: string;
        handle: Handle;
        avatarUrl: string | null;
    }): User {
        const user = new User();
        user.email = props.email;
        user.passwordHash = null;
        user.nickname = props.nickname;
        user.handle = props.handle.value;
        user.bio = null;
        user.avatarUrl = props.avatarUrl;
        user.timezone = 'Asia/Seoul';
        user.locale = 'ko';
        user.emailVerifiedAt = new Date();
        user.lastSeenAt = null;
        user.deletedAt = null;

        user.addDomainEvent(
            new UserSignedUpEvent(user.id ?? 0, user.email),
        );
        return user;
    }

    public updateUserInfo(request: UpdateProfileDto) {
        if (request.nickname) this.nickname = request.nickname;
        if (request.bio) this.bio = request.bio ?? null;
        if (request.avatarUrl) this.avatarUrl = request.avatarUrl ?? null;
        if (request.timezone) this.timezone = request.timezone;
        return this;
    }
}
