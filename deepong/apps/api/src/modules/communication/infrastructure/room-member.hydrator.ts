import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { RoomMemberView } from '../application/dto/room.dto';

@Injectable()
export class RoomMemberHydrator {
  constructor(private readonly dataSource: DataSource) {}

  async hydrateByUserIds(userIds: number[]): Promise<RoomMemberView[]> {
    if (!userIds.length) return [];
    const rows = await this.dataSource.query(
      `SELECT u.ID, u.NICKNAME, u.AVATAR_URL FROM USER u WHERE u.ID IN (?)`,
      [userIds],
    );
    const byId = new Map<number, { nickname: string; avatarUrl: string | null }>();
    for (const u of rows) {
      byId.set(Number(u.ID), { nickname: u.NICKNAME, avatarUrl: u.AVATAR_URL ?? null });
    }
    return userIds.map((uid) => ({
      userId: String(uid),
      nickname: byId.get(uid)?.nickname ?? '',
      avatarUrl: byId.get(uid)?.avatarUrl ?? null,
    }));
  }

  async hydrateByRoomIds(roomIds: number[]): Promise<Map<number, RoomMemberView[]>> {
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
