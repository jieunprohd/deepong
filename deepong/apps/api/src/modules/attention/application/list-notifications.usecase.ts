import { Injectable } from '@nestjs/common';
import { Notification } from '../domain/notification.entity';
import {
  ListNotificationsQueryDto,
  NotificationListResponse,
  NotificationResponse,
} from './dto/notification.dto';

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

@Injectable()
export class ListNotificationsUseCase {
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

    return {
      items: items.map((n) => NotificationResponse.from(n)),
      hasNext,
      nextCursor: hasNext ? items[items.length - 1].id : null,
    };
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
