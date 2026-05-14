import { IsBooleanString, IsEnum, IsInt, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { Notification, NotificationDeliveryStatus } from '../../domain/notification.entity';
import { DeliveryMethod } from '../../domain/attention-decision.vo';
import { ToneType } from '../../domain/tone.vo';
import { PresenceType } from '../../domain/presence.vo';

export class ListNotificationsQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;

  /** 커서 = 마지막 항목의 ID(BIGINT, 더 작은 ID로 페이지네이션) */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  cursor?: number;

  @IsOptional()
  @IsBooleanString()
  unreadOnly?: string;

  @IsOptional()
  @IsEnum(['CHAT', 'ASK', 'URGENT', 'SHARE'])
  tone?: ToneType;
}

export class NotificationResponse {
  id!: number;
  userId!: number;
  messageId!: number;
  roomId!: number | null;
  roomName!: string | null;
  roomType!: string | null;
  senderUserId!: number | null;
  senderNickname!: string | null;
  content!: string | null;
  contentType!: string | null;
  deliveryMethod!: DeliveryMethod;
  deliveryStatus!: NotificationDeliveryStatus;
  triggerTone!: ToneType;
  triggerPresence!: PresenceType;
  scheduledAt!: string | null;
  deliveredAt!: string | null;
  createdAt!: string;

  static from(n: Notification): NotificationResponse {
    const r = new NotificationResponse();
    r.id = n.id;
    r.userId = n.userId;
    r.messageId = n.messageId;
    r.roomId = null;
    r.roomName = null;
    r.roomType = null;
    r.senderUserId = null;
    r.senderNickname = null;
    r.content = null;
    r.contentType = null;
    r.deliveryMethod = n.deliveryMethod;
    r.deliveryStatus = n.deliveryStatus;
    r.triggerTone = n.triggerTone;
    r.triggerPresence = n.triggerPresence;
    r.scheduledAt = n.scheduledAt?.toISOString() ?? null;
    r.deliveredAt = n.deliveredAt?.toISOString() ?? null;
    r.createdAt = n.createdAt.toISOString();
    return r;
  }
}

export class NotificationListResponse {
  items!: NotificationResponse[];
  hasNext!: boolean;
  nextCursor!: number | null;
}
