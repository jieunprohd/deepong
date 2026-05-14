import { Injectable } from '@nestjs/common';
import { Notification } from '@modules/attention/domain/notification.entity';
import { CommunicationAcl } from '../infrastructure/acl/communication.acl';
import {
  CatchupFeedItem,
  CatchupFeedResponse,
  ListCatchupQueryDto,
} from './dto/catchup.dto';

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

/**
 * Catchup Read Model Query
 *
 * Notification(QUEUED + BATCHED + DROPPED 제외) 목록을 사용자별로 모아 피드 형태로 가공.
 * 메시지 본문 / 발신자 정보는 Communication 컨텍스트의 ACL을 통해 join으로 hydrate한다.
 */
@Injectable()
export class ListCatchupFeedUseCase {
  constructor(private readonly communicationAcl: CommunicationAcl) {}

  public async execute(
    userId: number,
    query: ListCatchupQueryDto,
  ): Promise<CatchupFeedResponse> {
    const limit = clamp(query.limit ?? DEFAULT_LIMIT, 1, MAX_LIMIT);

    const qb = Notification.createQueryBuilder('n')
      .where('n.userId = :userId', { userId })
      // DROPPED는 사용자가 보지 못해야 함
      .andWhere('n.deliveryMethod <> :dropped', { dropped: 'DROPPED' })
      .orderBy('n.id', 'DESC')
      .limit(limit + 1);

    if (query.cursor) {
      qb.andWhere('n.id < :cursor', { cursor: query.cursor });
    }
    if (query.tone) {
      qb.andWhere('n.triggerTone = :tone', { tone: query.tone });
    }

    const rows = await qb.getMany();
    const hasNext = rows.length > limit;
    const sliced = hasNext ? rows.slice(0, limit) : rows;

    const messageIds = sliced.map((n) => n.messageId).filter(Boolean);
    const digestMap = await this.communicationAcl.getMessageDigestsByIds(messageIds);

    const items: CatchupFeedItem[] = sliced.map((n) => {
      const digest = digestMap.get(n.messageId);
      return {
        notificationId: n.id,
        messageId: n.messageId,
        roomId: digest?.roomId ?? null,
        senderUserId: digest?.senderUserId ?? null,
        senderNickname: digest?.senderNickname ?? null,
        content: digest?.content ?? null,
        contentType: digest?.contentType ?? null,
        tone: n.triggerTone,
        deliveryMethod: n.deliveryMethod,
        scheduledAt: n.scheduledAt?.toISOString() ?? null,
        isRead: n.deliveryStatus !== 'PENDING',
        createdAt: n.createdAt.toISOString(),
      };
    });

    const stats = await this.computeStats(userId);

    return {
      items,
      hasNext,
      nextCursor: hasNext ? sliced[sliced.length - 1].id : null,
      stats,
    };
  }

  private async computeStats(userId: number): Promise<{
    needsReply: number;
    sharedLinks: number;
    casual: number;
  }> {
    const baseQb = Notification.createQueryBuilder('n')
      .where('n.userId = :userId', { userId })
      .andWhere('n.deliveryStatus = :pending', { pending: 'PENDING' });

    const [needsReply, sharedLinks, casual] = await Promise.all([
      baseQb
        .clone()
        .andWhere('n.triggerTone IN (:...tones)', { tones: ['ASK', 'URGENT'] })
        .getCount(),
      baseQb
        .clone()
        .andWhere('n.triggerTone = :tone', { tone: 'SHARE' })
        .getCount(),
      baseQb
        .clone()
        .andWhere('n.triggerTone = :tone', { tone: 'CHAT' })
        .getCount(),
    ]);

    return { needsReply, sharedLinks, casual };
  }
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}
