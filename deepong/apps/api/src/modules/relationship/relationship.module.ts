import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IdentityModule } from '@modules/identity/identity.module';
import { InviteToken } from './domain/invite.token.entity';
import { Friendship } from './domain/friendship.entity';
import { TokenService } from './application/token.service';
import { InvitationRequestUseCase } from './application/invitation.request.usecase';
import { InvitationPreviewUseCase } from './application/invitation.preview.usecase';
import { AcceptInvitationUseCase } from './application/accept.invitation.usecase';
import { InvitationController } from './interface/invitation.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([InviteToken, Friendship]),
    IdentityModule,
  ],
  controllers: [InvitationController],
  providers: [
    TokenService,
    InvitationRequestUseCase,
    InvitationPreviewUseCase,
    AcceptInvitationUseCase,
  ],
})
export class RelationshipModule {}
