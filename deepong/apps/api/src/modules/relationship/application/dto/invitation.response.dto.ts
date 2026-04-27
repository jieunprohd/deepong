import {InviteToken} from "@modules/relationship/domain/invite.token.entity";

export class InvitationResponseDto {
    invitation!: {
        id: number;
        token: string;
        inviteUrl: string;
        singleUse: boolean;
        expiresAt: Date;
    };

    public static from(inviteToken: InviteToken, inviteUrl: string): InvitationResponseDto {
        const dto = new InvitationResponseDto();
        dto.invitation = {
            id: inviteToken.id,
            token: inviteToken.token,
            inviteUrl,
            singleUse: inviteToken.singleUse,
            expiresAt: inviteToken.expiresAt,
        };
        return dto;
    }
}
