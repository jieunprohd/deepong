import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IdentityModule } from '@modules/identity/identity.module';
import { InviteToken } from './domain/invite.token.entity';
import { TokenService } from './application/token.service';
import { InvitationRequestUseCase } from './application/invitation.request.usecase';
import { InvitationPreviewUseCase } from './application/invitation.preview.usecase';
import { InvitationController } from './interface/invitation.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([InviteToken]),
    IdentityModule,
  ],
  controllers: [InvitationController],
  providers: [TokenService, InvitationRequestUseCase, InvitationPreviewUseCase],
})
export class RelationshipModule {}
