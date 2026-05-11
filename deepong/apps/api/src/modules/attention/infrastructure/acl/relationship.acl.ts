import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

export interface FriendNorm {
  isPriorityFriend: boolean;
  isMuted: boolean;
  allowUrgent: boolean;
}

const DEFAULT_NORM: FriendNorm = {
  isPriorityFriend: false,
  isMuted: false,
  allowUrgent: true,
};

/**
 * Attention 컨텍스트가 Relationship 컨텍스트의 CommunicationNorm을 조회하기 위한 ACL.
 * Relationship 모듈의 Entity·Repository를 직접 import 하지 않고 raw SQL로 격리한다.
 */
@Injectable()
export class RelationshipAcl {
  constructor(private readonly dataSource: DataSource) {}

  /**
   * 수신자(ownerUserId) 입장에서 발신자(friendUserId)에 대한 노름을 조회.
   * 노름이 없으면 기본값(우선 X, 뮤트 X, urgent 허용) 반환.
   */
  async getNormFor(
    ownerUserId: number,
    friendUserId: number,
  ): Promise<FriendNorm> {
    const rows = await this.dataSource.query(
      `SELECT FEED_PRIORITY, MUTED, ALLOW_URGENT
       FROM COMMUNICATION_NORM
       WHERE OWNER_USER_ID = ? AND FRIEND_USER_ID = ?
       LIMIT 1`,
      [ownerUserId, friendUserId],
    );
    if (!rows.length) return DEFAULT_NORM;
    const r = rows[0];
    return {
      isPriorityFriend: r.FEED_PRIORITY === 'HIGH',
      isMuted: !!Number(r.MUTED),
      allowUrgent: !!Number(r.ALLOW_URGENT),
    };
  }

  /**
   * 여러 발신자에 대한 노름을 한 번에 조회 (배치).
   */
  async getNormsFor(
    ownerUserId: number,
    friendUserIds: number[],
  ): Promise<Map<number, FriendNorm>> {
    if (!friendUserIds.length) return new Map();
    const rows = await this.dataSource.query(
      `SELECT FRIEND_USER_ID, FEED_PRIORITY, MUTED, ALLOW_URGENT
       FROM COMMUNICATION_NORM
       WHERE OWNER_USER_ID = ? AND FRIEND_USER_ID IN (?)`,
      [ownerUserId, friendUserIds],
    );
    const map = new Map<number, FriendNorm>();
    for (const r of rows) {
      map.set(Number(r.FRIEND_USER_ID), {
        isPriorityFriend: r.FEED_PRIORITY === 'HIGH',
        isMuted: !!Number(r.MUTED),
        allowUrgent: !!Number(r.ALLOW_URGENT),
      });
    }
    return map;
  }
}
