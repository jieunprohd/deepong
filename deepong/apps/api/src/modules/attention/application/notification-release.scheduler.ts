import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ReleaseNotificationUseCase } from './release-notification.usecase';

const TICK_INTERVAL_MS = 60_000;

/**
 * 60초 주기로 BATCHED 알림 중 scheduledAt이 지난 항목을 release.
 *
 * NOTE: 다중 인스턴스 환경에서는 동일 알림이 여러 워커에서 동시에 release 시도할 수 있음.
 * Notification.markDelivered가 PENDING 상태 외에는 throw 하므로 race로 인한 중복 push만
 * 잠재 위험. 운영 환경에서는 Redis 분산 락 또는 BullMQ로 격상하는 것을 권장.
 */
@Injectable()
export class NotificationReleaseScheduler
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(NotificationReleaseScheduler.name);
  private timer: NodeJS.Timeout | null = null;
  private isRunning = false;

  constructor(private readonly releaseUC: ReleaseNotificationUseCase) {}

  onModuleInit(): void {
    this.timer = setInterval(() => void this.tick(), TICK_INTERVAL_MS);
  }

  onModuleDestroy(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private async tick(): Promise<void> {
    if (this.isRunning) return;
    this.isRunning = true;
    try {
      const released = await this.releaseUC.releaseDueBatched();
      if (released > 0) {
        this.logger.log(`BATCHED 알림 ${released}건 release`);
      }
    } catch (err) {
      this.logger.error(
        `BATCHED release tick 실패: ${err instanceof Error ? err.message : String(err)}`,
      );
    } finally {
      this.isRunning = false;
    }
  }
}
