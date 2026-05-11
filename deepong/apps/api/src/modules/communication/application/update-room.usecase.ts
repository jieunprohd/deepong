import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { IsNull } from 'typeorm';
import { Room } from '../domain/room/room.entity';
import { RoomMember } from '../domain/room/room-member.entity';
import { RoomMemberHydrator } from '../infrastructure/room-member.hydrator';
import { MessageGateway } from '../interface/message.gateway';
import { RoomView, UpdateRoomDto } from './dto/room.dto';

@Injectable()
export class UpdateRoomUseCase {
  constructor(
    private readonly memberHydrator: RoomMemberHydrator,
    private readonly gateway: MessageGateway,
  ) {}

  async execute(userId: number, roomId: number, dto: UpdateRoomDto): Promise<RoomView> {
    const room = await Room.findOne({ where: { id: roomId } });
    if (!room) throw new NotFoundException('방을 찾을 수 없습니다.');
    if (room.type !== 'GROUP') {
      throw new BadRequestException('1:1 대화방의 이름은 수정할 수 없습니다.');
    }

    const membership = await RoomMember.findOne({
      where: { roomId, userId, leftAt: IsNull() },
    });
    if (!membership) throw new ForbiddenException('방 멤버가 아닙니다.');

    if (dto.name !== undefined) {
      const trimmed = dto.name.trim();
      room.name = trimmed.length === 0 ? null : trimmed;
    }
    room.updatedAt = new Date();
    await room.save();

    const membersByRoom = await this.memberHydrator.hydrateByRoomIds([roomId]);
    const members = membersByRoom.get(roomId) ?? [];

    const view: RoomView = {
      id: String(room.id),
      type: room.type,
      name: room.name,
      defaultTone: room.defaultTone,
      members,
      lastMessage: null,
      lastMessageAt: room.lastMessageAt?.toISOString() ?? null,
      createdAt: room.createdAt.toISOString(),
    };

    this.gateway.emitRoomUpdated(roomId, view);
    return view;
  }
}
