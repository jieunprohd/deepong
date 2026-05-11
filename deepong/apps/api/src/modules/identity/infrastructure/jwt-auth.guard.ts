import { CanActivate, ExecutionContext, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '@shared/redis/redis.module';
import { TokenService } from '../application/token.service';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly tokenService: TokenService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('인증 토큰이 필요합니다.');
    }

    const token = authHeader.slice(7);

    try {
      const payload = this.tokenService.verifyAccessToken(token);

      if (payload.jti) {
        const blacklisted = await this.redis.get(`session:blacklist:${payload.jti}`);
        if (blacklisted) throw new UnauthorizedException('로그아웃된 토큰입니다.');
      }

      (request as any).user = { userId: payload.userId, email: payload.email };
      return true;
    } catch (e: any) {
      if (e instanceof UnauthorizedException) throw e;
      throw new UnauthorizedException('유효하지 않은 토큰입니다.');
    }
  }
}
