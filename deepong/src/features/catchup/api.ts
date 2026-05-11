import { API_BASE } from "@/lib/config";

export type ToneType = "CHAT" | "ASK" | "URGENT" | "SHARE";
export type DeliveryMethod =
  | "IMMEDIATE"
  | "BATCHED"
  | "QUEUED"
  | "IMMEDIATE_QUIET"
  | "DROPPED";

export interface CatchupFeedItem {
  notificationId: number;
  messageId: number;
  roomId: number | null;
  senderUserId: number | null;
  senderNickname: string | null;
  content: string | null;
  contentType: string | null;
  tone: ToneType;
  deliveryMethod: DeliveryMethod;
  scheduledAt: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface CatchupFeedResponse {
  items: CatchupFeedItem[];
  hasNext: boolean;
  nextCursor: number | null;
  stats: { needsReply: number; sharedLinks: number; casual: number };
}

export type FeedAction =
  | "REPLY_NOW"
  | "LATER"
  | "MARK_READ"
  | "DISMISS"
  | "OPEN_CHAT";

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem("accessToken");
  return token
    ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
    : { "Content-Type": "application/json" };
}

export async function fetchCatchupFeed(params?: {
  limit?: number;
  tone?: ToneType;
}): Promise<CatchupFeedResponse> {
  const url = new URL(`${API_BASE}/catchup/feed`);
  if (params?.limit) url.searchParams.set("limit", String(params.limit));
  if (params?.tone) url.searchParams.set("tone", params.tone);
  const res = await fetch(url.toString(), { headers: authHeaders() });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function recordCatchupAction(
  messageId: number,
  action: FeedAction,
): Promise<void> {
  const res = await fetch(`${API_BASE}/catchup/actions`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ messageId, action }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
}
