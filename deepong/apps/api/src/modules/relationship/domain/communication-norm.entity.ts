import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { AggregateRoot } from '@shared/types/aggregate-root.base';

export type DefaultTone = 'CHAT' | 'ASK' | 'URGENT' | 'SHARE';
export type FeedPriority = 'LOW' | 'NORMAL' | 'HIGH';

/**
 * CommunicationNorm Aggregate (Relationship Context)
 *
 * 친구 1쌍에 대해 양쪽 각자 1개씩 보유. (OWNER_USER_ID, FRIEND_USER_ID) 조합으로 유일.
 *
 *  - defaultTone: 이 친구에게 메시지 보낼 때 기본 톤
 *  - allowUrgent: 상대가 URGENT 태그를 사용해도 되는지 (수신자 쪽에서 결정)
 *  - shareReadReceipt / sharePresence / shareWorktime: 친구별 공개 토글
 *  - feedPriority: 따라잡기 피드 정렬 우선순위 (HIGH = 우선 친구)
 *  - muted: 전체 알림 차단 (Attention 정책에서 DROPPED 강제)
 *
 * Attention 컨텍스트에 노출될 때는 ACL을 거쳐
 *  { isPriority: feedPriority === 'HIGH', isMuted: muted } 같은 형태로 변환된다.
 */
@Entity('COMMUNICATION_NORM')
@Unique('UK_COMM_NORM_PAIR', ['ownerUserId', 'friendUserId'])
export class CommunicationNorm extends AggregateRoot {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: number;

  @Index()
  @Column({ type: 'bigint', unsigned: true })
  ownerUserId!: number;

  @Index()
  @Column({ type: 'bigint', unsigned: true })
  friendUserId!: number;

  @Column({
    type: 'enum',
    enum: ['CHAT', 'ASK', 'URGENT', 'SHARE'],
    default: 'CHAT',
  })
  defaultTone!: DefaultTone;

  @Column({ type: 'boolean', default: true })
  allowUrgent!: boolean;

  @Column({ type: 'boolean', default: true })
  shareReadReceipt!: boolean;

  @Column({ type: 'boolean', default: true })
  sharePresence!: boolean;

  @Column({ type: 'boolean', default: true })
  shareWorktime!: boolean;

  @Column({
    type: 'enum',
    enum: ['LOW', 'NORMAL', 'HIGH'],
    default: 'NORMAL',
  })
  feedPriority!: FeedPriority;

  @Column({ type: 'varchar', length: 100, nullable: true })
  nicknameMemo!: string | null;

  @Column({ type: 'boolean', default: false })
  muted!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  // ---- Factory ----

  static defaultsFor(
    ownerUserId: number,
    friendUserId: number,
  ): CommunicationNorm {
    if (ownerUserId === friendUserId) {
      throw new Error('자기 자신에 대한 규범은 만들 수 없습니다.');
    }
    const norm = new CommunicationNorm();
    norm.ownerUserId = ownerUserId;
    norm.friendUserId = friendUserId;
    norm.defaultTone = 'CHAT';
    norm.allowUrgent = true;
    norm.shareReadReceipt = true;
    norm.sharePresence = true;
    norm.shareWorktime = true;
    norm.feedPriority = 'NORMAL';
    norm.nicknameMemo = null;
    norm.muted = false;
    return norm;
  }

  // ---- Domain Methods ----

  isPriorityFriend(): boolean {
    return this.feedPriority === 'HIGH';
  }

  isMuted(): boolean {
    return this.muted;
  }

  update(patch: {
    defaultTone?: DefaultTone;
    allowUrgent?: boolean;
    shareReadReceipt?: boolean;
    sharePresence?: boolean;
    shareWorktime?: boolean;
    feedPriority?: FeedPriority;
    nicknameMemo?: string | null;
    muted?: boolean;
  }): void {
    if (patch.defaultTone !== undefined) this.defaultTone = patch.defaultTone;
    if (patch.allowUrgent !== undefined) this.allowUrgent = patch.allowUrgent;
    if (patch.shareReadReceipt !== undefined)
      this.shareReadReceipt = patch.shareReadReceipt;
    if (patch.sharePresence !== undefined)
      this.sharePresence = patch.sharePresence;
    if (patch.shareWorktime !== undefined)
      this.shareWorktime = patch.shareWorktime;
    if (patch.feedPriority !== undefined)
      this.feedPriority = patch.feedPriority;
    if (patch.nicknameMemo !== undefined)
      this.nicknameMemo = patch.nicknameMemo;
    if (patch.muted !== undefined) {
      this.muted = patch.muted;
      // muted과 priority는 상호 배타: muted=true면 priority 강등
      if (patch.muted && this.feedPriority === 'HIGH') {
        this.feedPriority = 'NORMAL';
      }
    }

    // 우선 친구로 승격 시 muted 해제
    if (patch.feedPriority === 'HIGH' && this.muted) {
      this.muted = false;
    }
  }
}
