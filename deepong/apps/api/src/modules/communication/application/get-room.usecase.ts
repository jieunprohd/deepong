import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { RoomView } from './dto/room.dto';

@Injectable()
export class GetRoomUseCase {
  constructor(private readonly dataSource: DataSource) {}

  async execute(userId: number, roomId: number): Promise<RoomView> {
    const rooms = await this.dataSource.query(
      `SELECT r.ID, r.TYPE, r.NAME, r.DEFAULT_TONE, r.CREATED_BY, r.LAST_MESSAGE_AT, r.CREATED_AT
       FROM ROOM r
       WHERE r.ID = ? LIMIT 1`,
      [roomId],
    );
    if (!rooms.length) throw new NotFoundException('방을 찾을 수 없습니다.');

    const members = await this.dataSource.query(
      `SELECT m.USER_ID, u.NICKNAME, u.AVATAR_URL
       FROM ROOM_MEMBER m
       INNER JOIN USER u ON u.ID = m.USER_ID
       WHERE m.ROOM_ID = ? AND m.LEFT_AT IS NULL`,
      [roomId],
    );

    const isMember = members.some((m: any) => Number(m.USER_ID) === userId);
    if (!isMember) throw new ForbiddenException('방 멤버가 아닙니다.');

    const r = rooms[0];
    return {
      id: String(r.ID),
      type: r.TYPE,
      name: r.NAME,
      defaultTone: r.DEFAULT_TONE,
      members: members.map((m: any) => ({
        userId: String(m.USER_ID),
        nickname: m.NICKNAME,
        avatarUrl: m.AVATAR_URL ?? null,
      })),
      lastMessageAt: r.LAST_MESSAGE_AT ? new Date(r.LAST_MESSAGE_AT).toISOString() : null,
      createdAt: new Date(r.CREATED_AT).toISOString(),
    };
  }
}
