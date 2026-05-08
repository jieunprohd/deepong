import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { NotificationPreference } from '../../domain/notification-preference.entity';

export class UpdateNotificationPreferenceDto {
  @IsOptional()
  @IsInt()
  @Min(5)
  @Max(480)
  batchIntervalMin?: number;

  @IsOptional()
  @IsBoolean()
  allowUrgentInFocus?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  soundChat?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  soundAsk?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  soundUrgent?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  soundShare?: string | null;

  @IsOptional()
  @IsBoolean()
  osNotification?: boolean;

  @IsOptional()
  @IsBoolean()
  inAppToast?: boolean;
}

export class NotificationPreferenceResponse {
  userId!: number;
  batchIntervalMin!: number;
  allowUrgentInFocus!: boolean;
  soundChat!: string | null;
  soundAsk!: string | null;
  soundUrgent!: string | null;
  soundShare!: string | null;
  osNotification!: boolean;
  inAppToast!: boolean;
  updatedAt!: string;

  static from(p: NotificationPreference): NotificationPreferenceResponse {
    const r = new NotificationPreferenceResponse();
    r.userId = p.userId;
    r.batchIntervalMin = p.batchIntervalMin;
    r.allowUrgentInFocus = p.allowUrgentInFocus;
    r.soundChat = p.soundChat;
    r.soundAsk = p.soundAsk;
    r.soundUrgent = p.soundUrgent;
    r.soundShare = p.soundShare;
    r.osNotification = p.osNotification;
    r.inAppToast = p.inAppToast;
    r.updatedAt = p.updatedAt.toISOString();
    return r;
  }
}
