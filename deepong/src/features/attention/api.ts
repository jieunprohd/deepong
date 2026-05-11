import { API_BASE } from "@/lib/config";

export type ToneType = "CHAT" | "ASK" | "URGENT" | "SHARE";
export type DeliveryMethod =
  | "IMMEDIATE"
  | "BATCHED"
  | "QUEUED"
  | "IMMEDIATE_QUIET"
  | "DROPPED";
export type DeliveryStatus = "PENDING" | "DELIVERED" | "READ";

export interface NotificationResponse {
  id: number;
  userId: number;
  messageId: number;
  roomId: number | null;
  roomName: string | null;
  roomType: string | null;
  senderUserId: number | null;
  senderNickname: string | null;
  content: string | null;
  contentType: string | null;
  deliveryMethod: DeliveryMethod;
  deliveryStatus: DeliveryStatus;
  triggerTone: ToneType;
  triggerPresence: string;
  scheduledAt: string | null;
  deliveredAt: string | null;
  createdAt: string;
}

export interface NotificationListResponse {
  items: NotificationResponse[];
  hasNext: boolean;
  nextCursor: number | null;
}

/**
 * /ws-attention 채널의 'notification:new' 이벤트 페이로드.
 * 백엔드 NotificationGateway.NotificationNewPayload와 1:1 대응.
 */
export interface NotificationNewSocketPayload {
  id: number;
  userId: number;
  messageId: number;
  roomId: number | null;
  roomName: string | null;
  roomType: string | null;
  senderUserId: number | null;
  senderNickname: string | null;
  content: string | null;
  contentType: string | null;
  deliveryMethod: DeliveryMethod;
  triggerTone: ToneType;
  triggerPresence: "FREE" | "WORKING" | "FOCUS" | "OFF";
  quiet: boolean;
  scheduledAt: string | null;
  createdAt: string;
}

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem("accessToken");
  return token
    ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
    : { "Content-Type": "application/json" };
}

export async function fetchNotifications(params?: {
  limit?: number;
  unreadOnly?: boolean;
}): Promise<NotificationListResponse> {
  const url = new URL(`${API_BASE}/notifications`);
  if (params?.limit) url.searchParams.set("limit", String(params.limit));
  if (params?.unreadOnly) url.searchParams.set("unreadOnly", "true");
  const res = await fetch(url.toString(), { headers: authHeaders() });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function markNotificationRead(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/notifications/${id}/read`, {
    method: "PATCH",
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
}

export async function markAllNotificationsRead(): Promise<{ updated: number }> {
  const res = await fetch(`${API_BASE}/notifications/read-all`, {
    method: "PATCH",
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// ── Notification Preference ──

export interface NotificationPreferenceResponse {
  userId: number;
  batchIntervalMin: number;
  allowUrgentInFocus: boolean;
  soundChat: string | null;
  soundAsk: string | null;
  soundUrgent: string | null;
  soundShare: string | null;
  osNotification: boolean;
  inAppToast: boolean;
  updatedAt: string;
}

export interface UpdateNotificationPreferenceDto {
  batchIntervalMin?: number;
  allowUrgentInFocus?: boolean;
  soundChat?: string | null;
  soundAsk?: string | null;
  soundUrgent?: string | null;
  soundShare?: string | null;
  osNotification?: boolean;
  inAppToast?: boolean;
}

export async function fetchNotificationPreference(): Promise<NotificationPreferenceResponse> {
  const res = await fetch(`${API_BASE}/me/notification-preference`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function updateNotificationPreference(
  dto: UpdateNotificationPreferenceDto,
): Promise<NotificationPreferenceResponse> {
  const res = await fetch(`${API_BASE}/me/notification-preference`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(dto),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}
