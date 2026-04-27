import {InviteToken} from "@modules/relationship/domain/invite.token.entity";
import {User} from "@modules/identity/domain/user.entity";

export class InvitationPreviewResponse {
    invitation: {
        token: string;
        issuer: {
            nickname: string;
            handle: string;
            avatarUrl: string;
        }
    };
    expiresAt: Date;

    public static from(inviteToken: InviteToken, issuer: User) {
        const response = new InvitationPreviewResponse();
        response.invitation = {
            token: inviteToken.token,
            issuer: {
                nickname: issuer.nickname,
                handle: issuer.handle,
                avatarUrl: issuer.avatarUrl,
            }
        };
        response.expiresAt = inviteToken.expiresAt;
        return response;
    }
}