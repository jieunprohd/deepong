import {Injectable, UnauthorizedException} from "@nestjs/common";
import {EventEmitter2} from "@nestjs/event-emitter";
import {InvitationRequestDto} from "@modules/relationship/application/dto/invitation.request.dto";
import {User} from "@modules/identity/domain/user.entity";
import {TokenService} from "@modules/relationship/application/token.service";

@Injectable()
export class InvitationRequestUseCase {
    constructor(private readonly tokenService: TokenService, eventEmitter: EventEmitter2,) {
    }

    public async execute(userId: number, dto: InvitationRequestDto) {
        const user = await this.findUserByIdOrElseThrow(userId);

        const token = this.tokenService.issueInvitationToken();
    }

    private async findUserByIdOrElseThrow(userId: number): Promise<User> {
        const user = await User.findOne({where: {id: userId}});

        if (!user) {
            throw new UnauthorizedException('존재하지 않는 사용자입니다.');
        }

        return user;
    }
}