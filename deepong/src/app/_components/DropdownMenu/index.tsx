"use client";

import React, { useEffect, useRef, useState } from "react";

export interface DropdownItem {
  /** 항목 식별자 */
  id: string;
  /** 표시할 라벨 */
  label: React.ReactNode;
  /** 좌측 아이콘 */
  icon?: React.ReactNode;
  /** 우측 단축키/뱃지 */
  trailing?: React.ReactNode;
  /** 위험 액션 (빨강) */
  danger?: boolean;
  /** 비활성화 */
  disabled?: boolean;
  /** 선택 시 콜백 */
  onSelect?: () => void;
}

export interface DropdownSection {
  /** 섹션 헤더 (선택) */
  heading?: string;
  /** 항목들 */
  items: DropdownItem[];
}

export type DropdownAlign = "start" | "end";

export interface DropdownMenuProps {
  /** 트리거 (버튼 등). 클릭하면 메뉴 토글 */
  trigger: React.ReactElement;
  /** 단순 항목 리스트 */
  items?: DropdownItem[];
  /** 섹션 분리 */
  sections?: DropdownSection[];
  /** 메뉴 정렬 (기본 start = 트리거 기준 좌측 정렬) */
  align?: DropdownAlign;
  /** 메뉴 너비 (기본 auto) */
  width?: number | string;
  /** 외부 클릭 시 닫힘 (기본 true) */
  closeOnSelect?: boolean;
  className?: string;
}

export const DropdownMenu: React.FC<DropdownMenuProps> = ({
  trigger,
  items,
  sections,
  align = "start",
  width,
  closeOnSelect = true,
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const onClick = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, [isOpen]);

  const handleSelect = (item: DropdownItem) => {
    if (item.disabled) return;
    item.onSelect?.();
    if (closeOnSelect) setIsOpen(false);
  };

  const allSections: DropdownSection[] = sections ?? (items ? [{ items }] : []);

  const renderItem = (item: DropdownItem) => (
    <button
      key={item.id}
      type="button"
      disabled={item.disabled}
      onClick={() => handleSelect(item)}
      className={`
        flex w-full items-center gap-2 px-3 h-9 rounded-[var(--r-sm)]
        text-[13px] font-medium text-left transition-colors
        ${
          item.danger
            ? "text-[var(--danger)] hover:bg-[var(--danger-light)]"
            : "text-[var(--gray-800)] hover:bg-[var(--gray-100)]"
        }
        disabled:opacity-40 disabled:pointer-events-none
      `}
    >
      {item.icon && (
        <span className="flex h-4 w-4 items-center justify-center text-current shrink-0">
          {item.icon}
        </span>
      )}
      <span className="flex-1 truncate">{item.label}</span>
      {item.trailing && (
        <span className="text-[11px] text-[var(--gray-400)] shrink-0">
          {item.trailing}
        </span>
      )}
    </button>
  );

  return (
    <div ref={containerRef} className={`relative inline-flex ${className}`}>
      {React.cloneElement(
        trigger as React.ReactElement<{ onClick?: () => void }>,
        { onClick: () => setIsOpen((v) => !v) },
      )}
      {isOpen && (
        <div
          role="menu"
          style={{ width }}
          className={`
            absolute top-full mt-1.5 z-40 min-w-[180px]
            rounded-[var(--r-md)] border border-[var(--gray-200)]
            bg-white shadow-[var(--shadow-lg)] p-1
            animate-in fade-in slide-in-from-top-1 duration-150
            ${align === "end" ? "right-0" : "left-0"}
          `}
        >
          {allSections.map((section, i) => (
            <div
              key={i}
              className={
                i > 0 ? "mt-1 pt-1 border-t border-[var(--gray-100)]" : ""
              }
            >
              {section.heading && (
                <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--gray-400)]">
                  {section.heading}
                </div>
              )}
              {section.items.map(renderItem)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
