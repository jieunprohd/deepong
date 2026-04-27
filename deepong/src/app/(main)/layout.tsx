"use client";

import React, { useEffect } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { MOCK_CHATS, ChatItem } from "./_mock";
import { Home, MessageSquare, Users, Search, Settings } from "lucide-react";
import Chip from "../_components/Chip";
import { Avatar } from "../_components/Avatar";
import { useSearch } from "@/hooks/useSearch";
import { useResizable } from "@/hooks/useResizable";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  // URL 경로에서 /chat/123 형태의 ID 추출
  const selectedId = pathname.startsWith("/chat/")
    ? pathname.split("/").pop()
    : null;

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

  const { query, setQuery, filteredItems, hasResults } = useSearch<ChatItem>({
    items: MOCK_CHATS,
    filterFn: (chat, q) =>
      chat.name.toLowerCase().includes(q) ||
      (chat.lastMessage?.toLowerCase().includes(q) ?? false),
  });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/auth");
    }
  }, [isLoading, isAuthenticated, router]);

  const handleChatClick = (id: string) => {
    router.push(`/chat/${id}`);
  };

  const handleNavClick = (path: string) => {
    router.push(path);
  };

  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand border-t-transparent" />
          <p className="text-sm text-gray-400 font-medium">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-white">
      <div className="flex h-full w-full overflow-hidden">
        {/* Sidebar */}
        <aside className="flex w-[72px] flex-col items-center border-r border-[#e5e8eb] bg-[#f9fafb] py-5 shrink-0">
          <div className="flex flex-col gap-2">
            <nav className="flex flex-col gap-2">
              <button
                onClick={() => handleNavClick("/")}
                className={`relative flex h-11 w-11 items-center justify-center rounded-xl transition-all ${pathname === "/" ? "bg-[#eaf0ff] text-[#2f6bff]" : "text-[#8b95a1] hover:bg-[#f2f4f6]"}`}
              >
                <Home size={22} strokeWidth={1.8} />
              </button>
              <button
                onClick={() => handleNavClick("/chat")}
                className={`relative flex h-11 w-11 items-center justify-center rounded-xl transition-all ${pathname.startsWith("/chat") ? "bg-[#eaf0ff] text-[#2f6bff]" : "text-[#8b95a1] hover:bg-[#f2f4f6]"}`}
              >
                <MessageSquare size={22} strokeWidth={1.8} />
                <div className="absolute right-1.5 top-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#f04452] px-1 text-[10px] font-bold text-white">
                  5
                </div>
              </button>
              <button
                onClick={() => handleNavClick("/friends")}
                className={`relative flex h-11 w-11 items-center justify-center rounded-xl transition-all ${pathname.startsWith("/friends") ? "bg-[#eaf0ff] text-[#2f6bff]" : "text-[#8b95a1] hover:bg-[#f2f4f6]"}`}
              >
                <Users size={22} strokeWidth={1.8} />
              </button>
              <button className="flex h-11 w-11 items-center justify-center rounded-xl text-[#8b95a1] transition-all hover:bg-[#f2f4f6] hover:text-[#333d4b]">
                <Search size={22} strokeWidth={1.8} />
              </button>
            </nav>
          </div>
          <div className="mt-auto flex flex-col items-center gap-2">
            <button className="flex h-11 w-11 items-center justify-center rounded-xl text-[#8b95a1] transition-all hover:bg-[#f2f4f6] hover:text-[#333d4b]">
              <Settings size={22} strokeWidth={1.8} />
            </button>
            <Avatar
              name={user?.nickname || "O"}
              size="lg"
              presence="focus"
              className="cursor-pointer"
              color="blue"
            />
          </div>
        </aside>

        {/* Chat List */}
        <section
          style={{ width: chatListWidth }}
          className="flex flex-col border-r border-[#e5e8eb] bg-white shrink-0 relative"
        >
          <div className="px-[18px] pb-3 pt-5 shrink-0">
            <h2 className="mb-3 text-lg font-bold tracking-tight text-[#191f28]">
              대화
            </h2>
            <div className="relative group">
              <Search
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#b0b8c1] group-focus-within:text-[#2f6bff]"
                size={14}
                strokeWidth={2}
              />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="h-9 w-full rounded-lg bg-[#f2f4f6] pl-8.5 pr-3 text-[13px] outline-none transition-all focus:ring-2 focus:ring-[#2f6bff] focus:bg-white"
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
            <Chip variant="filter" label="놓친 것" />
            <Chip variant="filter" label="그룹" />
          </div>

          <div className="flex-1 overflow-y-auto px-2">
            {!hasResults ? (
              <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                <p className="text-sm font-semibold text-[#191f28]">
                  검색 결과가 없음
                </p>
                <p className="mt-1 text-xs text-[#8b95a1]">
                  다른 검색어를 입력해보세요
                </p>
              </div>
            ) : (
              filteredItems.map((chat) => (
                <Avatar
                  key={chat.id}
                  name={chat.name}
                  color={chat.color}
                  presence={chat.presence}
                  time={chat.time}
                  lastMessage={chat.lastMessage}
                  isActive={selectedId === chat.id}
                  onClick={() => handleChatClick(chat.id)}
                  subLabel={
                    <div className="flex items-center gap-1">
                      {chat.unreadCounts?.ask ? (
                        <Chip
                          variant="badge"
                          tone="ask"
                          label={`🤔 ${chat.unreadCounts.ask}`}
                        />
                      ) : null}
                      {chat.unreadCounts?.chat ? (
                        <Chip
                          variant="badge"
                          label={`💬 ${chat.unreadCounts.chat}`}
                        />
                      ) : null}
                      {chat.unreadCounts?.share ? (
                        <Chip
                          variant="badge"
                          label={`📎 ${chat.unreadCounts.share}`}
                        />
                      ) : null}
                      {chat.unreadCounts?.urgent ? (
                        <Chip
                          variant="badge"
                          tone="urgent"
                          label={`⚡ ${chat.unreadCounts.urgent}`}
                        />
                      ) : null}
                    </div>
                  }
                />
              ))
            )}
          </div>

          <div
            onMouseDown={startResizing}
            className="absolute top-0 right-[-3px] bottom-0 w-[6px] cursor-col-resize z-10 group"
          >
            <div
              className={`mx-auto h-full w-[2px] transition-colors group-hover:bg-[#2f6bff]/30 ${isResizing ? "bg-[#2f6bff]/50" : ""}`}
            />
          </div>
        </section>

        {/* Content Area */}
        <main className="flex flex-1 flex-col bg-[#f9fafb] overflow-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
