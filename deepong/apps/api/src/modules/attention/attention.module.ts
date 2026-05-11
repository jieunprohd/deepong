import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IdentityModule } from '@modules/identity/identity.module';
import { PresenceSnapshot } from './domain/presence-snapshot.entity';
import { FocusSession } from './domain/focus-session.entity';
import { Notification } from './domain/notification.entity';
import { NotificationPreference } from './domain/notification-preference.entity';
import { GetPresenceUseCase } from './application/get-presence.usecase';
import { UpdatePresenceUseCase } from './application/update-presence.usecase';
import { StartFocusSessionUseCase } from './application/start-focus-session.usecase';
import { EndFocusSessionUseCase } from './application/end-focus-session.usecase';
import { GetFocusStatsUseCase } from './application/get-focus-stats.usecase';
import { ListNotificationsUseCase } from './application/list-notifications.usecase';
import { MarkNotificationsReadUseCase } from './application/mark-notifications-read.usecase';
import {
  GetNotificationPreferenceUseCase,
  UpdateNotificationPreferenceUseCase,
} from './application/notification-preference.usecase';
import { EvaluateNotificationUseCase } from './application/evaluate-notification.usecase';
import { MessageSentHandler } from './application/message-sent.handler';
import { NotificationPushHandler } from './application/notification-push.handler';
import { PresenceController } from './interface/presence.controller';
import { FocusController } from './interface/focus.controller';
import { NotificationController } from './interface/notification.controller';
import { NotificationPreferenceController } from './interface/notification-preference.controller';
import { NotificationGateway } from './interface/notification.gateway';
import { CommunicationAcl } from './infrastructure/acl/communication.acl';
import { RelationshipAcl } from './infrastructure/acl/relationship.acl';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PresenceSnapshot,
      FocusSession,
      Notification,
      NotificationPreference,
    ]),
    IdentityModule,
  ],
  controllers: [
    PresenceController,
    FocusController,
    NotificationController,
    NotificationPreferenceController,
  ],
  providers: [
    GetPresenceUseCase,
    UpdatePresenceUseCase,
    StartFocusSessionUseCase,
    EndFocusSessionUseCase,
    GetFocusStatsUseCase,
    ListNotificationsUseCase,
    MarkNotificationsReadUseCase,
    GetNotificationPreferenceUseCase,
    UpdateNotificationPreferenceUseCase,
    EvaluateNotificationUseCase,
    CommunicationAcl,
    RelationshipAcl,
    MessageSentHandler,
    NotificationGateway,
    NotificationPushHandler,
  ],
  exports: [EvaluateNotificationUseCase],
})
export class AttentionModule {}
