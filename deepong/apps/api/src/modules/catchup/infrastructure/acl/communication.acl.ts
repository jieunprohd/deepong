import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

export interface MessageDigest {
  messageId: number;
  roomId: number;
  senderUserId: number;
  senderNickname: string;
  content: string;
  contentType: string;
}

@Injectable()
export class CommunicationAcl {
  constructor(private readonly dataSource: DataSource) {}

  async getMessageDigestsByIds(messageIds: number[]): Promise<Map<number, MessageDigest>> {
    if (!messageIds.length) return new Map();

    const rows = await this.dataSource.query(
      `SELECT m.ID, m.ROOM_ID, m.SENDER_USER_ID, m.CONTENT, m.CONTENT_TYPE, u.NICKNAME
       FROM MESSAGE m
       INNER JOIN USER u ON u.ID = m.SENDER_USER_ID
       WHERE m.ID IN (?)`,
      [messageIds],
    );

    const map = new Map<number, MessageDigest>();
    for (const row of rows) {
      map.set(Number(row.ID), {
        messageId: Number(row.ID),
        roomId: Number(row.ROOM_ID),
        senderUserId: Number(row.SENDER_USER_ID),
        senderNickname: row.NICKNAME,
        content: row.CONTENT,
        contentType: row.CONTENT_TYPE,
      });
    }
    return map;
  }
}
