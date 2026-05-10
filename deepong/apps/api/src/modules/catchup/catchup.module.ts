import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IdentityModule } from '@modules/identity/identity.module';
import { AttentionModule } from '@modules/attention/attention.module';
import { FeedAction } from './domain/feed-action.entity';
import { ListCatchupFeedUseCase } from './application/list-catchup-feed.usecase';
import { RecordFeedActionUseCase } from './application/record-feed-action.usecase';
import { CommunicationAcl } from './infrastructure/acl/communication.acl';
import { CatchupController } from './interface/catchup.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([FeedAction]),
    IdentityModule,
    AttentionModule,
  ],
  controllers: [CatchupController],
  providers: [ListCatchupFeedUseCase, RecordFeedActionUseCase, CommunicationAcl],
})
export class CatchupModule {}
