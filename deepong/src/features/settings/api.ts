import {
  MeResponse,
  SettingsApiError,
  SettingsErrorCode,
  UpdateProfileRequest,
  UpdateProfileResponse,
  UpdateWorkspaceResponse,
  WorkspaceDto,
} from "./types";

const API_BASE = "http://localhost:4000/api/v1";

function authHeaders(): Record<string, string> {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function parseError(res: Response): Promise<SettingsApiError> {
  let code: SettingsErrorCode = "UNKNOWN";
  let message: string | undefined;

  try {
    const body = await res.json();
    if (body?.error?.code) {
      code = body.error.code as SettingsErrorCode;
    }
    message = body?.error?.message;
  } catch {
    // body 파싱 실패 시 status 기반 매핑
  }

  if (code === "UNKNOWN") {
    if (res.status === 401) code = "UNAUTHORIZED";
    else if (res.status === 422) code = "VALIDATION_FAILED";
  }

  return new SettingsApiError(code, res.status, message);
}

export async function getMe(): Promise<MeResponse> {
  const res = await fetch(`${API_BASE}/me`, { headers: authHeaders() });
  if (!res.ok) throw await parseError(res);
  return res.json();
}

export async function updateProfile(
  patch: UpdateProfileRequest,
): Promise<UpdateProfileResponse> {
  const res = await fetch(`${API_BASE}/me`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify(patch),
  });
  if (!res.ok) throw await parseError(res);
  return res.json();
}

export async function updateWorkspace(
  workspace: WorkspaceDto,
): Promise<UpdateWorkspaceResponse> {
  const res = await fetch(`${API_BASE}/me/workspace`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(workspace),
  });
  if (!res.ok) throw await parseError(res);
  return res.json();
}
