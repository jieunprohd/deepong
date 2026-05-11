"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";
import { useSocket } from "@/lib/socket";
import { API_BASE } from "@/lib/config";

// ── Types ──

export interface RoomMemberDto {
  userId: string;
  nickname: string;
  avatarUrl: string | null;
}

export interface RoomDto {
  id: string;
  type: string;
  name: string | null;
  defaultTone: string;
  members: RoomMemberDto[];
  lastMessage: {
    content: string;
    tone: string;
    senderUserId: string;
    createdAt: string;
  } | null;
  lastMessageAt: string | null;
  createdAt: string;
}

export interface MessageDto {
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

// ── Context ──

interface ChatState {
  rooms: RoomDto[];
  messagesByRoom: Record<string, MessageDto[]>;
  isLoading: boolean;
  loadRooms: (signal?: AbortSignal) => Promise<void>;
  loadMessages: (roomId: string) => Promise<void>;
  sendMessage: (roomId: string, content: string, tone: string) => Promise<void>;
  editMessage: (
    roomId: string,
    messageId: string,
    content: string,
    version: number,
  ) => Promise<MessageDto | null>;
  deleteMessage: (roomId: string, messageId: string) => Promise<boolean>;
  createRoom: (
    type: "DIRECT" | "GROUP",
    memberUserIds: number[],
    name?: string,
  ) => Promise<RoomDto | null>;
}

const ChatContext = createContext<ChatState>({
  rooms: [],
  messagesByRoom: {},
  isLoading: false,
  loadRooms: async () => {},
  loadMessages: async () => {},
  sendMessage: async () => {},
  editMessage: async () => null,
  deleteMessage: async () => false,
  createRoom: async () => null,
});

export function useChat() {
  return useContext(ChatContext);
}

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem("accessToken");
  if (!token) return {};
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

// ── Provider ──

export function ChatProvider({ children }: { children: ReactNode }) {
  const { socket } = useSocket();
  const [rooms, setRooms] = useState<RoomDto[]>([]);
  const [messagesByRoom, setMessagesByRoom] = useState<
    Record<string, MessageDto[]>
  >({});
  const [isLoading, setIsLoading] = useState(false);

  const fetchRoomsList = useCallback(
    async (signal?: AbortSignal): Promise<RoomDto[]> => {
      const res = await fetch(`${API_BASE}/rooms`, {
        headers: getAuthHeaders(),
        signal,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return data.rooms ?? data;
    },
    [],
  );

  const loadRooms = useCallback(
    async (signal?: AbortSignal) => {
      setIsLoading(true);
      try {
        const items = await fetchRoomsList(signal);
        setRooms(items);
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [fetchRoomsList],
  );

  const loadMessages = useCallback(async (roomId: string) => {
    try {
      const res = await fetch(`${API_BASE}/rooms/${roomId}/messages`, {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        const messages: MessageDto[] = data.messages ?? [];
        setMessagesByRoom((prev) => ({
          ...prev,
          [roomId]: [...messages].reverse(),
        }));
      }
    } catch {
      /* silently fail */
    }
  }, []);

  const sendMessage = useCallback(
    async (roomId: string, content: string, tone: string) => {
      const clientMessageId = crypto.randomUUID();
      try {
        const res = await fetch(`${API_BASE}/rooms/${roomId}/messages`, {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify({
            clientMessageId,
            tone: tone.toUpperCase(),
            content,
          }),
        });
        if (!res.ok) console.error("Failed to send message:", res.status);
        // message:new socket event가 messagesByRoom에 추가함
      } catch (err) {
        console.error("Failed to send message:", err);
      }
    },
    [],
  );

  const editMessage = useCallback(
    async (
      roomId: string,
      messageId: string,
      content: string,
      version: number,
    ): Promise<MessageDto | null> => {
      try {
        const res = await fetch(
          `${API_BASE}/rooms/${roomId}/messages/${messageId}`,
          {
            method: "PATCH",
            headers: getAuthHeaders(),
            body: JSON.stringify({ content, version }),
          },
        );
        if (res.ok) return res.json();
      } catch (err) {
        console.error("Failed to edit message:", err);
      }
      return null;
    },
    [],
  );

  const deleteMessage = useCallback(
    async (roomId: string, messageId: string): Promise<boolean> => {
      try {
        const res = await fetch(
          `${API_BASE}/rooms/${roomId}/messages/${messageId}`,
          {
            method: "DELETE",
            headers: getAuthHeaders(),
          },
        );
        if (res.ok || res.status === 204) return true;
      } catch (err) {
        console.error("Failed to delete message:", err);
      }
      return false;
    },
    [],
  );

  const createRoom = useCallback(
    async (
      type: "DIRECT" | "GROUP",
      memberUserIds: number[],
      name?: string,
    ): Promise<RoomDto | null> => {
      try {
        const res = await fetch(`${API_BASE}/rooms`, {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify({ type, memberUserIds, name }),
        });
        if (res.ok) return res.json();
      } catch (err) {
        console.error("Failed to create room:", err);
      }
      return null;
    },
    [],
  );

  // ── Socket 이벤트 ──

  useEffect(() => {
    if (!socket) return;

    const handleMessageNew = (payload: MessageDto) => {
      setMessagesByRoom((prev) => {
        const existing = prev[payload.roomId] ?? [];
        if (existing.some((m) => m.clientMessageId === payload.clientMessageId))
          return prev;
        return { ...prev, [payload.roomId]: [...existing, payload] };
      });
      setRooms((prev) => {
        const updated = prev.map((r) =>
          r.id === payload.roomId
            ? {
                ...r,
                lastMessage: {
                  content: payload.content,
                  tone: payload.tone,
                  senderUserId: payload.senderUserId,
                  createdAt: payload.createdAt,
                },
                lastMessageAt: payload.createdAt,
              }
            : r,
        );
        return updated.sort((a, b) => {
          if (!a.lastMessageAt) return 1;
          if (!b.lastMessageAt) return -1;
          return (
            new Date(b.lastMessageAt).getTime() -
            new Date(a.lastMessageAt).getTime()
          );
        });
      });
    };

    const handleMessageUpdated = (payload: MessageDto) => {
      setMessagesByRoom((prev) => {
        const existing = prev[payload.roomId];
        if (!existing) return prev;
        return {
          ...prev,
          [payload.roomId]: existing.map((m) =>
            m.id === payload.id ? payload : m,
          ),
        };
      });
    };

    const handleMessageDeleted = (payload: {
      roomId: string;
      messageId: string;
    }) => {
      setMessagesByRoom((prev) => {
        const existing = prev[payload.roomId];
        if (!existing) return prev;
        return {
          ...prev,
          [payload.roomId]: existing.filter((m) => m.id !== payload.messageId),
        };
      });
    };

    const handleRoomCreated = (payload: RoomDto) => {
      setRooms((prev) => {
        if (prev.some((r) => r.id === payload.id)) return prev;
        return [payload, ...prev];
      });
    };

    socket.on("message:new", handleMessageNew);
    socket.on("message:updated", handleMessageUpdated);
    socket.on("message:deleted", handleMessageDeleted);
    socket.on("room:created", handleRoomCreated);

    return () => {
      socket.off("message:new", handleMessageNew);
      socket.off("message:updated", handleMessageUpdated);
      socket.off("message:deleted", handleMessageDeleted);
      socket.off("room:created", handleRoomCreated);
    };
  }, [socket]);

  // ── 초기 로드 ──

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    (async () => {
      try {
        const items = await fetchRoomsList(controller.signal);
        if (cancelled) return;
        setRooms(items);
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [fetchRoomsList]);

  const value = useMemo<ChatState>(
    () => ({
      rooms,
      messagesByRoom,
      isLoading,
      loadRooms,
      loadMessages,
      sendMessage,
      editMessage,
      deleteMessage,
      createRoom,
    }),
    [
      rooms,
      messagesByRoom,
      isLoading,
      loadRooms,
      loadMessages,
      sendMessage,
      editMessage,
      deleteMessage,
      createRoom,
    ],
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

// ── Helpers ──

export function getRoomDisplayName(room: RoomDto, myUserId?: string): string {
  if (room.name) return room.name;
  if (room.type === "DIRECT") {
    const peer = room.members.find((m) => m.userId !== myUserId);
    return peer?.nickname ?? "대화방";
  }
  return room.members.map((m) => m.nickname).join(", ");
}

export function formatRoomRelativeTime(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "방금";
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "어제";
  return `${days}일 전`;
}
