import {
    Column,
    CreateDateColumn,
    Entity,
    PrimaryGeneratedColumn,
} from 'typeorm';
import {AggregateRoot} from '@shared/types/aggregate-root.base';

@Entity('REFRESH_TOKEN')
export class RefreshToken extends AggregateRoot {
    @PrimaryGeneratedColumn({type: 'bigint', unsigned: true})
    id!: number;

    @Column({type: 'bigint', unsigned: true})
    userId!: number;

    @Column({type: 'varchar', length: 255})
    tokenHash!: string;

    @Column({type: 'datetime'})
    expiresAt!: Date;

    @Column({type: 'tinyint', default: 0})
    revoked!: boolean;

    @CreateDateColumn()
    createdAt!: Date;

    // ---- Factory Method ----

    public static issue(props: {
        userId: number;
        tokenHash: string;
        expiresAt: Date;
    }): RefreshToken {
        const token = new RefreshToken();
        token.userId = props.userId;
        token.tokenHash = props.tokenHash;
        token.expiresAt = props.expiresAt;
        token.revoked = false;
        return token;
    }

    // ---- Domain Methods ----

    public revoke(): void {
        this.revoked = true;
    }

    public isValid(): boolean {
        return !this.revoked && this.expiresAt > new Date();
    }
}
