import type {
  CreateInvitationRequest,
  CreateInvitationResponse,
  InvitationPreviewResponse,
  InvitationError,
  FriendListResponse,
  SearchUserResponse,
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

const DEMO_FRIENDS: FriendListResponse = {
  items: [
    {
      id: 1,
      peer: {
        id: 101,
        nickname: "민수",
        handle: "minsu",
        avatarUrl: null,
      },
      status: "ACCEPTED",
      acceptedAt: "2026-04-12T10:00:00.000Z",
    },
    {
      id: 2,
      peer: {
        id: 102,
        nickname: "지은",
        handle: "jieun",
        avatarUrl: null,
      },
      status: "ACCEPTED",
      acceptedAt: "2026-04-15T10:00:00.000Z",
    },
    {
      id: 3,
      peer: {
        id: 103,
        nickname: "준호",
        handle: "junho",
        avatarUrl: null,
      },
      status: "ACCEPTED",
      acceptedAt: "2026-03-21T10:00:00.000Z",
    },
    {
      id: 4,
      peer: {
        id: 104,
        nickname: "서연",
        handle: "seoyeon",
        avatarUrl: null,
      },
      status: "ACCEPTED",
      acceptedAt: "2026-04-30T10:00:00.000Z",
    },
  ],
  hasNext: false,
  nextCursor: null,
};

export async function fetchFriends(
  cursor?: string,
): Promise<FriendListResponse> {
  const url = new URL(`${API_BASE}/friendship`);
  if (cursor) url.searchParams.set("cursor", cursor);

  try {
    const res = await fetch(url.toString(), {
      headers: authHeaders(),
      signal: AbortSignal.timeout(1500),
    });

    if (!res.ok) {
      // 인증 만료 등은 데모 데이터로 폴백 (mockup 데모 모드)
      return DEMO_FRIENDS;
    }

    return res.json();
  } catch {
    return DEMO_FRIENDS;
  }
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

export async function searchUserByHandle(
  handle: string,
): Promise<SearchUserResponse> {
  const url = new URL(`${API_BASE}/users/search`);
  url.searchParams.set("handle", handle);

  const res = await fetch(url.toString(), {
    headers: authHeaders(),
  });

  if (res.status === 404) {
    throw new SearchUserError("not-found", 404);
  }

  if (!res.ok) {
    throw new SearchUserError("unknown", res.status);
  }

  return res.json();
}

export async function deleteFriendship(friendshipId: number): Promise<void> {
  const res = await fetch(`${API_BASE}/friendship/${friendshipId}`, {
    method: "DELETE",
    headers: authHeaders(),
  });

  if (!res.ok) {
    throw new Error("친구 삭제에 실패했습니다.");
  }
}

export class SearchUserError extends Error {
  constructor(
    public readonly code: "not-found" | "unknown",
    public readonly status: number,
  ) {
    super(`Search user error: ${code}`);
    this.name = "SearchUserError";
  }
}
