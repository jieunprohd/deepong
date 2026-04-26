"use client";

import React, { useState, useMemo } from "react";
import { useParams } from "next/navigation";
import { MOCK_CHATS } from "../../_mock";
import { Avatar } from "../../../_components/Avatar";
import EmptyState from "../../../_components/EmptyState";
import MessageComposer from "../../../_components/MessageComposer";
import { ToneType } from "../../../_components/Chip/types";
import {
  Search,
  Info,
  MoreVertical,
  Clock,
  X,
  ChevronUp,
  ChevronDown,
} from "lucide-react";

export default function ChatDetailPage() {
  const params = useParams();
  const chatId = params.id as string;
  const [tone, setTone] = useState<ToneType>("chat");

  // 검색 관련 상태
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);

  // 해당 ID의 채팅방 찾기
  const currentChat = MOCK_CHATS.find((c) => c.id === chatId);

  // 검색 결과 계산
  const searchResults = useMemo(() => {
    if (!searchQuery.trim() || !currentChat?.messages) return [];
    return currentChat.messages
      .filter((m) => m.text.toLowerCase().includes(searchQuery.toLowerCase()))
      .map((m) => m.id);
  }, [searchQuery, currentChat]);

  // 검색 모드 종료
  const closeSearch = () => {
    setIsSearching(false);
    setSearchQuery("");
    setCurrentMatchIndex(0);
  };

  // 다음/이전 결과 이동
  const navigateSearch = (direction: "up" | "down") => {
    if (searchResults.length === 0) return;
    if (direction === "up") {
      setCurrentMatchIndex((prev) =>
        prev > 0 ? prev - 1 : searchResults.length - 1,
      );
    } else {
      setCurrentMatchIndex((prev) =>
        prev < searchResults.length - 1 ? prev + 1 : 0,
      );
    }
  };

  // 텍스트 하이라이트 헬퍼
  const highlightText = (text: string, query: string, messageId: string) => {
    if (!query.trim() || !text.toLowerCase().includes(query.toLowerCase()))
      return text;

    const parts = text.split(new RegExp(`(${query})`, "gi"));
    const isCurrentMatch = searchResults[currentMatchIndex] === messageId;

    return (
      <span>
        {parts.map((part, i) =>
          part.toLowerCase() === query.toLowerCase() ? (
            <mark
              key={i}
              className={`rounded-sm px-0.5 transition-colors ${
                isCurrentMatch
                  ? "bg-[#ffeb3b] text-black ring-2 ring-[#ffc107]"
                  : "bg-[#fff9c4] text-black"
              }`}
            >
              {part}
            </mark>
          ) : (
            part
          ),
        )}
      </span>
    );
  };

  if (!currentChat) {
    return (
      <div className="flex h-full items-center justify-center bg-white">
        <EmptyState
          variant="no-search"
          title="대화방을 찾을 수 없어요"
          fullScreen
        />
      </div>
    );
  }

  const getStatusInfo = (presence?: string) => {
    switch (presence) {
      case "working":
        return { label: "일하는 중", color: "bg-[#ff9500]" };
      case "focus":
        return { label: "집중", color: "bg-[#3182f6]" };
      case "off":
        return { label: "오프라인", color: "bg-[#b0b8c1]" };
      case "free":
      default:
        return { label: "여유", color: "bg-[#00c471]" };
    }
  };

  const statusInfo = getStatusInfo(currentChat.presence);
  const subLabel = (
    <span className="flex items-center gap-1.5 text-[#6b7684]">
      <span className={`h-1.5 w-1.5 rounded-full ${statusInfo.color}`} />
      {statusInfo.label}
      {currentChat.presence === "working" && " · 오후 6:30까지"}
    </span>
  );

  const hasMessages = currentChat.messages && currentChat.messages.length > 0;

  return (
    <div className="flex h-full flex-col bg-[#f9fafb]">
      {/* Room Header / Search Bar */}
      <header className="flex h-[68px] shrink-0 items-center border-b border-[#e5e8eb] bg-white px-5 transition-all">
        {isSearching ? (
          <div className="flex w-full items-center gap-3 animate-in fade-in slide-in-from-top-1 duration-200">
            <div className="relative flex-1 group">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#b0b8c1] group-focus-within:text-[#2f6bff]"
                size={16}
                strokeWidth={2.5}
              />
              <input
                autoFocus
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentMatchIndex(0);
                }}
                className="h-10 w-full rounded-xl bg-[#f2f4f6] pl-10 pr-4 text-sm outline-none transition-all focus:bg-white focus:ring-2 focus:ring-[#2f6bff]"
                placeholder="대화 내용 검색"
              />
              {searchQuery && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2 text-[11px] font-bold text-[#8b95a1]">
                  <span>
                    {searchResults.length > 0 &&
                      `${currentMatchIndex + 1} / ${searchResults.length}`}
                  </span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-1 border-l border-gray-100 pl-2">
              <button
                onClick={() => navigateSearch("up")}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-[#6b7684] hover:bg-[#f2f4f6] disabled:opacity-30"
                disabled={searchResults.length === 0}
              >
                <ChevronUp size={20} />
              </button>
              <button
                onClick={() => navigateSearch("down")}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-[#6b7684] hover:bg-[#f2f4f6] disabled:opacity-30"
                disabled={searchResults.length === 0}
              >
                <ChevronDown size={20} />
              </button>
              <button
                onClick={closeSearch}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-[#6b7684] hover:bg-[#f2f4f6]"
              >
                <X size={20} />
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex flex-1 items-center">
              <Avatar
                name={currentChat.name}
                color={currentChat.color}
                presence={currentChat.presence}
                size="lg"
                subLabel={subLabel}
                hover={false}
                className="p-0"
              />
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsSearching(true)}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-[#6b7684] hover:bg-[#f2f4f6] transition-colors"
              >
                <Search size={20} strokeWidth={1.8} />
              </button>
              <button className="flex h-9 w-9 items-center justify-center rounded-lg text-[#6b7684] hover:bg-[#f2f4f6] transition-colors">
                <Info size={20} strokeWidth={1.8} />
              </button>
              <button className="flex h-9 w-9 items-center justify-center rounded-lg text-[#6b7684] hover:bg-[#f2f4f6] transition-colors">
                <MoreVertical size={20} strokeWidth={1.8} />
              </button>
            </div>
          </>
        )}
      </header>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto">
        {isSearching &&
        searchQuery.trim() !== "" &&
        searchResults.length === 0 ? (
          <EmptyState
            variant="no-search"
            fullScreen
            description="다른 단어로 검색해 보세요!"
          />
        ) : !hasMessages ? (
          <EmptyState
            variant="quiet"
            fullScreen
            title={`${currentChat.name}님과의 첫 대화를 시작해보세요`}
          />
        ) : (
          <div className="p-5 pb-8 space-y-4">
            <div className="flex items-center gap-3 my-6">
              <div className="h-px flex-1 bg-[#e5e8eb]" />
              <span className="text-[11px] font-bold text-[#8b95a1] uppercase tracking-wider">
                오늘
              </span>
              <div className="h-px flex-1 bg-[#e5e8eb]" />
            </div>

            {currentChat.messages?.map((msg) => (
              <div
                key={msg.id}
                id={`msg-${msg.id}`}
                className={`flex gap-2.5 ${msg.isMine ? "flex-row-reverse" : ""}`}
              >
                {!msg.isMine && (
                  <Avatar
                    name={currentChat.name}
                    color={currentChat.color}
                    size="sm"
                  />
                )}
                <div
                  className={`flex flex-col gap-1 max-w-[70%] ${msg.isMine ? "items-end" : ""}`}
                >
                  {!msg.isMine && (
                    <span className="px-1 text-[12px] font-semibold text-[#4e5968]">
                      {currentChat.name}
                    </span>
                  )}
                  <div
                    className={`group relative rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed shadow-sm transition-all
                    ${
                      msg.isMine
                        ? "bg-[#2f6bff] text-white rounded-tr-[4px]"
                        : "bg-white text-[#191f28] border border-[#e5e8eb] rounded-tl-[4px]"
                    }
                    ${msg.tone === "ask" ? "border-l-[3px] border-l-[#ff9500]" : ""}
                    ${msg.tone === "share" ? "bg-[#e8f2fe] text-[#1e5fc0] border-[#e8f2fe]" : ""}
                    ${isSearching && searchResults[currentMatchIndex] === msg.id ? "ring-2 ring-[#ffc107] ring-offset-2" : ""}
                  `}
                  >
                    {msg.tone && (
                      <div className="mb-1.5 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider opacity-70">
                        {msg.tone === "ask"
                          ? "🤔 물어봄"
                          : msg.tone === "share"
                            ? "📎 공유"
                            : "💬 수다"}
                      </div>
                    )}
                    {highlightText(msg.text, searchQuery, msg.id)}
                  </div>
                  <div
                    className={`flex items-center gap-1.5 px-1 text-[10px] text-[#b0b8c1] ${msg.isMine ? "flex-row-reverse" : ""}`}
                  >
                    <span>{msg.time}</span>
                    {msg.isMine && msg.isRead && (
                      <span className="font-bold text-[#2f6bff]">읽음</span>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {currentChat.presence === "working" && (
              <div className="mx-auto mt-8 flex max-w-[80%] items-center gap-2 rounded-full bg-white/60 backdrop-blur-sm border border-[#e5e8eb] px-4 py-2 text-[11px] text-[#6b7684] shadow-sm">
                <Clock size={12} className="text-[#ff9500]" />
                <span>
                  공유·수다 메시지는 {currentChat.name}님이 쉴 때 모아서 알림이
                  가요.
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Composer Area */}
      <MessageComposer
        tone={tone}
        onToneChange={setTone}
        onSend={(text) =>
          console.log(
            "Send to",
            currentChat.name,
            ":",
            text,
            "with tone:",
            tone,
          )
        }
      />
    </div>
  );
}
