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
  loadRooms: () => Promise<void>;
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

  const loadRooms = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/rooms`, {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        // API returns { rooms: RoomDto[], hasNext: boolean }
        setRooms(data.rooms ?? data);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

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
    async function fetchInitialRooms() {
      setIsLoading(true);
      try {
        const res = await fetch(`${API_BASE}/rooms`, {
          headers: getAuthHeaders(),
        });
        if (res.ok && !cancelled) {
          const data = await res.json();
          setRooms(data.rooms ?? data);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    fetchInitialRooms();
    return () => {
      cancelled = true;
    };
  }, []);

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
