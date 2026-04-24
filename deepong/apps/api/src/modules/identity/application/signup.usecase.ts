import {BadRequestException, ConflictException, Injectable} from '@nestjs/common';
import {EventEmitter2} from '@nestjs/event-emitter';
import * as bcrypt from 'bcryptjs';
import {User} from '../domain/user.entity';
import {Handle} from '../domain/handle.vo';
import {Workspace} from '@modules/workspace/domain/workspace.entity';
import {TokenService} from './token.service';
import {validatePassword} from './password.validator';
import {SignupDto} from './dto/signup.dto';
import {AuthResult} from './dto/auth-result.dto';
import {AccessTokenPayload} from './dto/access.token.payload';

const BCRYPT_ROUNDS = 12;

@Injectable()
export class SignupUseCase {
    constructor(
        private readonly tokenService: TokenService,
        private readonly eventEmitter: EventEmitter2,
    ) {
    }

    public async execute(dto: SignupDto): Promise<AuthResult> {
        this.validatePasswordOrThrow(dto.password);
        await this.ensureEmailNotTaken(dto.email);

        const handle = await Handle.generateUnique(dto.nickname, User.isHandleTaken);

        const user = User.signup({
            email: dto.email,
            passwordHash: await bcrypt.hash(dto.password, BCRYPT_ROUNDS),
            nickname: dto.nickname,
            handle,
        });
        await user.save();

        await Workspace.createDefault(user.id).save();

        const refreshToken = await this.tokenService.issueRefreshToken(user.id);
        const accessToken = this.tokenService.generateAccessToken(AccessTokenPayload.from(user));

        for (const event of user.pullDomainEvents()) {
            this.eventEmitter.emit(event.eventName, event);
        }

        return AuthResult.from(accessToken, refreshToken, user);
    }

    private validatePasswordOrThrow(password: string): void {
        const error = validatePassword(password);
        if (error) {
            throw new BadRequestException(error);
        }
    }

    private async ensureEmailNotTaken(email: string): Promise<void> {
        const existing = await User.findOne({where: {email}});
        if (existing) {
            throw new ConflictException('이미 사용 중인 이메일입니다.');
        }
    }
}
