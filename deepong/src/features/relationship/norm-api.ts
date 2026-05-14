import { API_BASE } from "@/lib/config";

export type DefaultTone = "CHAT" | "ASK" | "URGENT" | "SHARE";
export type FeedPriority = "LOW" | "NORMAL" | "HIGH";

export interface CommunicationNorm {
  id: number;
  ownerUserId: number;
  friendUserId: number;
  defaultTone: DefaultTone;
  allowUrgent: boolean;
  shareReadReceipt: boolean;
  sharePresence: boolean;
  shareWorktime: boolean;
  feedPriority: FeedPriority;
  nicknameMemo: string | null;
  muted: boolean;
  isPriorityFriend: boolean;
  isMuted: boolean;
  updatedAt: string;
}

export interface UpsertNormInput {
  defaultTone?: DefaultTone;
  allowUrgent?: boolean;
  shareReadReceipt?: boolean;
  sharePresence?: boolean;
  shareWorktime?: boolean;
  feedPriority?: FeedPriority;
  nicknameMemo?: string | null;
  muted?: boolean;
}

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem("accessToken");
  return token
    ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
    : { "Content-Type": "application/json" };
}

export async function fetchMyNorms(): Promise<CommunicationNorm[]> {
  const res = await fetch(`${API_BASE}/norms`, { headers: authHeaders() });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  return data.items ?? [];
}

export async function upsertNorm(
  friendUserId: number,
  patch: UpsertNormInput,
): Promise<CommunicationNorm> {
  const res = await fetch(`${API_BASE}/norms/${friendUserId}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(patch),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export const DEFAULT_NORM_VALUES: UpsertNormInput = {
  defaultTone: "CHAT",
  allowUrgent: true,
  shareReadReceipt: true,
  sharePresence: true,
  shareWorktime: true,
  feedPriority: "NORMAL",
  nicknameMemo: null,
  muted: false,
};
