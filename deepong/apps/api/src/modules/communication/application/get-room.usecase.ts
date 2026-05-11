import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { RoomMemberHydrator } from '../infrastructure/room-member.hydrator';
import { RoomLastMessageView, RoomView } from './dto/room.dto';

@Injectable()
export class GetRoomUseCase {
  constructor(
    private readonly dataSource: DataSource,
    private readonly memberHydrator: RoomMemberHydrator,
  ) {}

  async execute(userId: number, roomId: number): Promise<RoomView> {
    const rooms = await this.dataSource.query(
      `SELECT r.ID, r.TYPE, r.NAME, r.DEFAULT_TONE, r.CREATED_BY, r.LAST_MESSAGE_AT, r.CREATED_AT
       FROM ROOM r
       WHERE r.ID = ? LIMIT 1`,
      [roomId],
    );
    if (!rooms.length) throw new NotFoundException('방을 찾을 수 없습니다.');

    const membersByRoom = await this.memberHydrator.hydrateByRoomIds([roomId]);
    const members = membersByRoom.get(roomId) ?? [];

    const isMember = members.some((m) => Number(m.userId) === userId);
    if (!isMember) throw new ForbiddenException('방 멤버가 아닙니다.');

    const r = rooms[0];
    const lastMessage = await this.fetchLastMessage(roomId);
    return {
      id: String(r.ID),
      type: r.TYPE,
      name: r.NAME,
      defaultTone: r.DEFAULT_TONE,
      members,
      lastMessage,
      lastMessageAt: r.LAST_MESSAGE_AT ? new Date(r.LAST_MESSAGE_AT).toISOString() : null,
      createdAt: new Date(r.CREATED_AT).toISOString(),
    };
  }

  private async fetchLastMessage(roomId: number): Promise<RoomLastMessageView | null> {
    const rows = await this.dataSource.query(
      `SELECT CONTENT, TONE, SENDER_USER_ID, CREATED_AT
       FROM MESSAGE
       WHERE ROOM_ID = ? AND DELETED_AT IS NULL
       ORDER BY SEQ DESC LIMIT 1`,
      [roomId],
    );
    if (!rows.length) return null;
    const m = rows[0];
    return {
      content: m.CONTENT,
      tone: m.TONE,
      senderUserId: String(m.SENDER_USER_ID),
      createdAt: new Date(m.CREATED_AT).toISOString(),
    };
  }
}
