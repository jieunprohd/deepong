"use client";

import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { SocketProvider } from "@/lib/socket";
import { ChatProvider, useChat, type RoomDto } from "@/lib/chat";
import { MOCK_NOTIFICATIONS } from "./_mock";
import {
  Home,
  MessageSquare,
  Users,
  Settings,
  Bell,
  Brain,
  Search,
  Plus,
} from "lucide-react";
import Chip from "../_components/Chip";
import { Avatar } from "../_components/Avatar";
import { useSearch } from "@/hooks/useSearch";
import { useResizable } from "@/hooks/useResizable";
import {
  NotificationCenter,
  NotificationItem,
} from "@/features/attention/NotificationCenter";
import {
  PresenceSelector,
  Presence,
} from "@/features/attention/PresenceSelector";

function MainLayoutInner({ children }: { children: React.ReactNode }) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const { rooms } = useChat();
  const router = useRouter();
  const pathname = usePathname();
  const selectedId = pathname.startsWith("/chat/")
    ? pathname.split("/").pop()
    : null;

  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifications, setNotifications] =
    useState<NotificationItem[]>(MOCK_NOTIFICATIONS);
  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const [presence, setPresence] = useState<Presence>("focus");
  const [statusMessage, setStatusMessage] =
    useState<string>("집중 중 — 오후 4:00까지");

  const {
    width: chatListWidth,
    isResizing,
    startResizing,
  } = useResizable({
    initialWidth: 300,
    minWidth: 200,
    maxWidth: 450,
    storageKey: "deepong-chatlist-width",
  });

  const searchItems = rooms.map((room) => ({
    ...room,
    displayName: getRoomDisplayName(room, user?.id),
    lastMessageText: room.lastMessage?.content ?? "",
  }));

  const { query, setQuery, filteredItems, hasResults } = useSearch({
    items: searchItems,
    filterFn: (item, q) =>
      item.displayName.toLowerCase().includes(q) ||
      item.lastMessageText.toLowerCase().includes(q),
  });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.replace("/auth");
  }, [isLoading, isAuthenticated, router]);

  const handleNotifSelect = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
    );
    setIsNotifOpen(false);
  };
  const handleNotifDismiss = (id: string) =>
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  const handleMarkAllRead = () =>
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));

  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand border-t-transparent" />
          <p className="text-sm font-medium text-gray-400">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-white">
      <div className="flex h-full w-full overflow-hidden">
        {/* Sidebar */}
        <aside className="flex w-[72px] flex-col items-center border-r border-[#e5e8eb] bg-[#f9fafb] py-5 shrink-0">
          <nav className="flex flex-col gap-2">
            <button
              onClick={() => router.push("/")}
              className={`relative flex h-11 w-11 items-center justify-center rounded-xl transition-all ${pathname === "/" ? "bg-[#eaf0ff] text-[#2f6bff]" : "text-[#8b95a1] hover:bg-[#f2f4f6]"}`}
            >
              <Home size={22} strokeWidth={1.8} />
            </button>
            <button
              onClick={() => router.push("/chat")}
              className={`relative flex h-11 w-11 items-center justify-center rounded-xl transition-all ${pathname.startsWith("/chat") ? "bg-[#eaf0ff] text-[#2f6bff]" : "text-[#8b95a1] hover:bg-[#f2f4f6]"}`}
            >
              <MessageSquare size={22} strokeWidth={1.8} />
            </button>
            <button
              onClick={() => router.push("/friends")}
              className={`relative flex h-11 w-11 items-center justify-center rounded-xl transition-all ${pathname.startsWith("/friends") ? "bg-[#eaf0ff] text-[#2f6bff]" : "text-[#8b95a1] hover:bg-[#f2f4f6]"}`}
            >
              <Users size={22} strokeWidth={1.8} />
            </button>
            <button
              onClick={() => router.push("/focus")}
              className={`relative flex h-11 w-11 items-center justify-center rounded-xl transition-all ${pathname.startsWith("/focus") ? "bg-[#eaf0ff] text-[#2f6bff]" : "text-[#8b95a1] hover:bg-[#f2f4f6]"}`}
              aria-label="집중 모드"
            >
              <Brain size={22} strokeWidth={1.8} />
            </button>
            <button
              onClick={() => setIsNotifOpen((v) => !v)}
              className={`relative flex h-11 w-11 items-center justify-center rounded-xl transition-all ${isNotifOpen ? "bg-[#eaf0ff] text-[#2f6bff]" : "text-[#8b95a1] hover:bg-[#f2f4f6]"}`}
              aria-label="알림"
            >
              <Bell size={22} strokeWidth={1.8} />
              {unreadCount > 0 && (
                <div className="absolute right-1.5 top-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#f04452] px-1 text-[10px] font-bold text-white">
                  {unreadCount}
                </div>
              )}
            </button>
          </nav>
          <div className="mt-auto flex flex-col items-center gap-3">
            <button
              onClick={() => router.push("/settings")}
              className={`flex h-11 w-11 items-center justify-center rounded-xl transition-all ${pathname.startsWith("/settings") ? "bg-[#eaf0ff] text-[#2f6bff]" : "text-[#8b95a1] hover:bg-[#f2f4f6]"}`}
            >
              <Settings size={22} strokeWidth={1.8} />
            </button>
            <div className="relative">
              <Avatar
                name={user?.nickname || "O"}
                profile={user?.avatarUrl ?? undefined}
                size="lg"
                presence={presence}
                color="blue"
                hover={false}
              />
              <div className="absolute -right-1 -bottom-1">
                <PresenceSelector
                  compact
                  value={presence}
                  onChange={setPresence}
                  statusMessage={statusMessage}
                  onStatusMessageChange={setStatusMessage}
                />
              </div>
            </div>
          </div>
        </aside>

        {/* Chat List */}
        <section
          style={{ width: chatListWidth }}
          className="relative flex flex-col border-r border-[#e5e8eb] bg-white shrink-0"
        >
          <div className="px-[18px] pb-3 pt-5 shrink-0">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-bold tracking-tight text-[#191f28]">
                대화
              </h2>
              <button
                onClick={() => router.push("/friends")}
                title="새 대화 시작 (친구 목록에서)"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-[#8b95a1] hover:bg-[#f2f4f6] hover:text-[#2f6bff] transition-colors"
              >
                <Plus size={18} strokeWidth={2} />
              </button>
            </div>
            <div className="relative">
              <Search
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#b0b8c1]"
                size={14}
                strokeWidth={2}
              />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="h-9 w-full rounded-lg bg-[#f2f4f6] pl-8.5 pr-3 text-[13px] outline-none focus:ring-2 focus:ring-[#2f6bff] focus:bg-white transition-all"
                placeholder="이름, 메시지 검색"
              />
            </div>
          </div>

          <div className="flex gap-1 px-[18px] pb-3 shrink-0">
            <Chip
              variant="filter"
              label="전체"
              active={!selectedId}
              onClick={() => router.push(pathname)}
            />
            <Chip variant="filter" label="그룹" />
          </div>

          <div className="flex-1 overflow-y-auto px-2">
            {!hasResults ? (
              <div className="flex flex-col items-center justify-center px-4 py-10 text-center">
                <p className="text-sm font-semibold text-[#191f28]">
                  검색 결과가 없음
                </p>
                <p className="mt-1 text-xs text-[#8b95a1]">
                  다른 검색어를 입력해보세요
                </p>
              </div>
            ) : rooms.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-4 py-10 text-center">
                <p className="text-sm font-semibold text-[#191f28]">
                  아직 대화가 없어요
                </p>
                <p className="mt-1 text-xs text-[#8b95a1]">
                  친구 목록에서 대화를 시작해보세요
                </p>
              </div>
            ) : (
              filteredItems.map((item) => (
                <Avatar
                  key={item.id}
                  name={item.displayName}
                  color={item.type === "GROUP" ? "gray" : "blue"}
                  time={
                    item.lastMessageAt
                      ? formatRelativeTime(item.lastMessageAt)
                      : ""
                  }
                  lastMessage={item.lastMessage?.content}
                  isActive={selectedId === item.id}
                  onClick={() => router.push(`/chat/${item.id}`)}
                />
              ))
            )}
          </div>

          <div
            onMouseDown={startResizing}
            className="absolute bottom-0 right-[-3px] top-0 z-10 w-[6px] cursor-col-resize group"
          >
            <div
              className={`mx-auto h-full w-[2px] transition-colors group-hover:bg-[#2f6bff]/30 ${isResizing ? "bg-[#2f6bff]/50" : ""}`}
            />
          </div>
        </section>

        <main className="flex flex-1 flex-col overflow-hidden bg-[#f9fafb]">
          {children}
        </main>
      </div>

      {isNotifOpen && (
        <>
          <div
            className="fixed inset-0 z-30 bg-black/10 animate-in fade-in duration-150"
            onClick={() => setIsNotifOpen(false)}
            aria-hidden
          />
          <aside
            className="fixed left-[72px] top-0 z-40 flex h-screen w-[380px] flex-col border-r border-[#e5e8eb] bg-white shadow-[var(--shadow-xl)] animate-in slide-in-from-left-2 duration-200"
            role="dialog"
            aria-label="알림"
          >
            <NotificationCenter
              notifications={notifications}
              onSelect={handleNotifSelect}
              onDismiss={handleNotifDismiss}
              onMarkAllRead={handleMarkAllRead}
              onClose={() => setIsNotifOpen(false)}
            />
          </aside>
        </>
      )}
    </div>
  );
}

// ── Helpers ──

function getRoomDisplayName(room: RoomDto, myUserId?: string): string {
  if (room.name) return room.name;
  if (room.type === "DIRECT") {
    const peer = room.members.find((m) => m.userId !== myUserId);
    return peer?.nickname ?? "대화방";
  }
  return room.members.map((m) => m.nickname).join(", ");
}

function formatRelativeTime(isoString: string): string {
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

// ── Main Export ──

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SocketProvider>
      <ChatProvider>
        <MainLayoutInner>{children}</MainLayoutInner>
      </ChatProvider>
    </SocketProvider>
  );
}
