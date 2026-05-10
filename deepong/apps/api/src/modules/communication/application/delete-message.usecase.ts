import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Message } from '../domain/message/message.entity';
import { MessageGateway } from '../interface/message.gateway';

@Injectable()
export class DeleteMessageUseCase {
  constructor(private readonly gateway: MessageGateway) {}

  async execute(userId: number, roomId: number, messageId: number): Promise<void> {
    const msg = await Message.findOne({ where: { id: messageId, roomId } });
    if (!msg) throw new NotFoundException('메시지를 찾을 수 없습니다.');
    if (msg.senderUserId !== userId) throw new ForbiddenException('본인의 메시지만 삭제할 수 있습니다.');

    msg.softDelete();
    await msg.save();

    this.gateway.emitMessageDeleted(roomId, {
      roomId: String(roomId),
      messageId: String(messageId),
      seq: msg.seq!,
      deletedAt: msg.deletedAt!.toISOString(),
    });
  }
}
