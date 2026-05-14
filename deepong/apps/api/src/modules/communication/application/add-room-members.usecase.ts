import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, IsNull } from 'typeorm';
import { Room } from '../domain/room/room.entity';
import { RoomMember } from '../domain/room/room-member.entity';
import { RelationshipAcl } from '../infrastructure/acl/relationship.acl';
import { RoomMemberHydrator } from '../infrastructure/room-member.hydrator';
import { MessageGateway } from '../interface/message.gateway';
import { AddRoomMembersDto, RoomView } from './dto/room.dto';

@Injectable()
export class AddRoomMembersUseCase {
  constructor(
    private readonly dataSource: DataSource,
    private readonly relationshipAcl: RelationshipAcl,
    private readonly memberHydrator: RoomMemberHydrator,
    private readonly gateway: MessageGateway,
  ) {}

  async execute(userId: number, roomId: number, dto: AddRoomMembersDto): Promise<RoomView> {
    const room = await Room.findOne({ where: { id: roomId } });
    if (!room) throw new NotFoundException('방을 찾을 수 없습니다.');
    if (room.type !== 'GROUP') {
      throw new BadRequestException('1:1 대화방에는 멤버를 추가할 수 없습니다.');
    }

    const inviter = await RoomMember.findOne({
      where: { roomId, userId, leftAt: IsNull() },
    });
    if (!inviter) throw new ForbiddenException('방 멤버가 아닙니다.');

    const requested = [...new Set(dto.memberUserIds)].filter((id) => id !== userId);
    if (requested.length === 0) {
      throw new BadRequestException('추가할 멤버가 없습니다.');
    }

    const existing = await RoomMember.find({ where: { roomId, leftAt: IsNull() } });
    const existingIds = new Set(existing.map((m) => Number(m.userId)));
    const newMemberIds = requested.filter((id) => !existingIds.has(id));
    if (newMemberIds.length === 0) {
      throw new BadRequestException('이미 모두 멤버입니다.');
    }

    for (const peerId of newMemberIds) {
      const friends = await this.relationshipAcl.areFriends(userId, peerId);
      if (!friends) {
        throw new ForbiddenException(
          `친구가 아닌 사용자(id=${peerId})는 초대할 수 없습니다.`,
        );
      }
    }

    await this.dataSource.transaction(async (manager) => {
      const members = newMemberIds.map((uid) => RoomMember.initialize(roomId, uid));
      await manager.save(RoomMember, members);
    });

    for (const uid of newMemberIds) {
      await this.gateway.joinRoom(uid, roomId);
    }

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
    for (const uid of newMemberIds) {
      this.gateway.emitRoomCreated(uid, view);
    }
    return view;
  }
}
