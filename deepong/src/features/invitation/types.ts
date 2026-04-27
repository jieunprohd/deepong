export interface CreateInvitationRequest {
  singleUse: boolean;
  ttlSeconds: number;
}

export interface CreateInvitationResponse {
  token: string;
  inviteUrl: string;
  expiresAt: string;
}

export interface InvitationPreviewResponse {
  inviter: {
    nickname: string;
    handle: string;
    avatarUrl: string | null;
  };
  expiresAt: string;
}

export interface FriendItem {
  id: number;
  peer: {
    id: number;
    nickname: string;
    handle: string;
    avatarUrl: string | null;
  };
  status: string;
  acceptedAt: string;
}

export interface FriendListResponse {
  items: FriendItem[];
  hasNext: boolean;
  nextCursor: string | null;
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
