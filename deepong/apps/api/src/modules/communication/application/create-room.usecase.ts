import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Room } from '../domain/room/room.entity';
import { RoomMember } from '../domain/room/room-member.entity';
import { RelationshipAcl } from '../infrastructure/acl/relationship.acl';
import { MessageGateway } from '../interface/message.gateway';
import { CreateRoomDto, RoomMemberView, RoomView } from './dto/room.dto';

@Injectable()
export class CreateRoomUseCase {
  constructor(
    private readonly dataSource: DataSource,
    private readonly relationshipAcl: RelationshipAcl,
    private readonly gateway: MessageGateway,
  ) {}

  async execute(creatorId: number, dto: CreateRoomDto): Promise<RoomView> {
    const allMemberIds = [...new Set([creatorId, ...dto.memberUserIds])];

    if (dto.type === 'DIRECT') {
      if (allMemberIds.length !== 2) {
        throw new BadRequestException('DIRECT 방은 정확히 2명이어야 합니다.');
      }
      const peerId = allMemberIds.find((id) => id !== creatorId)!;
      const friends = await this.relationshipAcl.areFriends(creatorId, peerId);
      if (!friends) throw new ForbiddenException('친구 관계가 아닙니다.');

      const existing = await this.findExistingDirectRoom(creatorId, peerId);
      if (existing) {
        const members = await this.fetchMembers(allMemberIds);
        return this.toView(existing, members);
      }
    }

    const room = Room.initialize({
      type: dto.type,
      name: dto.name ?? null,
      defaultTone: dto.defaultTone,
      createdBy: creatorId,
      memberIds: allMemberIds,
    });

    await this.dataSource.transaction(async (manager) => {
      await manager.save(Room, room);
      const members = allMemberIds.map((uid) =>
        RoomMember.initialize(room.id, uid, uid === creatorId ? 'ADMIN' : 'MEMBER'),
      );
      await manager.save(RoomMember, members);
    });

    const members = await this.fetchMembers(allMemberIds);
    const view = this.toView(room, members);
    for (const uid of allMemberIds) {
      await this.gateway.joinRoom(uid, room.id);
      this.gateway.emitRoomCreated(uid, view);
    }

    return view;
  }

  private async findExistingDirectRoom(userIdA: number, userIdB: number): Promise<Room | null> {
    const rows = await this.dataSource.query(
      `SELECT r.* FROM ROOM r
       INNER JOIN ROOM_MEMBER ma ON ma.ROOM_ID = r.ID AND ma.USER_ID = ? AND ma.LEFT_AT IS NULL
       INNER JOIN ROOM_MEMBER mb ON mb.ROOM_ID = r.ID AND mb.USER_ID = ? AND mb.LEFT_AT IS NULL
       WHERE r.TYPE = 'DIRECT'
       LIMIT 1`,
      [userIdA, userIdB],
    );
    if (!rows.length) return null;
    const r = rows[0];
    const room = new Room();
    Object.assign(room, {
      id: r.ID,
      type: r.TYPE,
      name: r.NAME,
      defaultTone: r.DEFAULT_TONE,
      createdBy: r.CREATED_BY,
      lastMessageAt: r.LAST_MESSAGE_AT,
      createdAt: r.CREATED_AT,
      updatedAt: r.UPDATED_AT,
    });
    return room;
  }

  private async fetchMembers(memberIds: number[]): Promise<RoomMemberView[]> {
    if (!memberIds.length) return [];
    const rows = await this.dataSource.query(
      `SELECT u.ID, u.NICKNAME, u.AVATAR_URL FROM USER u WHERE u.ID IN (?)`,
      [memberIds],
    );
    const byId = new Map<number, { nickname: string; avatarUrl: string | null }>();
    for (const u of rows) {
      byId.set(Number(u.ID), { nickname: u.NICKNAME, avatarUrl: u.AVATAR_URL ?? null });
    }
    return memberIds.map((uid) => ({
      userId: String(uid),
      nickname: byId.get(uid)?.nickname ?? '',
      avatarUrl: byId.get(uid)?.avatarUrl ?? null,
    }));
  }

  private toView(room: Room, members: RoomMemberView[]): RoomView {
    return {
      id: String(room.id),
      type: room.type,
      name: room.name,
      defaultTone: room.defaultTone,
      members,
      lastMessageAt: room.lastMessageAt?.toISOString() ?? null,
      createdAt: room.createdAt.toISOString(),
    };
  }
}
