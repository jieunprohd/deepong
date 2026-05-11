import { Injectable, Logger } from '@nestjs/common';
import { LessThanOrEqual } from 'typeorm';
import { Notification } from '../domain/notification.entity';
import {
  CommunicationAcl,
  NotificationMessageDigest,
} from '../infrastructure/acl/communication.acl';
import {
  NotificationGateway,
  NotificationNewPayload,
} from '../interface/notification.gateway';

/**
 * 보류 상태(BATCHED·QUEUED)의 알림을 실제로 전달(DELIVERED) 처리하고 클라이언트에 push.
 *
 * 호출 주체:
 *  - NotificationReleaseScheduler: 60s 주기로 BATCHED scheduledAt이 지난 항목 release
 *  - PresenceFreedHandler: 사용자 프레즌스가 FREE로 전환됐을 때 그 사용자의 QUEUED 항목 release
 */
@Injectable()
export class ReleaseNotificationUseCase {
  private readonly logger = new Logger(ReleaseNotificationUseCase.name);

  constructor(
    private readonly gateway: NotificationGateway,
    private readonly communicationAcl: CommunicationAcl,
  ) {}

  /** 발송 시각이 지난 BATCHED 알림을 모두 release. */
  async releaseDueBatched(now: Date = new Date()): Promise<number> {
    const due = await Notification.find({
      where: {
        deliveryMethod: 'BATCHED',
        deliveryStatus: 'PENDING',
        scheduledAt: LessThanOrEqual(now),
      },
      take: 200,
    });
    if (!due.length) return 0;
    return this.releaseAll(due, now);
  }

  /** 특정 사용자의 QUEUED 알림을 모두 release (presence FREE 전환 시). */
  async releaseQueuedForUser(
    userId: number,
    now: Date = new Date(),
  ): Promise<number> {
    const queued = await Notification.find({
      where: {
        userId,
        deliveryMethod: 'QUEUED',
        deliveryStatus: 'PENDING',
      },
      take: 500,
    });
    if (!queued.length) return 0;
    return this.releaseAll(queued, now);
  }

  private async releaseAll(
    notifications: Notification[],
    now: Date,
  ): Promise<number> {
    const messageIds = notifications.map((n) => n.messageId);
    const digestMap =
      await this.communicationAcl.getDigestsByMessageIds(messageIds);

    let released = 0;
    for (const n of notifications) {
      try {
        n.markDelivered(now);
        await n.save();
        const payload = this.toPayload(n, digestMap.get(n.messageId));
        this.gateway.emitNotificationNew(n.userId, payload);
        released++;
      } catch (err) {
        this.logger.error(
          `알림 release 실패 (id=${n.id}): ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }
    return released;
  }

  private toPayload(
    n: Notification,
    digest: NotificationMessageDigest | undefined,
  ): NotificationNewPayload {
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
      // BATCHED/QUEUED release는 quiet 아님 (이미 정책 평가에서 IMMEDIATE_QUIET이 아니었음)
      quiet: false,
      scheduledAt: n.scheduledAt?.toISOString() ?? null,
      createdAt: n.createdAt.toISOString(),
    };
  }
}
