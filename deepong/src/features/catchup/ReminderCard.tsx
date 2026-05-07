"use client";

import React from "react";
import { Clock, Bell, Calendar, MoreHorizontal } from "lucide-react";

export type ReminderType = "reply" | "schedule" | "followup" | "custom";

export interface ReminderCardProps {
  /** 리마인더 종류 */
  type?: ReminderType;
  /** 제목 */
  title: string;
  /** 메모/설명 */
  description?: string;
  /** 트리거 시각 (예: "오늘 18:00", "내일 오전") */
  triggerAt: string;
  /** 관련 친구/방 이름 */
  relatedTo?: string;
  /** 완료 처리 콜백 */
  onComplete?: () => void;
  /** 미루기 콜백 */
  onSnooze?: () => void;
  /** 더보기 콜백 */
  onMore?: () => void;
  /** 완료된 항목인지 */
  isCompleted?: boolean;
  className?: string;
}

const typeInfo: Record<
  ReminderType,
  { icon: React.ReactNode; label: string; color: string; bg: string }
> = {
  reply: {
    icon: <Bell size={14} strokeWidth={2.2} />,
    label: "답장 필요",
    color: "var(--warning)",
    bg: "var(--warning-light)",
  },
  schedule: {
    icon: <Calendar size={14} strokeWidth={2.2} />,
    label: "일정",
    color: "var(--info)",
    bg: "var(--info-light)",
  },
  followup: {
    icon: <Clock size={14} strokeWidth={2.2} />,
    label: "후속",
    color: "var(--brand-primary)",
    bg: "var(--brand-primary-light)",
  },
  custom: {
    icon: <Bell size={14} strokeWidth={2.2} />,
    label: "리마인더",
    color: "var(--gray-600)",
    bg: "var(--gray-100)",
  },
};

export const ReminderCard: React.FC<ReminderCardProps> = ({
  type = "custom",
  title,
  description,
  triggerAt,
  relatedTo,
  onComplete,
  onSnooze,
  onMore,
  isCompleted = false,
  className = "",
}) => {
  const info = typeInfo[type];

  return (
    <article
      className={`
        group relative flex gap-3 rounded-[var(--r-md)] border
        bg-white p-3 transition-all
        ${
          isCompleted
            ? "border-[var(--gray-100)] opacity-60"
            : "border-[var(--gray-200)] hover:border-[var(--brand-primary)] hover:shadow-[var(--shadow-xs)]"
        }
        ${className}
      `}
    >
      {/* Checkbox */}
      <button
        type="button"
        onClick={onComplete}
        aria-label={isCompleted ? "완료 취소" : "완료 처리"}
        className={`
          mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center
          rounded-full border-2 transition-all
          ${
            isCompleted
              ? "border-[var(--brand-primary)] bg-[var(--brand-primary)] text-white"
              : "border-[var(--gray-300)] hover:border-[var(--brand-primary)]"
          }
        `}
      >
        {isCompleted && (
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path
              d="M2 5l2 2 4-4"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </button>

      {/* Body */}
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-center gap-1.5">
          <span
            className="inline-flex items-center gap-1 rounded px-1.5 py-px text-[10px] font-bold"
            style={{ backgroundColor: info.bg, color: info.color }}
          >
            {info.icon}
            {info.label}
          </span>
          {relatedTo && (
            <span className="text-[10px] text-[var(--gray-500)]">
              · {relatedTo}
            </span>
          )}
        </div>
        <h4
          className={`
            text-[13px] font-semibold
            ${isCompleted ? "line-through text-[var(--gray-500)]" : "text-[var(--gray-900)]"}
          `}
        >
          {title}
        </h4>
        {description && (
          <p className="mt-1 text-[12px] text-[var(--gray-600)] leading-relaxed">
            {description}
          </p>
        )}
        <div className="mt-2 flex items-center gap-2 text-[11px] text-[var(--gray-500)]">
          <Clock size={11} className="shrink-0" />
          {triggerAt}
        </div>
      </div>

      {/* Actions */}
      <div className="flex shrink-0 items-start gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        {onSnooze && !isCompleted && (
          <button
            onClick={onSnooze}
            className="
              flex h-7 items-center justify-center rounded-md
              px-2 text-[11px] font-semibold text-[var(--gray-600)]
              hover:bg-[var(--gray-100)]
            "
          >
            나중에
          </button>
        )}
        {onMore && (
          <button
            onClick={onMore}
            className="
              flex h-7 w-7 items-center justify-center rounded-md
              text-[var(--gray-400)] hover:bg-[var(--gray-100)]
              hover:text-[var(--gray-700)]
            "
            aria-label="더보기"
          >
            <MoreHorizontal size={14} />
          </button>
        )}
      </div>
    </article>
  );
};
