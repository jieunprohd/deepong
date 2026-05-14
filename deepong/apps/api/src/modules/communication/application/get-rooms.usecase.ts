import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { RoomMemberHydrator } from '../infrastructure/room-member.hydrator';
import { GetRoomsQueryDto, RoomLastMessageView, RoomView } from './dto/room.dto';

const DEFAULT_LIMIT = 20;

@Injectable()
export class GetRoomsUseCase {
  constructor(
    private readonly dataSource: DataSource,
    private readonly memberHydrator: RoomMemberHydrator,
  ) {}

  async execute(userId: number, query: GetRoomsQueryDto): Promise<{ rooms: RoomView[]; hasNext: boolean }> {
    const limit = Math.min(Number(query.limit) || DEFAULT_LIMIT, 100);

    let sql = `
      SELECT r.ID, r.TYPE, r.NAME, r.DEFAULT_TONE, r.CREATED_BY, r.LAST_MESSAGE_AT, r.CREATED_AT
      FROM ROOM r
      INNER JOIN ROOM_MEMBER m ON m.ROOM_ID = r.ID AND m.USER_ID = ? AND m.LEFT_AT IS NULL
    `;
    const params: unknown[] = [userId];

    if (query.cursor) {
      sql += ` WHERE r.LAST_MESSAGE_AT < ?`;
      params.push(new Date(query.cursor));
    }

    sql += ` ORDER BY r.LAST_MESSAGE_AT DESC LIMIT ?`;
    params.push(limit + 1);

    const rows = await this.dataSource.query(sql, params);
    const hasNext = rows.length > limit;
    const sliced = hasNext ? rows.slice(0, limit) : rows;

    const roomIds = sliced.map((r: any) => Number(r.ID));
    const [membersByRoom, lastMessageByRoom] = await Promise.all([
      this.memberHydrator.hydrateByRoomIds(roomIds),
      this.fetchLastMessageByRoom(roomIds),
    ]);

    const rooms: RoomView[] = sliced.map((r: any) => ({
      id: String(r.ID),
      type: r.TYPE,
      name: r.NAME,
      defaultTone: r.DEFAULT_TONE,
      members: membersByRoom.get(Number(r.ID)) ?? [],
      lastMessage: lastMessageByRoom.get(Number(r.ID)) ?? null,
      lastMessageAt: r.LAST_MESSAGE_AT ? new Date(r.LAST_MESSAGE_AT).toISOString() : null,
      createdAt: new Date(r.CREATED_AT).toISOString(),
    }));

    return { rooms, hasNext };
  }

  private async fetchLastMessageByRoom(roomIds: number[]): Promise<Map<number, RoomLastMessageView>> {
    if (!roomIds.length) return new Map();
    const rows = await this.dataSource.query(
      `SELECT msg.ROOM_ID, msg.CONTENT, msg.TONE, msg.SENDER_USER_ID, msg.CREATED_AT
       FROM MESSAGE msg
       INNER JOIN (
         SELECT ROOM_ID, MAX(SEQ) AS MAX_SEQ
         FROM MESSAGE
         WHERE ROOM_ID IN (?) AND DELETED_AT IS NULL
         GROUP BY ROOM_ID
       ) latest ON latest.ROOM_ID = msg.ROOM_ID AND latest.MAX_SEQ = msg.SEQ`,
      [roomIds],
    );
    const map = new Map<number, RoomLastMessageView>();
    for (const m of rows) {
      map.set(Number(m.ROOM_ID), {
        content: m.CONTENT,
        tone: m.TONE,
        senderUserId: String(m.SENDER_USER_ID),
        createdAt: new Date(m.CREATED_AT).toISOString(),
      });
    }
    return map;
  }
}
