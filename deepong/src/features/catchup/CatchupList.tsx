"use client";

import React from "react";
import { Avatar, AvatarColor } from "@/app/_components/Avatar";
import { ChevronRight } from "lucide-react";

export type CatchupItemType = "ask" | "chat" | "share" | "urgent";

export interface CatchupMessage {
  /** 메시지 본문 */
  text: string;
  /** 시간 (예: "어제 22:10") */
  time?: string;
  /** 톤 라벨 (있으면 위에 표시) */
  tone?: CatchupItemType;
}

export interface CatchupItem {
  id: string;
  /** 항목 타입 (좌측 강조 색) */
  type: CatchupItemType;
  /** 작성자 정보 */
  author: {
    name: string;
    avatarUrl?: string;
    color?: AvatarColor;
  };
  /** 보조 메타 (예: "수다 4건") */
  meta?: string;
  /** 시간 */
  time: string;
  /** 메시지 묶음 */
  messages: CatchupMessage[];
  /** "대화 열기" 같은 주 액션 라벨 */
  primaryActionLabel?: string;
  /** "읽음 처리" 같은 보조 액션 라벨 */
  secondaryActionLabel?: string;
}

export interface CatchupListProps {
  /** 항목 리스트 */
  items: CatchupItem[];
  /** 주 액션 콜백 */
  onPrimaryAction?: (id: string) => void;
  /** 보조 액션 콜백 */
  onSecondaryAction?: (id: string) => void;
  /** 카드 자체 클릭 콜백 */
  onSelect?: (id: string) => void;
  className?: string;
}

const typeAccent: Record<CatchupItemType, string> = {
  ask: "border-l-[var(--warning)]",
  urgent: "border-l-[var(--danger)]",
  share: "border-l-[var(--info)]",
  chat: "border-l-[var(--gray-300)]",
};

const typeLabel: Record<CatchupItemType, { emoji: string; label: string }> = {
  ask: { emoji: "🤔", label: "물어봄" },
  urgent: { emoji: "⚡", label: "급함" },
  share: { emoji: "📎", label: "공유" },
  chat: { emoji: "💬", label: "수다" },
};

export const CatchupList: React.FC<CatchupListProps> = ({
  items,
  onPrimaryAction,
  onSecondaryAction,
  onSelect,
  className = "",
}) => {
  return (
    <div className={`space-y-2.5 ${className}`}>
      {items.map((item) => {
        const tone = typeLabel[item.type];
        return (
          <article
            key={item.id}
            onClick={() => onSelect?.(item.id)}
            className={`
              overflow-hidden rounded-[var(--r-lg)] border border-[var(--gray-200)]
              bg-white border-l-[3px] ${typeAccent[item.type]}
              transition-all hover:border-y-[var(--brand-primary)]
              hover:border-r-[var(--brand-primary)] hover:shadow-[var(--shadow-xs)]
              ${onSelect ? "cursor-pointer" : ""}
            `}
          >
            {/* Author row */}
            <header className="flex items-center gap-3 px-4 pt-3.5 pb-2">
              <Avatar
                name={item.author.name}
                color={item.author.color ?? "blue"}
                profile={item.author.avatarUrl}
                size="sm"
                hover={false}
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-1">
                  <span className="truncate text-[13px] font-bold text-[var(--gray-900)]">
                    {item.author.name}
                  </span>
                  {item.meta && (
                    <span className="text-[11px] font-normal text-[var(--gray-500)]">
                      · {item.meta}
                    </span>
                  )}
                </div>
              </div>
              <span className="shrink-0 text-[11px] text-[var(--gray-500)]">
                {item.time}
              </span>
            </header>

            {/* Messages */}
            <div className="px-4 pb-3">
              {item.messages.map((msg, idx) => (
                <div
                  key={idx}
                  className="
                    flex items-start gap-1.5 border-b border-[var(--gray-100)]
                    py-1.5 last:border-b-0
                  "
                >
                  {msg.tone ? (
                    <span
                      className="
                        inline-flex items-center gap-0.5 rounded px-1.5 py-px
                        text-[10px] font-bold
                      "
                      style={{
                        backgroundColor:
                          msg.tone === "ask"
                            ? "var(--warning-light)"
                            : msg.tone === "urgent"
                              ? "var(--danger-light)"
                              : msg.tone === "share"
                                ? "var(--info-light)"
                                : "var(--gray-100)",
                        color:
                          msg.tone === "ask"
                            ? "#b06b00"
                            : msg.tone === "urgent"
                              ? "var(--danger)"
                              : msg.tone === "share"
                                ? "var(--info)"
                                : "var(--gray-700)",
                      }}
                    >
                      {typeLabel[msg.tone].emoji} {msg.text}
                    </span>
                  ) : (
                    <div className="flex flex-1 items-baseline justify-between gap-2">
                      <span className="text-[13px] text-[var(--gray-700)] leading-relaxed">
                        {msg.text}
                      </span>
                      {msg.time && (
                        <span className="shrink-0 text-[11px] text-[var(--gray-500)]">
                          {msg.time}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Footer / Actions */}
            {(onPrimaryAction || onSecondaryAction) && (
              <footer
                className="
                  flex items-center gap-2 border-t border-[var(--gray-100)]
                  bg-[var(--gray-50)] px-3 py-2
                "
              >
                {onPrimaryAction && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onPrimaryAction(item.id);
                    }}
                    className="
                      inline-flex h-7 items-center gap-0.5 rounded-md
                      bg-[var(--brand-primary)] px-2.5 text-[11px] font-bold
                      text-white hover:bg-[var(--brand-primary-hover)]
                    "
                  >
                    {item.primaryActionLabel ?? "대화 열기"}
                    <ChevronRight size={11} strokeWidth={2.6} />
                  </button>
                )}
                <span className="ml-auto inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[var(--gray-400)]">
                  {tone.emoji} {tone.label}
                </span>
                {onSecondaryAction && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSecondaryAction(item.id);
                    }}
                    className="
                      text-[11px] font-medium text-[var(--gray-500)]
                      hover:text-[var(--gray-700)]
                    "
                  >
                    {item.secondaryActionLabel ?? "읽음 처리"}
                  </button>
                )}
              </footer>
            )}
          </article>
        );
      })}
    </div>
  );
};
