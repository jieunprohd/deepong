import {Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, Unique,} from 'typeorm';
import {AggregateRoot} from '@shared/types/aggregate-root.base';

@Entity('USER_OAUTH')
@Unique(['provider', 'providerUserId'])
export class UserOAuth extends AggregateRoot {
    @PrimaryGeneratedColumn({type: 'bigint', unsigned: true})
    id!: number;

    @Column({type: 'bigint', unsigned: true})
    userId!: number;

    @Column({type: 'varchar', length: 20})
    provider!: string;

    @Column({type: 'varchar', length: 255})
    providerUserId!: string;

    @CreateDateColumn({type: 'datetime', precision: 6})
    createdAt!: Date;

    // ---- Factory Method ----

    public static link(props: {
        userId: number;
        provider: string;
        providerUserId: string;
    }): UserOAuth {
        const oauth = new UserOAuth();
        oauth.userId = props.userId;
        oauth.provider = props.provider;
        oauth.providerUserId = props.providerUserId;
        return oauth;
    }
}
