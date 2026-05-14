import { IsEnum, IsOptional, IsString, IsNumber } from 'class-validator';
import { ToneType } from '../../domain/message/tone.vo';
import { ContentType } from '../../domain/message/message.entity';

export class SendMessageDto {
  @IsString()
  clientMessageId!: string;

  @IsEnum(['CHAT', 'ASK', 'URGENT', 'SHARE'])
  tone!: ToneType;

  @IsOptional()
  @IsEnum(['TEXT', 'IMAGE', 'LINK', 'MIXED'])
  contentType?: ContentType;

  @IsString()
  content!: string;

  @IsOptional()
  @IsNumber()
  replyToMsgId?: number;
}

export class EditMessageDto {
  @IsString()
  content!: string;

  @IsNumber()
  version!: number;
}

export class GetMessagesQueryDto {
  @IsOptional()
  beforeSeq?: number;

  @IsOptional()
  limit?: number;
}

export interface MessageView {
  id: string;
  roomId: string;
  senderUserId: string;
  clientMessageId: string;
  seq: number;
  tone: string;
  contentType: string;
  content: string;
  replyToMessageId: string | null;
  version: number;
  createdAt: string;
  editedAt: string | null;
}
