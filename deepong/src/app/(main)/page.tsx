"use client";

import React from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { MOCK_CHATS, MOCK_FEED, MOCK_LINKS } from "./_mock";
import Chip from "../_components/Chip";
import EmptyState from "../_components/EmptyState";
import { Avatar } from "../_components/Avatar";
import { Card } from "../_components/Card";

export default function HomePage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const chatId = searchParams.get("chat");

  const selectedChat = MOCK_CHATS.find((c) => c.id === chatId);

  const filteredFeed = chatId
    ? MOCK_FEED.filter((f) => f.chatId === chatId)
    : MOCK_FEED;

  const filteredLinks = chatId
    ? MOCK_LINKS.filter((l) => l.chatId === chatId)
    : MOCK_LINKS;

  const hasConversations = MOCK_CHATS.length > 0;

  if (!hasConversations) {
    return (
      <div className="flex flex-1 items-center justify-center p-10">
        <EmptyState
          variant="connect"
          action={{ label: "초대 링크 만들기", onClick: () => {} }}
          secondaryAction={{ label: "친구 찾기", onClick: () => {} }}
        />
      </div>
    );
  }

  const isEmpty = filteredFeed.length === 0 && filteredLinks.length === 0;

  const getPresenceLabel = (presence?: string) => {
    switch (presence) {
      case "free":
        return "대화 가능";
      case "working":
        return "일하는 중";
      case "focus":
        return "집중 중";
      case "off":
        return "부재 중";
      default:
        return "";
    }
  };

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Main Header */}
      <header className="shrink-0 border-b border-[#e5e8eb] bg-white px-8 pb-[18px] pt-6">
        <div className="mb-5 flex items-end justify-between">
          <div>
            <h1 className="mb-0.5 text-[22px] font-bold tracking-tight text-[#191f28]">
              {selectedChat
                ? `${selectedChat.name}님과의 대화 정리`
                : `안녕, ${user?.nickname || "Oscar"} 👋`}
            </h1>
            <p className="text-[13px] text-[#6b7684]">
              {selectedChat
                ? `${selectedChat.name}님이 보낸 메시지 중 놓친 것들을 모았어요.`
                : "집중 중이셨네요. 그동안 놓친 것들을 정리했어요."}
            </p>
          </div>
          <Chip
            variant="status"
            presence={selectedChat?.presence || "focus"}
            statusValue={selectedChat ? undefined : "18"}
            label={
              selectedChat ? getPresenceLabel(selectedChat.presence) : undefined
            }
          />
        </div>

        {!chatId && (
          <div className="flex gap-3">
            {[
              { label: "답장 필요", value: "3", unit: "건 · 2명" },
              { label: "읽을거리", value: "7", unit: "링크" },
              { label: "편하게 볼 것", value: "14", unit: "메시지" },
            ].map((stat, i) => (
              <div key={i} className="flex-1 rounded-xl bg-[#f9fafb] p-[14px]">
                <div className="mb-1 text-[11px] font-bold uppercase tracking-wider text-[#6b7684]">
                  {stat.label}
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-[22px] font-bold tracking-tight text-[#191f28]">
                    {stat.value}
                  </span>
                  <span className="text-xs text-[#6b7684]">{stat.unit}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </header>

      {/* Feed Area */}
      <div className="flex-1 overflow-y-auto px-8 pb-10 pt-6">
        {isEmpty ? (
          <div className="flex h-full items-center justify-center">
            <EmptyState
              variant="celebrate"
              title={`${selectedChat?.name}님과는 다 따라잡았어요!`}
            />
          </div>
        ) : (
          <>
            {filteredFeed.length > 0 && (
              <>
                <div className="mb-3 flex items-center gap-2.5">
                  <h3 className="text-[12px] font-bold uppercase tracking-wider text-[#8b95a1]">
                    지금 신경 써야 할 것
                  </h3>
                  <div className="h-px flex-1 bg-[#e5e8eb]" />
                </div>
                <div className="space-y-2.5">
                  {filteredFeed.map((item) => (
                    <div
                      key={item.id}
                      className={`overflow-hidden rounded-xl border border-[#e5e8eb] bg-white transition-all hover:border-y-[#2f6bff] hover:border-r-[#2f6bff] hover:shadow-sm
                        ${
                          item.type === "ask"
                            ? "border-l-[3px] border-l-[#ff9500]"
                            : item.type === "chat"
                              ? "border-l-[3px] border-l-[#d1d6db]"
                              : item.type === "share"
                                ? "border-l-[3px] border-l-[#3182f6]"
                                : ""
                        }`}
                    >
                      <div className="flex items-center gap-3 px-4 pb-2 pt-3.5">
                        <Avatar
                          name={item.author.name}
                          color={item.author.color}
                          size="sm"
                        />
                        <div className="flex-1 text-[13px] font-bold text-[#191f28]">
                          {item.author.name}
                          <span className="ml-1 text-xs font-normal text-[#8b95a1]">
                            · {item.meta}
                          </span>
                        </div>
                        <span className="text-[11px] text-[#8b95a1]">
                          {item.time}
                        </span>
                      </div>
                      <div className="px-4 pb-3">
                        {item.messages?.map((msg, idx) => (
                          <div
                            key={idx}
                            className="flex items-start gap-1.5 border-b border-[#f2f4f6] py-1.5 last:border-b-0"
                          >
                            {msg.tone ? (
                              <Chip
                                variant="badge"
                                tone={msg.tone}
                                label={`${msg.tone === "ask" ? "🤔" : "💬"} ${msg.text}`}
                              />
                            ) : (
                              <div className="flex flex-1 items-baseline justify-between">
                                <span className="text-[13px] text-[#4e5968]">
                                  {msg.text}
                                </span>
                                {msg.time && (
                                  <span className="shrink-0 text-[11px] text-[#8b95a1]">
                                    {msg.time}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                      <div className="flex items-center gap-1.5 border-t border-[#f2f4f6] bg-[#f9fafb] p-3">
                        <button className="h-[30px] rounded-lg bg-[#2f6bff] px-3 text-xs font-bold text-white hover:bg-[#1f5aeb]">
                          대화 열기
                        </button>
                        <div className="flex-1" />
                        <button className="text-xs font-medium text-[#8b95a1] hover:text-[#4e5968]">
                          읽음 처리
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {filteredLinks.length > 0 && (
              <>
                <div
                  className={`mb-3 flex items-center gap-2.5 ${filteredFeed.length > 0 ? "mt-7" : ""}`}
                >
                  <h3 className="text-[12px] font-bold uppercase tracking-wider text-[#8b95a1]">
                    편할 때 읽어봐도 좋은 것
                  </h3>
                  <div className="h-px flex-1 bg-[#e5e8eb]" />
                </div>
                <Card
                  variant="outline"
                  padding="none"
                  className="transition-all hover:border-[#2f6bff] hover:shadow-sm"
                >
                  <div className="p-4 border-b border-[#f2f4f6]">
                    <div className="flex items-center gap-2">
                      <h4 className="text-[13px] font-bold text-[#191f28]">
                        📎 공유받은 링크
                      </h4>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 p-4">
                    {filteredLinks.map((link) => (
                      <div
                        key={link.id}
                        className="flex cursor-pointer items-center gap-2 rounded-lg bg-[#f9fafb] p-2 transition-colors hover:bg-[#f2f4f6]"
                      >
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#e5e8eb] text-[11px]">
                          {link.icon}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-[12px] font-bold text-[#191f28]">
                            {link.title}
                          </div>
                          <div className="truncate text-[11px] text-[#8b95a1]">
                            {link.author} · {link.time}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
