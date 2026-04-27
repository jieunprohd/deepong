export interface CreateInvitationRequest {
  singleUse: boolean;
  ttlSeconds: number;
}

export interface CreateInvitationResponse {
  token: string;
  expiresAt: string;
}

export interface InvitationPreviewResponse {
  inviter: {
    nickname: string;
    handle: string;
    avatarUrl: string | null;
  };
  expiresAt: string;
  singleUse: boolean;
}

export type InvitationError =
  | "expired"
  | "not-found"
  | "self-accept"
  | "blocked"
  | "unknown";

export const TTL_OPTIONS = [
  { label: "1시간", value: 3600 },
  { label: "6시간", value: 21600 },
  { label: "1일", value: 86400 },
  { label: "3일", value: 259200 },
  { label: "7일", value: 604800 },
] as const;
