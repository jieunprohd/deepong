import {Injectable, UnauthorizedException} from '@nestjs/common';
import {User} from '../domain/user.entity';
import {RefreshToken} from '../domain/refresh-token.entity';
import {TokenService} from './token.service';
import {RefreshDto} from './dto/refresh.dto';
import {AuthResult} from './dto/auth-result.dto';
import {AccessTokenPayload} from './dto/access.token.payload';

@Injectable()
export class RefreshUseCase {
    constructor(private readonly tokenService: TokenService) {
    }

    public async execute(dto: RefreshDto): Promise<AuthResult> {
        const existing = await this.findAndRevokeRefreshToken(dto.refreshToken);

        const user = await User.findOne({where: {id: existing.userId}});
        if (!user) {
            throw new UnauthorizedException('사용자를 찾을 수 없습니다.');
        }

        const refreshToken = await this.tokenService.issueRefreshToken(user.id);
        const accessToken = this.tokenService.generateAccessToken(AccessTokenPayload.from(user));

        return AuthResult.from(accessToken, refreshToken, user);
    }

    private async findAndRevokeRefreshToken(refreshToken: string): Promise<RefreshToken> {
        const tokenHash = this.tokenService.hashToken(refreshToken);
        const existing = await RefreshToken.findOne({where: {tokenHash}});
        if (!existing || !existing.isValid()) {
            throw new UnauthorizedException('유효하지 않은 리프레시 토큰입니다.');
        }
        existing.revoke();
        return await existing.save();
    }
}
