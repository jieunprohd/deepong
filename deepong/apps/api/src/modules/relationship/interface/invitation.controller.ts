import {Body, Controller, Get, Param, Post, UseGuards} from "@nestjs/common";
import {JwtAuthGuard} from "@modules/identity/infrastructure/jwt-auth.guard";
import {InvitationRequestDto} from "@modules/relationship/application/dto/invitation.request.dto";
import {InvitationRequestUseCase} from "@modules/relationship/application/invitation.request.usecase";
import {CurrentUser} from "@modules/identity/infrastructure/current-user.decorator";
import {InvitationPreviewUseCase} from "@modules/relationship/application/invitation.preview.usecase";

@Controller('invitations')
export class InvitationController {
    constructor(private readonly invitationRequestUseCase: InvitationRequestUseCase, private invitationPreviewUseCase: InvitationPreviewUseCase) {
    }

    @Get('/:token')
    @UseGuards(JwtAuthGuard)
    public async previewInvitation(@Param('token') token: string) {
        return await this.invitationPreviewUseCase.execute(token);
    }

    @Post()
    @UseGuards(JwtAuthGuard)
    public async requestFriendShip(@CurrentUser() user: { userId: number }, @Body() request: InvitationRequestDto) {
        return await this.invitationRequestUseCase.execute(user.userId, request);
    }
}