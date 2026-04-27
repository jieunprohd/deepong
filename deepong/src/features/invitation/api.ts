import type {
  CreateInvitationRequest,
  CreateInvitationResponse,
  InvitationPreviewResponse,
  InvitationError,
} from "./types";

const API_BASE = "http://localhost:4000/api/v1";

function getToken(): string | null {
  return localStorage.getItem("accessToken");
}

export async function createInvitation(
  req: CreateInvitationRequest,
): Promise<CreateInvitationResponse> {
  const res = await fetch(`${API_BASE}/invitations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify(req),
  });

  if (!res.ok) {
    throw new Error("초대 링크 생성에 실패했습니다.");
  }

  return res.json();
}

export async function previewInvitation(
  token: string,
): Promise<InvitationPreviewResponse> {
  const res = await fetch(`${API_BASE}/invitations/${token}`, {
    headers: {
      Authorization: `Bearer ${getToken()}`,
    },
  });

  if (!res.ok) {
    const error = mapError(res.status);
    throw new InvitationApiError(error, res.status);
  }

  return res.json();
}

export async function acceptInvitation(
  token: string,
): Promise<void> {
  const res = await fetch(`${API_BASE}/invitations/${token}/accept`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getToken()}`,
    },
  });

  if (!res.ok) {
    const error = mapError(res.status);
    throw new InvitationApiError(error, res.status);
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
