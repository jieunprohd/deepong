import { IsEnum, IsInt, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';
import {
  FeedAction,
  FeedActionType,
} from '../../domain/feed-action.entity';
import { ToneType } from '@modules/attention/domain/tone.vo';
import { DeliveryMethod } from '@modules/attention/domain/attention-decision.vo';

export class ListCatchupQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;

  /** 마지막 항목의 notification id (더 작은 id로 페이지네이션) */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  cursor?: number;

  @IsOptional()
  @IsEnum(['CHAT', 'ASK', 'URGENT', 'SHARE'])
  tone?: ToneType;
}

/** 피드 1개 항목. Notification + 발신자 정보를 합쳐 가공한 Read Model */
export class CatchupFeedItem {
  notificationId!: number;
  messageId!: number;
  roomId!: number | null;
  senderUserId!: number | null;
  senderNickname!: string | null;
  content!: string | null;
  contentType!: string | null;
  tone!: ToneType;
  deliveryMethod!: DeliveryMethod;
  scheduledAt!: string | null;
  isRead!: boolean;
  createdAt!: string;
}

export class CatchupFeedResponse {
  items!: CatchupFeedItem[];
  hasNext!: boolean;
  nextCursor!: number | null;
  /** 피드 진입 시 한 번 보여줄 통계 */
  stats!: {
    needsReply: number;
    sharedLinks: number;
    casual: number;
  };
}

export class RecordFeedActionDto {
  @IsInt()
  @Min(1)
  messageId!: number;

  @IsEnum(['REPLY_NOW', 'LATER', 'MARK_READ', 'DISMISS', 'OPEN_CHAT'])
  action!: FeedActionType;
}

export class FeedActionResponse {
  id!: number;
  userId!: number;
  messageId!: number;
  action!: FeedActionType;
  createdAt!: string;

  static from(a: FeedAction): FeedActionResponse {
    const r = new FeedActionResponse();
    r.id = a.id;
    r.userId = a.userId;
    r.messageId = a.messageId;
    r.action = a.action;
    r.createdAt = a.createdAt.toISOString();
    return r;
  }
}
