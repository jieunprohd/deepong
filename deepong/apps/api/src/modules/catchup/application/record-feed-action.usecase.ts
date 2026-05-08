import { Injectable } from '@nestjs/common';
import { FeedAction } from '../domain/feed-action.entity';
import { Notification } from '@modules/attention/domain/notification.entity';
import {
  FeedActionResponse,
  RecordFeedActionDto,
} from './dto/catchup.dto';

@Injectable()
export class RecordFeedActionUseCase {
  /**
   * 피드 항목에 대한 사용자 액션 로깅.
   *  - MARK_READ / DISMISS는 관련 Notification을 DELIVERED로 함께 전이.
   *  - REPLY_NOW / OPEN_CHAT은 액션 기록만 남기고 본 알림은 Read로 마킹.
   */
  public async execute(
    userId: number,
    dto: RecordFeedActionDto,
  ): Promise<FeedActionResponse> {
    const action = FeedAction.record({
      userId,
      messageId: dto.messageId,
      action: dto.action,
    });
    await action.save();

    if (
      dto.action === 'MARK_READ' ||
      dto.action === 'DISMISS' ||
      dto.action === 'REPLY_NOW' ||
      dto.action === 'OPEN_CHAT'
    ) {
      await this.markRelatedNotificationsRead(userId, dto.messageId);
    }

    return FeedActionResponse.from(action);
  }

  private async markRelatedNotificationsRead(
    userId: number,
    messageId: number,
  ): Promise<void> {
    const pendings = await Notification.find({
      where: { userId, messageId, deliveryStatus: 'PENDING' },
    });
    if (pendings.length === 0) return;
    const now = new Date();
    for (const n of pendings) n.markDelivered(now);
    await Notification.save(pendings);
  }
}
