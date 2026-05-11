import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, IsNull } from 'typeorm';
import { Room } from '../domain/room/room.entity';
import { RoomMember } from '../domain/room/room-member.entity';
import { RoomMemberHydrator } from '../infrastructure/room-member.hydrator';
import { MessageGateway } from '../interface/message.gateway';

@Injectable()
export class LeaveRoomUseCase {
  constructor(
    private readonly dataSource: DataSource,
    private readonly memberHydrator: RoomMemberHydrator,
    private readonly gateway: MessageGateway,
  ) {}

  async execute(userId: number, roomId: number): Promise<void> {
    const room = await Room.findOne({ where: { id: roomId } });
    if (!room) throw new NotFoundException('방을 찾을 수 없습니다.');
    if (room.type !== 'GROUP') {
      throw new BadRequestException('1:1 대화방은 나갈 수 없습니다.');
    }

    const membership = await RoomMember.findOne({
      where: { roomId, userId, leftAt: IsNull() },
    });
    if (!membership) throw new ForbiddenException('방 멤버가 아닙니다.');

    membership.leftAt = new Date();
    await membership.save();

    await this.gateway.leaveRoom(userId, roomId);
    this.gateway.emitRoomLeft(userId, { roomId: String(roomId) });

    const remainingMembers = await this.memberHydrator.hydrateByRoomIds([roomId]);
    const members = remainingMembers.get(roomId) ?? [];

    if (members.length === 0) return;

    this.gateway.emitRoomUpdated(roomId, {
      id: String(room.id),
      type: room.type,
      name: room.name,
      defaultTone: room.defaultTone,
      members,
      lastMessage: null,
      lastMessageAt: room.lastMessageAt?.toISOString() ?? null,
      createdAt: room.createdAt.toISOString(),
    });
  }
}
