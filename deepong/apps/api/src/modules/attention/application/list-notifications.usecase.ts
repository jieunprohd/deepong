import { Injectable } from '@nestjs/common';
import { Notification } from '../domain/notification.entity';
import { CommunicationAcl } from '../infrastructure/acl/communication.acl';
import {
  ListNotificationsQueryDto,
  NotificationListResponse,
  NotificationResponse,
} from './dto/notification.dto';

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

@Injectable()
export class ListNotificationsUseCase {
  constructor(private readonly communicationAcl: CommunicationAcl) {}

  public async execute(
    userId: number,
    query: ListNotificationsQueryDto,
  ): Promise<NotificationListResponse> {
    const limit = clamp(query.limit ?? DEFAULT_LIMIT, 1, MAX_LIMIT);
    const unreadOnly = query.unreadOnly === 'true';

    const qb = Notification.createQueryBuilder('n')
      .where('n.userId = :userId', { userId })
      .orderBy('n.id', 'DESC')
      .limit(limit + 1);

    if (query.cursor) {
      qb.andWhere('n.id < :cursor', { cursor: query.cursor });
    }
    if (unreadOnly) {
      qb.andWhere('n.deliveryStatus = :pending', { pending: 'PENDING' });
    }
    if (query.tone) {
      qb.andWhere('n.triggerTone = :tone', { tone: query.tone });
    }

    const rows = await qb.getMany();
    const hasNext = rows.length > limit;
    const items = hasNext ? rows.slice(0, limit) : rows;

    const messageIds = items.map((n) => n.messageId).filter(Boolean);
    const digestMap = await this.communicationAcl.getDigestsByMessageIds(messageIds);

    return {
      items: items.map((n) => {
        const r = NotificationResponse.from(n);
        const digest = digestMap.get(n.messageId);
        if (digest) {
          r.roomId = digest.roomId;
          r.roomName = digest.roomName;
          r.roomType = digest.roomType;
          r.senderUserId = digest.senderUserId;
          r.senderNickname = digest.senderNickname;
          r.content = digest.content;
          r.contentType = digest.contentType;
        }
        return r;
      }),
      hasNext,
      nextCursor: hasNext ? items[items.length - 1].id : null,
    };
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
