import {Injectable, NotFoundException} from "@nestjs/common";
import {InviteToken} from "@modules/relationship/domain/invite.token.entity";
import {User} from "@modules/identity/domain/user.entity";
import {InvitationPreviewResponse} from "@modules/relationship/application/dto/invitation.preview.response";

@Injectable()
export class InvitationPreviewUseCase {
    public async execute(token: string) {
        const inviteToken = await this.findInvitationByTokenOrElseThrow(token);
        const issuer = await this.findUserByIdOrElseThrow(inviteToken.issuerUserId);

        return InvitationPreviewResponse.from(inviteToken, issuer);
    }

    private async findInvitationByTokenOrElseThrow(token: string): Promise<InviteToken> {
        const invitation = await InviteToken.findOne({where: {token}});

        if (!invitation) {
            throw new NotFoundException('토큰에 해당하는 초대가 존재하지 않습니다.');
        }

        return invitation;
    }

    private async findUserByIdOrElseThrow(userId: number) {
        const user = await User.findOne({where: {id: userId}});

        if (!user) {
            throw new NotFoundException('사용자가 존재하지 않습니다.')
        }

        return user;
    }
}