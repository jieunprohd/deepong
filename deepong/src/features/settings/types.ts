export interface ProfileDto {
  id: string;
  email: string;
  nickname: string;
  handle: string;
  bio: string | null;
  avatarUrl: string | null;
  timezone: string;
  locale: string;
}

export interface WorkspaceDto {
  workDays: number[];
  workStartTime: string;
  workEndTime: string;
  lunchBreak: boolean;
  shareWorktime: boolean;
}

export interface MeResponse {
  user: ProfileDto;
  workspace: WorkspaceDto;
}

export interface UpdateProfileRequest {
  nickname?: string;
  bio?: string | null;
  avatarUrl?: string | null;
  timezone?: string;
}

export interface UpdateProfileResponse {
  user: ProfileDto;
}

export interface UpdateWorkspaceResponse {
  workspace: WorkspaceDto;
}

export type SettingsErrorCode =
  | "INVALID_NICKNAME"
  | "INVALID_TIMEZONE"
  | "VALIDATION_FAILED"
  | "UNAUTHORIZED"
  | "UNKNOWN";

export class SettingsApiError extends Error {
  constructor(
    public readonly code: SettingsErrorCode,
    public readonly status: number,
    public readonly fieldMessage?: string,
  ) {
    super(`Settings error: ${code}`);
    this.name = "SettingsApiError";
  }
}
