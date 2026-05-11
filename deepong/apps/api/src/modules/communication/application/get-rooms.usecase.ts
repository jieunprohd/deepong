import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { GetRoomsQueryDto, RoomMemberView, RoomView } from './dto/room.dto';

const DEFAULT_LIMIT = 20;

@Injectable()
export class GetRoomsUseCase {
  constructor(private readonly dataSource: DataSource) {}

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
    const membersByRoom = await this.fetchMembersByRoom(roomIds);

    const rooms: RoomView[] = sliced.map((r: any) => ({
      id: String(r.ID),
      type: r.TYPE,
      name: r.NAME,
      defaultTone: r.DEFAULT_TONE,
      members: membersByRoom.get(Number(r.ID)) ?? [],
      lastMessageAt: r.LAST_MESSAGE_AT ? new Date(r.LAST_MESSAGE_AT).toISOString() : null,
      createdAt: new Date(r.CREATED_AT).toISOString(),
    }));

    return { rooms, hasNext };
  }

  private async fetchMembersByRoom(roomIds: number[]): Promise<Map<number, RoomMemberView[]>> {
    if (!roomIds.length) return new Map();
    const rows = await this.dataSource.query(
      `SELECT m.ROOM_ID, m.USER_ID, u.NICKNAME, u.AVATAR_URL
       FROM ROOM_MEMBER m
       INNER JOIN USER u ON u.ID = m.USER_ID
       WHERE m.ROOM_ID IN (?) AND m.LEFT_AT IS NULL`,
      [roomIds],
    );
    const map = new Map<number, RoomMemberView[]>();
    for (const m of rows) {
      const roomId = Number(m.ROOM_ID);
      const member: RoomMemberView = {
        userId: String(m.USER_ID),
        nickname: m.NICKNAME,
        avatarUrl: m.AVATAR_URL ?? null,
      };
      const list = map.get(roomId) ?? [];
      list.push(member);
      map.set(roomId, list);
    }
    return map;
  }
}
