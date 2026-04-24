import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { join } from 'path';
import { DatabaseModule } from './shared/database/database.module';
import { EventBusModule } from './shared/event-bus/event-bus.module';
import { IdentityModule } from './modules/identity/identity.module';
import { RelationshipModule } from './modules/relationship/relationship.module';
import { CommunicationModule } from './modules/communication/communication.module';
import { AttentionModule } from './modules/attention/attention.module';
import { CatchupModule } from './modules/catchup/catchup.module';
import { WorkspaceModule } from './modules/workspace/workspace.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: join(__dirname, '..', '.env'),
    }),
    DatabaseModule,
    EventBusModule,
    IdentityModule,
    RelationshipModule,
    CommunicationModule,
    AttentionModule,
    CatchupModule,
    WorkspaceModule,
  ],
})
export class AppModule {}
