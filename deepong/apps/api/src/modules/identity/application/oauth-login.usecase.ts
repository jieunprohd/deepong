import {Injectable} from '@nestjs/common';
import {EventEmitter2} from '@nestjs/event-emitter';
import {User} from '../domain/user.entity';
import {UserOAuth} from '../domain/user-oauth.entity';
import {Handle} from '../domain/handle.vo';
import {UserLoggedInEvent} from '../domain/events/user-logged-in.event';
import {Workspace} from '@modules/workspace/domain/workspace.entity';
import {TokenService} from './token.service';
import {AuthResult} from './dto/auth-result.dto';
import {AccessTokenPayload} from './dto/access.token.payload';

interface OAuthProfile {
    provider: string;
    providerUserId: string;
    email: string;
    nickname: string;
    avatarUrl: string | null;
}

@Injectable()
export class OAuthLoginUseCase {
    constructor(
        private readonly tokenService: TokenService,
        private readonly eventEmitter: EventEmitter2,
    ) {
    }

    public async execute(profile: OAuthProfile): Promise<AuthResult> {
        const user = await this.findOrCreateUser(profile);

        const refreshToken = await this.tokenService.issueRefreshToken(user.id);
        const accessToken = this.tokenService.generateAccessToken(AccessTokenPayload.from(user));

        return AuthResult.from(accessToken, refreshToken, user);
    }

    private async findOrCreateUser(profile: OAuthProfile): Promise<User> {
        const oauthLink = await UserOAuth.findOne({
            where: {provider: profile.provider, providerUserId: profile.providerUserId},
        });

        if (oauthLink) {
            const user = await User.findOneOrFail({where: {id: oauthLink.userId}});
            this.eventEmitter.emit('UserLoggedIn', new UserLoggedInEvent(user.id));
            return user;
        }

        return this.registerOAuthUser(profile);
    }

    private async registerOAuthUser(profile: OAuthProfile): Promise<User> {
        const handle = await Handle.generateUnique(profile.nickname, User.isHandleTaken);

        const user = User.createFromOAuth({
            email: profile.email,
            nickname: profile.nickname,
            handle,
            avatarUrl: profile.avatarUrl,
        });
        await user.save();

        await UserOAuth.link({
            userId: user.id,
            provider: profile.provider,
            providerUserId: profile.providerUserId,
        }).save();

        await Workspace.createDefault(user.id).save();

        for (const event of user.pullDomainEvents()) {
            this.eventEmitter.emit(event.eventName, event);
        }

        return user;
    }
}
