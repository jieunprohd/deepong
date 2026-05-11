import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Message } from '../domain/message/message.entity';
import { MessageContent } from '../domain/message/content.vo';
import { MessageGateway } from '../interface/message.gateway';
import { EditMessageDto, MessageView } from './dto/message.dto';

@Injectable()
export class EditMessageUseCase {
  constructor(private readonly gateway: MessageGateway) {}

  async execute(userId: number, roomId: number, messageId: number, dto: EditMessageDto): Promise<MessageView> {
    const msg = await Message.findOne({ where: { id: messageId, roomId } });
    if (!msg) throw new NotFoundException('메시지를 찾을 수 없습니다.');
    if (msg.senderUserId !== userId) throw new ForbiddenException('본인의 메시지만 수정할 수 있습니다.');

    try {
      msg.edit(MessageContent.of(dto.content), dto.version);
    } catch (e: any) {
      if (e.message === 'VERSION_CONFLICT') throw new ConflictException('메시지가 이미 수정되었습니다.');
      throw e;
    }

    await msg.save();

    const view = this.toView(msg);
    this.gateway.emitMessageUpdated(roomId, view);
    return view;
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
