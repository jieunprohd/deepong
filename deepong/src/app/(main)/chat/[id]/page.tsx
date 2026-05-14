"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { useChat, getRoomDisplayName, type MessageDto } from "@/lib/chat";
import { Avatar } from "../../../_components/Avatar";
import EmptyState from "../../../_components/EmptyState";
import MessageComposer from "../../../_components/MessageComposer";
import { ToneType } from "../../../_components/Chip/types";
import {
  HandRaisePanel,
  HandRaiseUser,
} from "@/features/communication/HandRaisePanel";
import { RoomManageModal } from "@/features/communication/RoomManageModal";
import {
  Search,
  Info,
  MoreVertical,
  X,
  ChevronUp,
  ChevronDown,
  Pencil,
  Trash2,
  Check,
  XCircle,
} from "lucide-react";

export default function ChatDetailPage() {
  const params = useParams();
  const chatId = params.id as string;
  const { user } = useAuth();
  const {
    rooms,
    messagesByRoom,
    loadMessages,
    sendMessage,
    editMessage,
    deleteMessage,
  } = useChat();
  const [tone, setTone] = useState<ToneType>("chat");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState("");

  const [isManageOpen, setIsManageOpen] = useState(false);

  const [handRaiseState, setHandRaiseState] = useState<
    Record<string, { isRaised: boolean; raisedBy: HandRaiseUser[] }>
  >({});

  const getHandRaise = (msgId: string) =>
    handRaiseState[msgId] ?? { isRaised: false, raisedBy: [] };

  const toggleHandRaise = (msgId: string) => {
    const cur = getHandRaise(msgId);
    const me: HandRaiseUser = {
      id: "me",
      name: "나",
      color: "blue",
      raisedAt: "방금",
    };
    setHandRaiseState((prev) => ({
      ...prev,
      [msgId]: cur.isRaised
        ? {
            isRaised: false,
            raisedBy: cur.raisedBy.filter((u) => u.id !== "me"),
          }
        : { isRaised: true, raisedBy: [...cur.raisedBy, me] },
    }));
  };

  useEffect(() => {
    if (chatId) loadMessages(chatId);
  }, [chatId, loadMessages]);

  const currentRoom = rooms.find((r) => r.id === chatId);
  const messages = useMemo(
    () => messagesByRoom[chatId] ?? [],
    [messagesByRoom, chatId],
  );
  const roomDisplayName = currentRoom
    ? getRoomDisplayName(currentRoom, user?.id)
    : "";
  const isGroup = currentRoom?.type === "GROUP";

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  // ── 검색 ──
  const searchResults = useMemo(() => {
    if (!searchQuery.trim() || messages.length === 0) return [];
    return messages
      .filter((m) =>
        m.content.toLowerCase().includes(searchQuery.toLowerCase()),
      )
      .map((m) => m.id);
  }, [searchQuery, messages]);

  const closeSearch = () => {
    setIsSearching(false);
    setSearchQuery("");
    setCurrentMatchIndex(0);
  };
  const navigateSearch = (dir: "up" | "down") => {
    if (!searchResults.length) return;
    setCurrentMatchIndex((prev) =>
      dir === "up"
        ? prev > 0
          ? prev - 1
          : searchResults.length - 1
        : prev < searchResults.length - 1
          ? prev + 1
          : 0,
    );
  };

  const highlightText = (text: string, query: string, msgId: string) => {
    if (!query.trim() || !text.toLowerCase().includes(query.toLowerCase()))
      return text;
    const parts = text.split(new RegExp(`(${query})`, "gi"));
    const isCurrent = searchResults[currentMatchIndex] === msgId;
    return (
      <span>
        {parts.map((part, i) =>
          part.toLowerCase() === query.toLowerCase() ? (
            <mark
              key={i}
              className={`rounded-sm px-0.5 ${isCurrent ? "bg-[#ffeb3b] ring-2 ring-[#ffc107]" : "bg-[#fff9c4]"}`}
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

  // ── 메시지 전송 ──
  const handleSend = async (text: string) => {
    if (!chatId || !text.trim()) return;
    await sendMessage(chatId, text, tone);
  };

  // ── 메시지 수정 ──
  const startEdit = (msg: MessageDto) => {
    setEditingId(msg.id);
    setEditingContent(msg.content);
  };
  const cancelEdit = () => {
    setEditingId(null);
    setEditingContent("");
  };
  const submitEdit = async (msg: MessageDto) => {
    if (!editingContent.trim()) return;
    const updated = await editMessage(
      chatId,
      msg.id,
      editingContent,
      msg.version,
    );
    if (updated) cancelEdit();
  };

  // ── 메시지 삭제 ──
  const handleDelete = async (msgId: string) => {
    if (!confirm("메시지를 삭제할까요?")) return;
    await deleteMessage(chatId, msgId);
  };

  if (!currentRoom) {
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

  return (
    <div className="flex h-full flex-col bg-[#f9fafb]">
      {/* Header */}
      <header className="flex h-[68px] shrink-0 items-center border-b border-[#e5e8eb] bg-white px-5">
        {isSearching ? (
          <div className="flex w-full items-center gap-3 animate-in fade-in duration-200">
            <div className="relative flex-1">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#b0b8c1]"
                size={16}
              />
              <input
                autoFocus
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentMatchIndex(0);
                }}
                className="h-10 w-full rounded-xl bg-[#f2f4f6] pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-[#2f6bff]"
                placeholder="대화 내용 검색"
              />
              {searchQuery && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-[#8b95a1]">
                  {searchResults.length > 0 &&
                    `${currentMatchIndex + 1} / ${searchResults.length}`}
                </span>
              )}
            </div>
            <div className="flex gap-1 border-l pl-2">
              <button
                onClick={() => navigateSearch("up")}
                disabled={!searchResults.length}
                className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-[#f2f4f6] disabled:opacity-30"
              >
                <ChevronUp size={20} />
              </button>
              <button
                onClick={() => navigateSearch("down")}
                disabled={!searchResults.length}
                className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-[#f2f4f6] disabled:opacity-30"
              >
                <ChevronDown size={20} />
              </button>
              <button
                onClick={closeSearch}
                className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-[#f2f4f6]"
              >
                <X size={20} />
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex flex-1 items-center">
              <Avatar
                name={roomDisplayName}
                color={isGroup ? "gray" : "blue"}
                size="lg"
                subLabel={
                  isGroup ? (
                    <span className="text-[#6b7684]">
                      {currentRoom.members.length}명
                    </span>
                  ) : undefined
                }
                hover={false}
                className="p-0"
              />
            </div>
            <div className="flex gap-1">
              <button
                onClick={() => setIsSearching(true)}
                className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-[#f2f4f6]"
              >
                <Search size={20} strokeWidth={1.8} />
              </button>
              <button
                onClick={() => setIsManageOpen(true)}
                className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-[#f2f4f6]"
                title="대화방 정보"
              >
                <Info size={20} strokeWidth={1.8} />
              </button>
              <button className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-[#f2f4f6]">
                <MoreVertical size={20} strokeWidth={1.8} />
              </button>
            </div>
          </>
        )}
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <EmptyState
            variant="quiet"
            fullScreen
            title={`${roomDisplayName}님과의 첫 대화를 시작해보세요`}
          />
        ) : (
          <div className="space-y-4 p-5 pb-8">
            {messages.map((msg) => {
              const isMine = msg.senderUserId === user?.id;
              const senderMember = currentRoom.members.find(
                (m) => m.userId === msg.senderUserId,
              );
              const senderName = isMine
                ? "나"
                : (senderMember?.nickname ?? "알 수 없음");
              const msgTone = msg.tone.toLowerCase() as ToneType;
              const isEditing = editingId === msg.id;
              const showHandRaise = isGroup && msgTone === "ask" && !isMine;

              return (
                <div key={msg.id} className="space-y-2">
                  <div
                    className={`flex gap-2.5 ${isMine ? "flex-row-reverse" : ""}`}
                  >
                    {!isMine && (
                      <Avatar name={senderName} color="blue" size="sm" />
                    )}
                    <div
                      className={`group flex max-w-[70%] flex-col gap-1 ${isMine ? "items-end" : ""}`}
                    >
                      {!isMine && (
                        <span className="px-1 text-[12px] font-semibold text-[#4e5968]">
                          {senderName}
                        </span>
                      )}
                      {isEditing ? (
                        <div className="flex flex-col gap-1.5 rounded-2xl border border-[#2f6bff] bg-white p-2.5 shadow-sm">
                          <textarea
                            autoFocus
                            value={editingContent}
                            onChange={(e) => setEditingContent(e.target.value)}
                            className="min-h-[60px] w-full resize-none text-sm outline-none"
                          />
                          <div className="flex justify-end gap-1">
                            <button
                              onClick={cancelEdit}
                              className="flex h-7 w-7 items-center justify-center rounded-lg text-[#8b95a1] hover:bg-[#f2f4f6]"
                            >
                              <XCircle size={16} />
                            </button>
                            <button
                              onClick={() => submitEdit(msg)}
                              className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#2f6bff] text-white hover:bg-[#1f5aeb]"
                            >
                              <Check size={16} />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div
                          className={`relative rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed shadow-sm
                            ${isMine ? "bg-[#2f6bff] text-white rounded-tr-[4px]" : "bg-white text-[#191f28] border border-[#e5e8eb] rounded-tl-[4px]"}
                            ${msgTone === "ask" ? "border-l-[3px] border-l-[#ff9500]" : ""}
                            ${msgTone === "share" ? "bg-[#e8f2fe] text-[#1e5fc0] border-[#e8f2fe]" : ""}
                            ${isSearching && searchResults[currentMatchIndex] === msg.id ? "ring-2 ring-[#ffc107] ring-offset-2" : ""}
                          `}
                        >
                          {msgTone && msgTone !== "chat" && (
                            <div className="mb-1.5 text-[10px] font-bold uppercase tracking-wider opacity-70">
                              {msgTone === "ask"
                                ? "🤔 물어봄"
                                : msgTone === "share"
                                  ? "📎 공유"
                                  : msgTone === "urgent"
                                    ? "⚡ 급함"
                                    : "💬 수다"}
                            </div>
                          )}
                          {highlightText(msg.content, searchQuery, msg.id)}
                          {isMine && (
                            <div className="absolute right-full top-1/2 hidden -translate-y-1/2 items-center gap-1 pr-2 group-hover:flex">
                              <button
                                onClick={() => startEdit(msg)}
                                className="flex h-7 w-7 items-center justify-center rounded-lg bg-white text-[#6b7684] shadow-sm hover:bg-[#f2f4f6]"
                              >
                                <Pencil size={13} />
                              </button>
                              <button
                                onClick={() => handleDelete(msg.id)}
                                className="flex h-7 w-7 items-center justify-center rounded-lg bg-white text-[#ff4d4f] shadow-sm hover:bg-[#fff0f0]"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                      <div
                        className={`flex items-center gap-1.5 px-1 text-[10px] text-[#b0b8c1] ${isMine ? "flex-row-reverse" : ""}`}
                      >
                        <span>{formatMessageTime(msg.createdAt)}</span>
                        {msg.editedAt && <span>(수정됨)</span>}
                      </div>
                    </div>
                  </div>

                  {showHandRaise && (
                    <div className="ml-10 max-w-[480px]">
                      <HandRaisePanel
                        questionText={msg.content}
                        questionAuthor={senderName}
                        raisedBy={getHandRaise(msg.id).raisedBy}
                        isRaised={getHandRaise(msg.id).isRaised}
                        onToggle={() => toggleHandRaise(msg.id)}
                      />
                    </div>
                  )}
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <MessageComposer tone={tone} onToneChange={setTone} onSend={handleSend} />

      {isManageOpen && (
        <RoomManageModal
          isOpen
          onClose={() => setIsManageOpen(false)}
          room={currentRoom}
        />
      )}
    </div>
  );
}

// ── Helpers ──

function formatMessageTime(isoString: string): string {
  const date = new Date(isoString);
  const hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const period = hours < 12 ? "오전" : "오후";
  return `${period} ${hours % 12 || 12}:${minutes}`;
}
