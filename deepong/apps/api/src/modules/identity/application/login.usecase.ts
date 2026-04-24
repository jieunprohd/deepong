import {Injectable, UnauthorizedException} from '@nestjs/common';
import {EventEmitter2} from '@nestjs/event-emitter';
import * as bcrypt from 'bcryptjs';
import {User} from '../domain/user.entity';
import {UserLoggedInEvent} from '../domain/events/user-logged-in.event';
import {TokenService} from './token.service';
import {LoginDto} from './dto/login.dto';
import {AuthResult} from './dto/auth-result.dto';
import {AccessTokenPayload} from './dto/access.token.payload';

@Injectable()
export class LoginUseCase {
    constructor(
        private readonly tokenService: TokenService,
        private readonly eventEmitter: EventEmitter2,
    ) {
    }

    public async execute(dto: LoginDto): Promise<AuthResult> {
        const user = await this.findUserByEmailOrElseThrow(dto.email);

        await this.verifyPassword(dto.password, user.passwordHash);

        const refreshToken = await this.tokenService.issueRefreshToken(user.id);
        const accessToken = this.tokenService.generateAccessToken(AccessTokenPayload.from(user));

        this.eventEmitter.emit('UserLoggedIn', new UserLoggedInEvent(user.id));

        return AuthResult.from(accessToken, refreshToken, user);
    }

    private async findUserByEmailOrElseThrow(email: string): Promise<User> {
        const user = await User.findOne({where: {email}});

        if (!user || !user.passwordHash) {
            throw new UnauthorizedException('이메일 또는 비밀번호가 올바르지 않습니다.');
        }

        return user;
    }

    private async verifyPassword(password: string, hashedPassword: string): Promise<void> {
        const isMatch = await bcrypt.compare(password, hashedPassword);
        if (!isMatch) {
            throw new UnauthorizedException('이메일 또는 비밀번호가 올바르지 않습니다.');
        }
    }
}
