import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

export interface MessageSenderInfo {
  messageId: number;
  senderUserId: number;
  senderNickname: string;
}

@Injectable()
export class CommunicationAcl {
  constructor(private readonly dataSource: DataSource) {}

  async getSenderInfoByMessageIds(messageIds: number[]): Promise<Map<number, MessageSenderInfo>> {
    if (!messageIds.length) return new Map();

    const placeholders = messageIds.map(() => '?').join(',');
    const rows = await this.dataSource.query(
      `SELECT m.ID as messageId, m.SENDER_USER_ID as senderUserId, u.NICKNAME as senderNickname
       FROM MESSAGE m
       INNER JOIN USER u ON u.ID = m.SENDER_USER_ID
       WHERE m.ID IN (${placeholders})`,
      messageIds,
    );

    const map = new Map<number, MessageSenderInfo>();
    for (const row of rows) {
      map.set(Number(row.messageId), {
        messageId: Number(row.messageId),
        senderUserId: Number(row.senderUserId),
        senderNickname: row.senderNickname,
      });
    }
    return map;
  }
}
