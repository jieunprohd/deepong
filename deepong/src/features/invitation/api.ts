import type {
  CreateInvitationRequest,
  CreateInvitationResponse,
  InvitationPreviewResponse,
  InvitationError,
  FriendListResponse,
} from "./types";

const API_BASE = "http://localhost:4000/api/v1";

function getToken(): string | null {
  return localStorage.getItem("accessToken");
}

function authHeaders(): Record<string, string> {
  return {
    Authorization: `Bearer ${getToken()}`,
  };
}

export async function createInvitation(
  req: CreateInvitationRequest,
): Promise<CreateInvitationResponse> {
  const res = await fetch(`${API_BASE}/invitations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
    body: JSON.stringify({
      singleUse: req.singleUse,
      ttlHours: Math.max(1, Math.round(req.ttlSeconds / 3600)),
    }),
  });

  if (!res.ok) {
    throw new Error("초대 링크 생성에 실패했습니다.");
  }

  const data = await res.json();
  return {
    token: data.invitation.token,
    inviteUrl: data.invitation.inviteUrl,
    expiresAt: data.invitation.expiresAt,
  };
}

export async function previewInvitation(
  token: string,
): Promise<InvitationPreviewResponse> {
  const res = await fetch(`${API_BASE}/invitations/${token}`, {
    headers: authHeaders(),
  });

  if (!res.ok) {
    throw new InvitationApiError(mapError(res.status), res.status);
  }

  const data = await res.json();
  return {
    inviter: {
      nickname: data.invitation.issuer.nickname,
      handle: data.invitation.issuer.handle,
      avatarUrl: data.invitation.issuer.avatarUrl,
    },
    expiresAt: data.expiresAt,
  };
}

export async function acceptInvitation(token: string): Promise<void> {
  const res = await fetch(`${API_BASE}/invitations/${token}/accept`, {
    method: "POST",
    headers: authHeaders(),
  });

  if (!res.ok) {
    throw new InvitationApiError(mapError(res.status), res.status);
  }
}

export async function fetchFriends(
  cursor?: string,
): Promise<FriendListResponse> {
  const url = new URL(`${API_BASE}/friendship`);
  if (cursor) url.searchParams.set("cursor", cursor);

  const res = await fetch(url.toString(), {
    headers: authHeaders(),
  });

  if (!res.ok) {
    throw new Error("친구 목록을 불러오는데 실패했습니다.");
  }

  return res.json();
}

function mapError(status: number): InvitationError {
  switch (status) {
    case 400:
      return "self-accept";
    case 403:
      return "blocked";
    case 404:
      return "not-found";
    case 410:
      return "expired";
    default:
      return "unknown";
  }
}

export class InvitationApiError extends Error {
  constructor(
    public readonly code: InvitationError,
    public readonly status: number,
  ) {
    super(`Invitation error: ${code}`);
    this.name = "InvitationApiError";
  }
}
