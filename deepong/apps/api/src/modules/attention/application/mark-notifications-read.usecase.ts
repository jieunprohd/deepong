import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { In } from 'typeorm';
import { Notification } from '../domain/notification.entity';

@Injectable()
export class MarkNotificationsReadUseCase {
  /**
   * 단일 알림을 전달 완료 처리.
   */
  public async markOne(userId: number, notificationId: number): Promise<void> {
    const n = await Notification.findOne({ where: { id: notificationId } });
    if (!n) throw new NotFoundException('알림을 찾을 수 없습니다.');
    if (n.userId !== userId) {
      throw new ForbiddenException('본인 알림만 처리할 수 있습니다.');
    }
    if (n.isPending()) {
      n.markDelivered();
      await n.save();
    }
  }

  /**
   * 사용자 전체의 PENDING 알림을 일괄 DELIVERED로 전환.
   */
  public async markAll(userId: number): Promise<{ updated: number }> {
    const pending = await Notification.find({
      where: { userId, deliveryStatus: 'PENDING' },
    });
    if (pending.length === 0) return { updated: 0 };

    const now = new Date();
    for (const n of pending) {
      n.markDelivered(now);
    }

    await Notification.createQueryBuilder()
      .update(Notification)
      .set({ deliveryStatus: 'DELIVERED', deliveredAt: now })
      .where({ id: In(pending.map((n) => n.id)) })
      .execute();

    return { updated: pending.length };
  }
}
