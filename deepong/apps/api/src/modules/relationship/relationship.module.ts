import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IdentityModule } from '@modules/identity/identity.module';
import { InviteToken } from './domain/invite.token.entity';
import { Friendship } from './domain/friendship.entity';
import { TokenService } from './application/token.service';
import { InvitationRequestUseCase } from './application/invitation.request.usecase';
import { InvitationPreviewUseCase } from './application/invitation.preview.usecase';
import { AcceptInvitationUseCase } from './application/accept.invitation.usecase';
import { FindFriendshipUsecase } from './application/find.friendship.usecase';
import { DeleteFriendshipUseCase } from './application/delete.friendship.usecase';
import { InvitationController } from './interface/invitation.controller';
import { FriendshipController } from './interface/friendship.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([InviteToken, Friendship]),
    IdentityModule,
  ],
  controllers: [InvitationController, FriendshipController],
  providers: [
    TokenService,
    InvitationRequestUseCase,
    InvitationPreviewUseCase,
    AcceptInvitationUseCase,
    FindFriendshipUsecase,
    DeleteFriendshipUseCase,
  ],
})
export class RelationshipModule {}
