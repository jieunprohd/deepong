import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import {
  CommunicationNorm,
  DefaultTone,
  FeedPriority,
} from '../../domain/communication-norm.entity';

export class UpsertCommunicationNormDto {
  @IsOptional()
  @IsEnum(['CHAT', 'ASK', 'URGENT', 'SHARE'])
  defaultTone?: DefaultTone;

  @IsOptional()
  @IsBoolean()
  allowUrgent?: boolean;

  @IsOptional()
  @IsBoolean()
  shareReadReceipt?: boolean;

  @IsOptional()
  @IsBoolean()
  sharePresence?: boolean;

  @IsOptional()
  @IsBoolean()
  shareWorktime?: boolean;

  @IsOptional()
  @IsEnum(['LOW', 'NORMAL', 'HIGH'])
  feedPriority?: FeedPriority;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  nicknameMemo?: string | null;

  @IsOptional()
  @IsBoolean()
  muted?: boolean;
}

export class CommunicationNormResponse {
  id!: number;
  ownerUserId!: number;
  friendUserId!: number;
  defaultTone!: DefaultTone;
  allowUrgent!: boolean;
  shareReadReceipt!: boolean;
  sharePresence!: boolean;
  shareWorktime!: boolean;
  feedPriority!: FeedPriority;
  nicknameMemo!: string | null;
  muted!: boolean;
  isPriorityFriend!: boolean;
  isMuted!: boolean;
  updatedAt!: string;

  static from(n: CommunicationNorm): CommunicationNormResponse {
    const r = new CommunicationNormResponse();
    r.id = n.id;
    r.ownerUserId = n.ownerUserId;
    r.friendUserId = n.friendUserId;
    r.defaultTone = n.defaultTone;
    r.allowUrgent = n.allowUrgent;
    r.shareReadReceipt = n.shareReadReceipt;
    r.sharePresence = n.sharePresence;
    r.shareWorktime = n.shareWorktime;
    r.feedPriority = n.feedPriority;
    r.nicknameMemo = n.nicknameMemo;
    r.muted = n.muted;
    r.isPriorityFriend = n.isPriorityFriend();
    r.isMuted = n.isMuted();
    r.updatedAt = n.updatedAt.toISOString();
    return r;
  }
}

export class CommunicationNormListResponse {
  items!: CommunicationNormResponse[];
}
