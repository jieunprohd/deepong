"use client";

import React, { useState } from "react";
import { Bell, Check, X, Inbox } from "lucide-react";
import { Avatar, AvatarColor } from "@/app/_components/Avatar";
import { Tabs } from "@/app/_components/Tabs";

export type NotificationDelivery = "immediate" | "batched" | "queued" | "quiet";

export type NotificationTone = "chat" | "ask" | "urgent" | "share";

export interface NotificationItem {
  id: string;
  /** 발신자 정보 */
  sender: {
    name: string;
    avatarUrl?: string;
    color?: AvatarColor;
  };
  /** 어느 방에서 왔는지 */
  roomName?: string;
  /** 메시지 본문 미리보기 */
  preview: string;
  /** 톤 */
  tone: NotificationTone;
  /** 전달 정책 */
  delivery: NotificationDelivery;
  /** 시간 표시 */
  time: string;
  /** 읽음 여부 */
  isRead: boolean;
}

export interface NotificationCenterProps {
  /** 알림 항목 목록 */
  notifications: NotificationItem[];
  /** 항목 클릭 콜백 */
  onSelect?: (id: string) => void;
  /** 단일 항목 닫기 */
  onDismiss?: (id: string) => void;
  /** 전체 읽음 처리 */
  onMarkAllRead?: () => void;
  /** 닫기 (drawer로 사용 시) */
  onClose?: () => void;
  className?: string;
}

const toneInfo: Record<
  NotificationTone,
  { emoji: string; label: string; color: string; bg: string }
> = {
  chat: {
    emoji: "💬",
    label: "수다",
    color: "var(--gray-700)",
    bg: "var(--gray-100)",
  },
  ask: {
    emoji: "🤔",
    label: "물어봄",
    color: "#b06b00",
    bg: "var(--warning-light)",
  },
  urgent: {
    emoji: "⚡",
    label: "급함",
    color: "var(--danger)",
    bg: "var(--danger-light)",
  },
  share: {
    emoji: "📎",
    label: "공유",
    color: "var(--info)",
    bg: "var(--info-light)",
  },
};

const deliveryInfo: Record<NotificationDelivery, string> = {
  immediate: "방금 도착",
  batched: "모아서 도착",
  queued: "대기 중이었어요",
  quiet: "조용히 도착",
};

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  notifications,
  onSelect,
  onDismiss,
  onMarkAllRead,
  onClose,
  className = "",
}) => {
  const [filter, setFilter] = useState<"all" | "unread" | NotificationTone>(
    "all",
  );

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const filtered = notifications.filter((n) => {
    if (filter === "all") return true;
    if (filter === "unread") return !n.isRead;
    return n.tone === filter;
  });

  return (
    <div
      className={`
        flex h-full flex-col bg-white
        ${className}
      `}
    >
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b border-[var(--gray-200)] px-5 pt-5 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--brand-primary-light)] text-[var(--brand-primary)]">
            <Bell size={16} strokeWidth={2.2} />
          </div>
          <div>
            <h2 className="text-[17px] font-bold tracking-tight text-[var(--gray-900)]">
              알림
            </h2>
            <p className="text-[11px] text-[var(--gray-500)]">
              {unreadCount > 0
                ? `읽지 않은 알림 ${unreadCount}개`
                : "모두 확인했어요"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {unreadCount > 0 && onMarkAllRead && (
            <button
              onClick={onMarkAllRead}
              className="
                inline-flex items-center gap-1 rounded-md px-2 py-1
                text-[11px] font-semibold text-[var(--gray-600)]
                hover:bg-[var(--gray-100)]
              "
            >
              <Check size={12} />
              모두 읽음
            </button>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="
                flex h-8 w-8 items-center justify-center rounded-md
                text-[var(--gray-400)] hover:bg-[var(--gray-100)]
                hover:text-[var(--gray-700)]
              "
              aria-label="닫기"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="shrink-0 border-b border-[var(--gray-100)] px-3 py-2">
        <Tabs
          variant="segmented"
          value={filter}
          onChange={(v) => setFilter(v as typeof filter)}
          items={[
            { value: "all", label: "전체" },
            {
              value: "unread",
              label: "안 읽음",
              trailing:
                unreadCount > 0 ? (
                  <span className="rounded-full bg-[var(--danger)] px-1.5 text-[10px] font-bold text-white">
                    {unreadCount}
                  </span>
                ) : null,
            },
            { value: "ask", label: "🤔 물어봄" },
            { value: "urgent", label: "⚡ 급함" },
          ]}
        />
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 px-8 text-center">
            <Inbox size={32} className="text-[var(--gray-300)]" />
            <p className="text-[13px] font-semibold text-[var(--gray-700)]">
              알림이 없어요
            </p>
            <p className="text-[11px] text-[var(--gray-500)]">
              새로운 알림이 도착하면 여기에 표시돼요
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-[var(--gray-100)]">
            {filtered.map((n) => {
              const info = toneInfo[n.tone];
              return (
                <li
                  key={n.id}
                  onClick={() => onSelect?.(n.id)}
                  className={`
                    group relative flex cursor-pointer gap-3 px-5 py-3
                    transition-colors hover:bg-[var(--gray-50)]
                    ${!n.isRead ? "bg-[var(--brand-primary-subtle)]" : ""}
                  `}
                >
                  {!n.isRead && (
                    <span className="absolute left-1.5 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-[var(--brand-primary)]" />
                  )}
                  <Avatar
                    name={n.sender.name}
                    color={n.sender.color ?? "blue"}
                    profile={n.sender.avatarUrl}
                    size="md"
                    hover={false}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="mb-0.5 flex items-baseline justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-1.5">
                        <span className="truncate text-[13px] font-bold text-[var(--gray-900)]">
                          {n.sender.name}
                        </span>
                        {n.roomName && (
                          <span className="truncate text-[11px] text-[var(--gray-500)]">
                            · {n.roomName}
                          </span>
                        )}
                      </div>
                      <span className="shrink-0 text-[10px] text-[var(--gray-400)]">
                        {n.time}
                      </span>
                    </div>
                    <div className="mb-1 flex items-center gap-1">
                      <span
                        className="inline-flex items-center gap-0.5 rounded px-1.5 py-px text-[10px] font-bold"
                        style={{ backgroundColor: info.bg, color: info.color }}
                      >
                        {info.emoji} {info.label}
                      </span>
                      <span className="text-[10px] text-[var(--gray-400)]">
                        · {deliveryInfo[n.delivery]}
                      </span>
                    </div>
                    <p className="line-clamp-2 text-[12px] text-[var(--gray-700)] leading-relaxed">
                      {n.preview}
                    </p>
                  </div>
                  {onDismiss && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDismiss(n.id);
                      }}
                      className="
                        flex h-7 w-7 shrink-0 items-center justify-center
                        rounded-md text-[var(--gray-300)] opacity-0
                        transition-all hover:bg-white hover:text-[var(--gray-600)]
                        group-hover:opacity-100
                      "
                      aria-label="닫기"
                    >
                      <X size={14} />
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};
