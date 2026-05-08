import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { AggregateRoot } from '@shared/types/aggregate-root.base';

export type FeedActionType =
  | 'REPLY_NOW'
  | 'LATER'
  | 'MARK_READ'
  | 'DISMISS'
  | 'OPEN_CHAT';

/**
 * FeedAction Aggregate (Catchup Context)
 *
 * 사용자가 따라잡기 피드 항목에 대해 취한 행동 로그.
 *  - REPLY_NOW: 지금 답장 (대화방 진입 + 작성)
 *  - LATER: 나중에 다시 (피드 잔류)
 *  - MARK_READ: 그냥 읽음 처리
 *  - DISMISS: 피드에서 숨김
 *  - OPEN_CHAT: 대화방 열어보기
 *
 * 추후 분석/추천에 활용. 일종의 사용자 시그널.
 */
@Entity('FEED_ACTION')
export class FeedAction extends AggregateRoot {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: number;

  @Index()
  @Column({ type: 'bigint', unsigned: true })
  userId!: number;

  @Index()
  @Column({ type: 'bigint', unsigned: true })
  messageId!: number;

  @Column({
    type: 'enum',
    enum: ['REPLY_NOW', 'LATER', 'MARK_READ', 'DISMISS', 'OPEN_CHAT'],
  })
  action!: FeedActionType;

  @CreateDateColumn()
  createdAt!: Date;

  // ---- Factory ----

  static record(props: {
    userId: number;
    messageId: number;
    action: FeedActionType;
  }): FeedAction {
    const fa = new FeedAction();
    fa.userId = props.userId;
    fa.messageId = props.messageId;
    fa.action = props.action;
    return fa;
  }
}
