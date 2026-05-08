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

const DEMO_ME: MeResponse = {
  user: {
    id: "demo-user",
    email: "demo@deepong.dev",
    nickname: "Oscar",
    handle: "oscar",
    bio: "디퐁 데모 계정",
    avatarUrl: null,
    timezone: "Asia/Seoul",
    locale: "ko-KR",
  },
  workspace: {
    workDays: [1, 2, 3, 4, 5],
    workStartTime: "10:00",
    workEndTime: "18:30",
    lunchBreak: true,
    shareWorktime: true,
  },
};

export async function getMe(): Promise<MeResponse> {
  try {
    const res = await fetch(`${API_BASE}/me`, {
      headers: authHeaders(),
      signal: AbortSignal.timeout(1500),
    });
    if (!res.ok) {
      return DEMO_ME;
    }
    return res.json();
  } catch {
    return DEMO_ME;
  }
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
