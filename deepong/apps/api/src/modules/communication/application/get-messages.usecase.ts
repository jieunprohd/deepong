import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { DataSource, IsNull } from 'typeorm';
import { Message } from '../domain/message/message.entity';
import { GetMessagesQueryDto, MessageView } from './dto/message.dto';

const DEFAULT_LIMIT = 50;

@Injectable()
export class GetMessagesUseCase {
  constructor(private readonly dataSource: DataSource) {}

  async execute(userId: number, roomId: number, query: GetMessagesQueryDto): Promise<{ messages: MessageView[]; hasNext: boolean }> {
    await this.ensureMember(userId, roomId);

    const limit = Math.min(Number(query.limit) || DEFAULT_LIMIT, 100);

    const qb = Message.createQueryBuilder('m')
      .where('m.roomId = :roomId', { roomId })
      .andWhere('m.deletedAt IS NULL')
      .orderBy('m.seq', 'DESC')
      .limit(limit + 1);

    if (query.beforeSeq) {
      qb.andWhere('m.seq < :beforeSeq', { beforeSeq: query.beforeSeq });
    }

    const rows = await qb.getMany();
    const hasNext = rows.length > limit;
    const sliced = hasNext ? rows.slice(0, limit) : rows;

    return {
      messages: sliced.map(this.toView),
      hasNext,
    };
  }

  private async ensureMember(userId: number, roomId: number): Promise<void> {
    const rows = await this.dataSource.query(
      `SELECT id FROM ROOM_MEMBER WHERE ROOM_ID = ? AND USER_ID = ? AND LEFT_AT IS NULL LIMIT 1`,
      [roomId, userId],
    );
    if (!rows.length) {
      const room = await this.dataSource.query(`SELECT id FROM ROOM WHERE ID = ? LIMIT 1`, [roomId]);
      if (!room.length) throw new NotFoundException('방을 찾을 수 없습니다.');
      throw new ForbiddenException('방 멤버가 아닙니다.');
    }
  }

  private toView(msg: Message): MessageView {
    return {
      id: String(msg.id),
      roomId: String(msg.roomId),
      senderUserId: String(msg.senderUserId),
      clientMessageId: msg.clientMessageId,
      seq: msg.seq!,
      tone: msg['_tone'],
      contentType: msg.contentType,
      content: msg['_content'],
      replyToMessageId: msg.replyToMsgId ? String(msg.replyToMsgId) : null,
      version: msg.version,
      createdAt: msg.createdAt.toISOString(),
      editedAt: msg.editedAt?.toISOString() ?? null,
    };
  }
}
