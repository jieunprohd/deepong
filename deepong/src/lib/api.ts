import { API_BASE } from "./config";

async function getToken(): Promise<string | null> {
  return localStorage.getItem("accessToken");
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = await getToken();
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `HTTP ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: "PATCH",
      body: body ? JSON.stringify(body) : undefined,
    }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};

// ── Rooms ──────────────────────────────────────────────────────────────────

export interface RoomMember {
  userId: string;
  nickname: string;
  avatarUrl: string | null;
}
export interface Room {
  id: string;
  type: string;
  name: string | null;
  defaultTone: string;
  members: RoomMember[];
  lastMessageAt: string | null;
  createdAt: string;
}

export const getRooms = () =>
  api.get<{ rooms: Room[]; hasNext: boolean }>("/rooms");
export const getRoom = (id: string) => api.get<Room>(`/rooms/${id}`);
export const createRoom = (body: {
  type: string;
  memberUserIds: number[];
  name?: string;
}) => api.post<Room>("/rooms", body);

// ── Messages ───────────────────────────────────────────────────────────────

export interface Message {
  id: string;
  roomId: string;
  senderUserId: string;
  clientMessageId: string;
  seq: number;
  tone: string;
  contentType: string;
  content: string;
  replyToMessageId: string | null;
  version: number;
  createdAt: string;
  editedAt: string | null;
}

export const getMessages = (roomId: string, beforeSeq?: number) =>
  api.get<{ messages: Message[]; hasNext: boolean }>(
    `/rooms/${roomId}/messages${beforeSeq ? `?beforeSeq=${beforeSeq}` : ""}`,
  );
export const sendMessage = (
  roomId: string,
  body: { clientMessageId: string; tone: string; content: string },
) => api.post<Message>(`/rooms/${roomId}/messages`, body);
export const editMessage = (
  roomId: string,
  messageId: string,
  body: { content: string; version: number },
) => api.patch<Message>(`/rooms/${roomId}/messages/${messageId}`, body);
export const deleteMessage = (roomId: string, messageId: string) =>
  api.delete<void>(`/rooms/${roomId}/messages/${messageId}`);
