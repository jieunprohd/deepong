export class InvitationResponseDto {
    invitation: {
        id: number;
        token: string;
        inviteUrl: string;
        singleUse: boolean;
        expiresAt: Date;
    }
}