import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { PresenceType } from '../../domain/presence.vo';

export class UpdatePresenceDto {
  @IsEnum(['FREE', 'WORKING', 'FOCUS', 'OFF'])
  status!: PresenceType;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  statusMessage?: string;
}

export class PresenceResponse {
  status!: PresenceType;
  lastOnlineAt!: string | null;
  lastFocusStartAt!: string | null;
  updatedAt!: string;

  static from(s: {
    lastStatus: PresenceType;
    lastOnlineAt: Date | null;
    lastFocusStartAt: Date | null;
    updatedAt: Date;
  }): PresenceResponse {
    const r = new PresenceResponse();
    r.status = s.lastStatus;
    r.lastOnlineAt = s.lastOnlineAt?.toISOString() ?? null;
    r.lastFocusStartAt = s.lastFocusStartAt?.toISOString() ?? null;
    r.updatedAt = s.updatedAt.toISOString();
    return r;
  }
}
