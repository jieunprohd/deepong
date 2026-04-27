import {Injectable, UnauthorizedException} from "@nestjs/common";
import {ConfigService} from "@nestjs/config";
import {EventEmitter2} from "@nestjs/event-emitter";
import {InvitationRequestDto} from "@modules/relationship/application/dto/invitation.request.dto";
import {InvitationResponseDto} from "@modules/relationship/application/dto/invitation.response.dto";
import {User} from "@modules/identity/domain/user.entity";
import {TokenService} from "@modules/relationship/application/token.service";
import {InviteToken} from "@modules/relationship/domain/invite.token.entity";
import {InvitationCreatedEvent} from "@modules/relationship/domain/events/invitation.created.event";

const DEFAULT_MAX_USE_COUNT = 10;

@Injectable()
export class InvitationRequestUseCase {
    constructor(
        private readonly tokenService: TokenService,
        private readonly eventEmitter: EventEmitter2,
        private readonly config: ConfigService,
    ) {
    }

    public async execute(userId: number, dto: InvitationRequestDto): Promise<InvitationResponseDto> {
        const user = await this.findUserByIdOrElseThrow(userId);

        const token = this.tokenService.issueInvitationToken();
        const inviteToken = InviteToken.issueInviteToken({
            token,
            issuerUserId: user.id,
            singleUse: dto.singleUse,
            maxUseCount: DEFAULT_MAX_USE_COUNT,
            ttlHours: dto.ttlHours,
        });
        await inviteToken.save();

        const event = new InvitationCreatedEvent(
            inviteToken.id,
            inviteToken.id,
            inviteToken.issuerUserId,
            inviteToken.token,
            inviteToken.expiresAt,
            inviteToken.createdAt,
        );
        this.eventEmitter.emit(event.eventName, event);

        return InvitationResponseDto.from(inviteToken, this.buildInviteUrl(inviteToken.token));
    }

    private async findUserByIdOrElseThrow(userId: number): Promise<User> {
        const user = await User.findOne({where: {id: userId}});
        if (!user) {
            throw new UnauthorizedException('존재하지 않는 사용자입니다.');
        }
        return user;
    }

    private buildInviteUrl(token: string): string {
        const baseUrl = this.config.get<string>('INVITE_BASE_URL', 'http://localhost:3000/invite');
        return `${baseUrl}/${token}`;
    }
}
