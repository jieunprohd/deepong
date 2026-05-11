import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Message } from '../domain/message/message.entity';
import { Tone } from '../domain/message/tone.vo';
import { MessageContent } from '../domain/message/content.vo';
import { RoomSequenceGenerator } from '../infrastructure/room-sequence-generator';
import { MessageGateway } from '../interface/message.gateway';
import { SendMessageDto, MessageView } from './dto/message.dto';

@Injectable()
export class SendMessageUseCase {
  constructor(
    private readonly dataSource: DataSource,
    private readonly seqGenerator: RoomSequenceGenerator,
    private readonly gateway: MessageGateway,
  ) {}

  async execute(senderUserId: number, roomId: number, dto: SendMessageDto): Promise<MessageView> {
    await this.ensureMember(senderUserId, roomId);

    const existing = await Message.findOne({ where: { clientMessageId: dto.clientMessageId } });
    if (existing) return this.toView(existing);

    const msg = Message.initialize({
      roomId,
      senderUserId,
      clientMessageId: dto.clientMessageId,
      tone: Tone.from(dto.tone),
      contentType: dto.contentType ?? 'TEXT',
      content: MessageContent.of(dto.content),
      replyToMsgId: dto.replyToMsgId ?? null,
    });

    const seq = await this.seqGenerator.next(roomId);
    msg.assignSequence(seq);
    await msg.save();

    await this.dataSource.query(
      `UPDATE ROOM SET LAST_MESSAGE_AT = ? WHERE ID = ?`,
      [msg.createdAt, roomId],
    );

    const view = this.toView(msg);
    this.gateway.emitMessageNew(roomId, view);
    return view;
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
