import { Inject, Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '@shared/redis/redis.module';
import { RefreshToken } from '../domain/refresh-token.entity';
import { TokenService } from './token.service';

@Injectable()
export class LogoutUseCase {
  constructor(
    private readonly tokenService: TokenService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  public async execute(accessToken: string, refreshToken?: string): Promise<void> {
    const payload = this.tokenService.verifyAccessToken(accessToken);
    const ttl = this.tokenService.getAccessTokenTtlSeconds();
    await this.redis.set(`session:blacklist:${payload.jti}`, '1', 'EX', ttl);

    if (refreshToken) {
      const tokenHash = this.tokenService.hashToken(refreshToken);
      const existing = await RefreshToken.findOne({ where: { tokenHash } });
      if (existing && existing.isValid()) {
        existing.revoke();
        await existing.save();
      }
    }
  }
}
