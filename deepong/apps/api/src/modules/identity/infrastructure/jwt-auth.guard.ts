import {CanActivate, ExecutionContext, Injectable, UnauthorizedException,} from '@nestjs/common';
import {Request} from 'express';
import {TokenService} from '../application/token.service';

@Injectable()
export class JwtAuthGuard implements CanActivate {
    constructor(private readonly tokenService: TokenService) {
    }

    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest<Request>();
        const authHeader = request.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new UnauthorizedException('인증 토큰이 필요합니다.');
        }

        const token = authHeader.slice(7);

        try {
            const payload = this.tokenService.verifyAccessToken(token);
            (request as any).user = {userId: payload.userId, email: payload.email};
            return true;
        } catch {
            throw new UnauthorizedException('유효하지 않은 토큰입니다.');
        }
    }
}
