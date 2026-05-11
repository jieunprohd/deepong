import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PresenceType } from '../domain/presence.vo';
import { ReleaseNotificationUseCase } from './release-notification.usecase';

interface PresenceChangedPayload {
  userId: number;
  previousStatus: PresenceType;
  currentStatus: PresenceType;
}

/**
 * 사용자 프레즌스가 FREE로 전환됐을 때 그 사용자의 QUEUED 알림을 모두 release.
 *
 * 시나리오: FOCUS/OFF 상태에서 들어왔던 알림들이 QUEUED로 보류됐다가,
 * 사용자가 다시 자리에 돌아와 FREE로 변경하면 한꺼번에 도착.
 */
@Injectable()
export class PresenceFreedHandler {
  private readonly logger = new Logger(PresenceFreedHandler.name);

  constructor(private readonly releaseUC: ReleaseNotificationUseCase) {}

  @OnEvent('attention.presence-changed', { async: true, promisify: true })
  async handle(event: PresenceChangedPayload): Promise<void> {
    if (event.currentStatus !== 'FREE') return;
    if (event.previousStatus === 'FREE') return;

    try {
      const released = await this.releaseUC.releaseQueuedForUser(event.userId);
      if (released > 0) {
        this.logger.log(
          `사용자 ${event.userId} FREE 전환 → QUEUED ${released}건 release`,
        );
      }
    } catch (err) {
      this.logger.error(
        `QUEUED release 실패 (userId=${event.userId}): ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }
}
