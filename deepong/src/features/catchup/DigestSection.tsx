"use client";

import React from "react";
import { ChevronRight } from "lucide-react";

export interface DigestSectionProps {
  /** 섹션 헤더 (예: "지금 신경 써야 할 것") */
  title: string;
  /** 부가 설명 */
  description?: string;
  /** 우측 카운트/메타 */
  meta?: React.ReactNode;
  /** 우측 액션 (전체 보기 등) */
  action?: { label: string; onClick: () => void };
  /** 아이콘 (좌측) */
  icon?: React.ReactNode;
  /** 강조 색상 (좌측 막대) */
  accent?: "brand" | "warning" | "info" | "neutral";
  /** 헤더와 본문 사이 구분선 */
  divider?: boolean;
  /** 본문 콘텐츠 */
  children: React.ReactNode;
  className?: string;
}

const accentColor: Record<NonNullable<DigestSectionProps["accent"]>, string> = {
  brand: "var(--brand-primary)",
  warning: "var(--warning)",
  info: "var(--info)",
  neutral: "var(--gray-300)",
};

export const DigestSection: React.FC<DigestSectionProps> = ({
  title,
  description,
  meta,
  action,
  icon,
  accent = "neutral",
  divider = true,
  children,
  className = "",
}) => {
  return (
    <section className={`flex flex-col ${className}`}>
      {/* Header */}
      <header
        className={`mb-3 flex items-center gap-2.5 ${
          divider ? "" : "border-none"
        }`}
      >
        {icon && (
          <span className="flex h-6 w-6 shrink-0 items-center justify-center text-[var(--gray-500)]">
            {icon}
          </span>
        )}
        {!icon && (
          <span
            className="block h-3 w-1 shrink-0 rounded-full"
            style={{ backgroundColor: accentColor[accent] }}
          />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-1.5">
            <h3 className="text-[12px] font-bold uppercase tracking-wider text-[var(--gray-500)]">
              {title}
            </h3>
            {meta && (
              <span className="text-[11px] text-[var(--gray-400)]">
                · {meta}
              </span>
            )}
          </div>
          {description && (
            <p className="mt-0.5 text-[11px] text-[var(--gray-500)]">
              {description}
            </p>
          )}
        </div>
        {action && (
          <button
            onClick={action.onClick}
            className="
              inline-flex items-center gap-0.5 text-[11px] font-semibold
              text-[var(--brand-primary)] hover:underline shrink-0
            "
          >
            {action.label}
            <ChevronRight size={12} strokeWidth={2.4} />
          </button>
        )}
      </header>

      {divider && (
        <div className="mb-3 -mt-1 h-px flex-1 bg-[var(--gray-200)]" />
      )}

      {/* Body */}
      <div className="space-y-2.5">{children}</div>
    </section>
  );
};
