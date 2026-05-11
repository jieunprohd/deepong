import {Injectable} from '@nestjs/common';
import {ConfigService} from '@nestjs/config';
import * as jwt from 'jsonwebtoken';
import * as crypto from 'crypto';
import {RefreshToken} from '../domain/refresh-token.entity';
import {AccessTokenPayload} from './dto/access.token.payload';

@Injectable()
export class TokenService {
    private readonly jwtSecret: string;
    private readonly accessExpiresIn: string;
    private readonly refreshExpiresInDays: number;

    constructor(config: ConfigService) {
        this.jwtSecret = config.get<string>('JWT_SECRET', 'deepong-dev-secret');
        this.accessExpiresIn = config.get<string>('JWT_ACCESS_EXPIRES_IN', '15m');
        this.refreshExpiresInDays = parseInt(
            config.get<string>('JWT_REFRESH_EXPIRES_IN_DAYS', '7'),
            10,
        );
    }

    public async issueRefreshToken(userId: number): Promise<string> {
        const rawToken = crypto.randomUUID();
        await RefreshToken.issue({
            userId,
            tokenHash: this.hashToken(rawToken),
            expiresAt: this.getRefreshExpiresAt(),
        }).save();
        return rawToken;
    }

    public generateAccessToken(payload: AccessTokenPayload): string {
        return jwt.sign(
            { userId: payload.userId, email: payload.email, jti: payload.jti },
            this.jwtSecret,
            { expiresIn: this.accessExpiresIn as jwt.SignOptions['expiresIn'] },
        );
    }

    public verifyAccessToken(token: string): AccessTokenPayload {
        return jwt.verify(token, this.jwtSecret) as unknown as AccessTokenPayload;
    }

    public getAccessTokenTtlSeconds(): number {
        const raw = this.accessExpiresIn;
        if (raw.endsWith('m')) return parseInt(raw) * 60;
        if (raw.endsWith('h')) return parseInt(raw) * 3600;
        return 900;
    }

    public hashToken(token: string): string {
        return crypto.createHash('sha256').update(token).digest('hex');
    }

    private getRefreshExpiresAt(): Date {
        const date = new Date();
        date.setDate(date.getDate() + this.refreshExpiresInDays);
        return date;
    }
}
