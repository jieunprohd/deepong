import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

export interface NotificationMessageDigest {
  messageId: number;
  roomId: number;
  roomName: string | null;
  roomType: string;
  senderUserId: number;
  senderNickname: string;
  content: string;
  contentType: string;
}

@Injectable()
export class CommunicationAcl {
  constructor(private readonly dataSource: DataSource) {}

  async getDigestsByMessageIds(
    messageIds: number[],
  ): Promise<Map<number, NotificationMessageDigest>> {
    if (!messageIds.length) return new Map();

    const rows = await this.dataSource.query(
      `SELECT m.ID, m.ROOM_ID, m.SENDER_USER_ID, m.CONTENT, m.CONTENT_TYPE,
              u.NICKNAME, r.NAME AS ROOM_NAME, r.TYPE AS ROOM_TYPE
       FROM MESSAGE m
       INNER JOIN USER u ON u.ID = m.SENDER_USER_ID
       INNER JOIN ROOM r ON r.ID = m.ROOM_ID
       WHERE m.ID IN (?)`,
      [messageIds],
    );

    const map = new Map<number, NotificationMessageDigest>();
    for (const row of rows) {
      map.set(Number(row.ID), {
        messageId: Number(row.ID),
        roomId: Number(row.ROOM_ID),
        roomName: row.ROOM_NAME ?? null,
        roomType: row.ROOM_TYPE,
        senderUserId: Number(row.SENDER_USER_ID),
        senderNickname: row.NICKNAME,
        content: row.CONTENT,
        contentType: row.CONTENT_TYPE,
      });
    }
    return map;
  }
}
