import { ArrayMinSize, IsArray, IsEnum, IsOptional, IsString, IsNumber, MaxLength } from 'class-validator';
import { ToneType } from '../../domain/message/tone.vo';
import { RoomType } from '../../domain/room/room.entity';

export class CreateRoomDto {
  @IsEnum(['DIRECT', 'GROUP'])
  type!: RoomType;

  @IsArray()
  @IsNumber({}, { each: true })
  memberUserIds!: number[];

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEnum(['CHAT', 'ASK', 'URGENT', 'SHARE'])
  defaultTone?: ToneType;
}

export class UpdateRoomDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;
}

export class AddRoomMembersDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsNumber({}, { each: true })
  memberUserIds!: number[];
}

export class GetRoomsQueryDto {
  @IsOptional()
  cursor?: string;

  @IsOptional()
  limit?: number;
}

export interface RoomMemberView {
  userId: string;
  nickname: string;
  avatarUrl: string | null;
}

export interface RoomLastMessageView {
  content: string;
  tone: string;
  senderUserId: string;
  createdAt: string;
}

export interface RoomView {
  id: string;
  type: string;
  name: string | null;
  defaultTone: string;
  members: RoomMemberView[];
  lastMessage: RoomLastMessageView | null;
  lastMessageAt: string | null;
  createdAt: string;
}
