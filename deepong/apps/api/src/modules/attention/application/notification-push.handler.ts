import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { Notification } from '../domain/notification.entity';
import { CommunicationAcl } from '../infrastructure/acl/communication.acl';
import {
  NotificationGateway,
  NotificationNewPayload,
} from '../interface/notification.gateway';
import { DeliveryMethod } from '../domain/attention-decision.vo';
import { ToneType } from '../domain/tone.vo';
import { PresenceType } from '../domain/presence.vo';

interface NotificationCreatedPayload {
  notificationId: number;
  userId: number;
  messageId: number;
  deliveryMethod: DeliveryMethod;
  tone: ToneType;
  presence: PresenceType;
  scheduledAt: Date | null;
}

/**
 * NotificationCreated 이벤트를 받아 IMMEDIATE인 경우 WebSocket으로 클라이언트에 푸시한다.
 *
 * BATCHED/QUEUED는 별도 스케줄러(다음 브랜치)에서 발송 시각이 되면 트리거.
 * DROPPED는 푸시하지 않음.
 *
 * NOTE: NotificationCreatedEvent는 quiet 플래그를 carry하지 않으므로,
 * presence + tone 조합으로 클라이언트에서 quiet 여부를 추정한다 (FOCUS + URGENT).
 */
@Injectable()
export class NotificationPushHandler {
  private readonly logger = new Logger(NotificationPushHandler.name);

  constructor(
    private readonly gateway: NotificationGateway,
    private readonly communicationAcl: CommunicationAcl,
  ) {}

  @OnEvent('attention.notification-created', {
    async: true,
    promisify: true,
  })
  async handle(event: NotificationCreatedPayload): Promise<void> {
    if (event.deliveryMethod !== 'IMMEDIATE') return;

    try {
      const payload = await this.buildPayload(event);
      if (!payload) return;
      this.gateway.emitNotificationNew(event.userId, payload);
    } catch (err) {
      this.logger.error(
        `알림 푸시 실패 (notificationId=${event.notificationId}): ${err instanceof Error ? err.message : String(err)}`,
        err instanceof Error ? err.stack : undefined,
      );
    }
  }

  private async buildPayload(
    event: NotificationCreatedPayload,
  ): Promise<NotificationNewPayload | null> {
    const n = await Notification.findOne({
      where: { id: event.notificationId },
    });
    if (!n) return null;

    const digestMap = await this.communicationAcl.getDigestsByMessageIds([
      n.messageId,
    ]);
    const digest = digestMap.get(n.messageId);

    const quiet = event.presence === 'FOCUS' && event.tone === 'URGENT';

    return {
      id: n.id,
      userId: n.userId,
      messageId: n.messageId,
      roomId: digest?.roomId ?? null,
      roomName: digest?.roomName ?? null,
      roomType: digest?.roomType ?? null,
      senderUserId: digest?.senderUserId ?? null,
      senderNickname: digest?.senderNickname ?? null,
      content: digest?.content ?? null,
      contentType: digest?.contentType ?? null,
      deliveryMethod: n.deliveryMethod,
      triggerTone: n.triggerTone,
      triggerPresence: n.triggerPresence,
      quiet,
      scheduledAt: n.scheduledAt?.toISOString() ?? null,
      createdAt: n.createdAt.toISOString(),
    };
  }
}
