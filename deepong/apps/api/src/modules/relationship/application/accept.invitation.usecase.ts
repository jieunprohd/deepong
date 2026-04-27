import {BadRequestException, ForbiddenException, GoneException, Injectable, NotFoundException} from "@nestjs/common";
import {EventEmitter2} from "@nestjs/event-emitter";
import {DataSource} from "typeorm";
import {InviteToken} from "@modules/relationship/domain/invite.token.entity";
import {Friendship} from "@modules/relationship/domain/friendship.entity";
import {FriendshipInviteSource} from "@modules/relationship/domain/friendship.invite.source.type";

@Injectable()
export class AcceptInvitationUseCase {
    constructor(
        private readonly eventEmitter: EventEmitter2,
        private readonly dataSource: DataSource,
    ) {
    }

    public async execute(userId: number, token: string): Promise<void> {
        const invitation = await this.findInvitationByTokenOrElseThrow(token);
        this.ensureUsable(invitation);
        this.ensureNotSelfAccept(invitation, userId);

        const friendship = await this.ensureFriendship(invitation.issuerUserId, userId);

        if (friendship.isBlocked()) {
            throw new ForbiddenException('차단된 관계입니다.');
        }

        if (friendship.isPending()) {
            friendship.accept();
            invitation.consume();

            await this.dataSource.transaction(async (manager) => {
                await manager.save(friendship);
                await manager.save(invitation);
            });

            friendship.recordAccepted();
            for (const event of friendship.pullDomainEvents()) {
                this.eventEmitter.emit(event.eventName, event);
            }
            return;
        }

        if (friendship.isAccepted()) {
            return;
        }

        throw new ForbiddenException('수락할 수 없는 친구 관계입니다.');
    }

    private ensureUsable(invitation: InviteToken): void {
        if (!invitation.isUsable()) {
            throw new GoneException('만료되었거나 이미 사용된 초대입니다.');
        }
    }

    private ensureNotSelfAccept(invitation: InviteToken, userId: number): void {
        if (invitation.issuerUserId === userId) {
            throw new BadRequestException('초대 수락자와 발급자는 동일할 수 없습니다.');
        }
    }

    private async ensureFriendship(requestUserId: number, addressedUserId: number): Promise<Friendship> {
        const existing = await Friendship.findBetween(requestUserId, addressedUserId);
        if (existing) {
            return existing;
        }

        const friendship = Friendship.request({
            requestUserId,
            addressedUserId,
            inviteSource: FriendshipInviteSource.LINK,
        });
        await friendship.save();
        return friendship;
    }

    private async findInvitationByTokenOrElseThrow(token: string): Promise<InviteToken> {
        const invitation = await InviteToken.findOne({where: {token}});

        if (!invitation) {
            throw new NotFoundException('토큰에 해당하는 초대가 존재하지 않습니다.');
        }

        return invitation;
    }
}
