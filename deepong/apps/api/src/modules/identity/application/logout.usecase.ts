import {Injectable} from '@nestjs/common';
import {RefreshToken} from '../domain/refresh-token.entity';
import {TokenService} from './token.service';
import {RefreshDto} from './dto/refresh.dto';

@Injectable()
export class LogoutUseCase {
    constructor(private readonly tokenService: TokenService) {
    }

    public async execute(dto: RefreshDto): Promise<void> {
        const tokenHash = this.tokenService.hashToken(dto.refreshToken);
        await this.findExistRefreshTokenAndRevoke(tokenHash);
    }

    private async findExistRefreshTokenAndRevoke(tokenHash: string) {
        const existing = await RefreshToken.findOne({where: {tokenHash}});
        if (existing && existing.isValid()) {
            existing.revoke();
            await existing.save();
        }
    }

}
