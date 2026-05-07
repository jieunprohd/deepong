"use client";

import React, { useState } from "react";

export interface TabItem {
  /** 탭의 고유 키 */
  value: string;
  /** 표시 라벨 */
  label: React.ReactNode;
  /** 우측에 붙을 카운트/뱃지 */
  trailing?: React.ReactNode;
  /** 비활성화 */
  disabled?: boolean;
}

export type TabsVariant = "underline" | "segmented";

export interface TabsProps {
  /** 탭 항목 */
  items: TabItem[];
  /** 제어 모드: 현재 활성 value */
  value?: string;
  /** 비제어 모드: 초기 활성 value */
  defaultValue?: string;
  /** 변경 콜백 */
  onChange?: (value: string) => void;
  /** 스타일 변형 */
  variant?: TabsVariant;
  /** 풀폭으로 펼침 */
  fullWidth?: boolean;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({
  items,
  value,
  defaultValue,
  onChange,
  variant = "underline",
  fullWidth = false,
  className = "",
}) => {
  const [internal, setInternal] = useState(
    defaultValue ?? items[0]?.value ?? "",
  );
  const active = value ?? internal;

  const select = (v: string) => {
    if (value === undefined) setInternal(v);
    onChange?.(v);
  };

  if (variant === "segmented") {
    return (
      <div
        role="tablist"
        className={`inline-flex rounded-[var(--r-md)] bg-[var(--gray-100)] p-1 ${
          fullWidth ? "w-full" : ""
        } ${className}`}
      >
        {items.map((item) => {
          const isActive = item.value === active;
          return (
            <button
              key={item.value}
              role="tab"
              aria-selected={isActive}
              disabled={item.disabled}
              onClick={() => select(item.value)}
              className={`
                inline-flex items-center justify-center gap-1.5
                rounded-[var(--r-sm)] px-3 h-8 text-[13px] font-semibold
                transition-all
                ${fullWidth ? "flex-1" : ""}
                ${
                  isActive
                    ? "bg-white text-[var(--gray-900)] shadow-[var(--shadow-xs)]"
                    : "text-[var(--gray-600)] hover:text-[var(--gray-800)]"
                }
                disabled:opacity-40 disabled:pointer-events-none
              `}
            >
              <span>{item.label}</span>
              {item.trailing}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div
      role="tablist"
      className={`flex border-b border-[var(--gray-200)] ${
        fullWidth ? "w-full" : ""
      } ${className}`}
    >
      {items.map((item) => {
        const isActive = item.value === active;
        return (
          <button
            key={item.value}
            role="tab"
            aria-selected={isActive}
            disabled={item.disabled}
            onClick={() => select(item.value)}
            className={`
              relative inline-flex items-center justify-center gap-1.5
              h-10 px-4 text-[13px] font-semibold transition-colors
              ${fullWidth ? "flex-1" : ""}
              ${
                isActive
                  ? "text-[var(--brand-primary)]"
                  : "text-[var(--gray-500)] hover:text-[var(--gray-700)]"
              }
              disabled:opacity-40 disabled:pointer-events-none
            `}
          >
            <span>{item.label}</span>
            {item.trailing}
            {isActive && (
              <span className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-[var(--brand-primary)]" />
            )}
          </button>
        );
      })}
    </div>
  );
};
