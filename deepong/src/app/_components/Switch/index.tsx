"use client";

import React from "react";

export type SwitchSize = "sm" | "md";

export interface SwitchProps {
  /** 켜짐 여부 */
  checked: boolean;
  /** 변경 콜백 */
  onChange: (checked: boolean) => void;
  /** 라벨 (오른쪽에 표시) */
  label?: React.ReactNode;
  /** 라벨 아래 보조 설명 */
  description?: React.ReactNode;
  /** 크기 */
  size?: SwitchSize;
  /** 비활성화 */
  disabled?: boolean;
  /** 라벨 영역까지 클릭 가능하게 */
  clickableLabel?: boolean;
  className?: string;
}

const sizeMap: Record<
  SwitchSize,
  { track: string; thumb: string; translate: string }
> = {
  sm: { track: "h-5 w-9", thumb: "h-4 w-4", translate: "translate-x-4" },
  md: { track: "h-6 w-11", thumb: "h-5 w-5", translate: "translate-x-5" },
};

export const Switch: React.FC<SwitchProps> = ({
  checked,
  onChange,
  label,
  description,
  size = "md",
  disabled = false,
  clickableLabel = true,
  className = "",
}) => {
  const dims = sizeMap[size];

  const toggle = () => {
    if (disabled) return;
    onChange(!checked);
  };

  const switchEl = (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation();
        toggle();
      }}
      className={`
        relative inline-flex shrink-0 items-center rounded-full p-0.5
        transition-colors duration-[var(--t-fast)]
        focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary-light)]
        ${dims.track}
        ${checked ? "bg-[var(--brand-primary)]" : "bg-[var(--gray-300)]"}
        ${disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}
      `}
    >
      <span
        className={`
          inline-block rounded-full bg-white shadow-[var(--shadow-xs)]
          transition-transform duration-[var(--t-fast)]
          ${dims.thumb}
          ${checked ? dims.translate : "translate-x-0"}
        `}
      />
    </button>
  );

  if (!label && !description) {
    return <span className={className}>{switchEl}</span>;
  }

  const Wrapper: React.ElementType = clickableLabel ? "label" : "div";

  return (
    <Wrapper
      className={`
        flex items-start justify-between gap-3
        ${clickableLabel && !disabled ? "cursor-pointer" : ""}
        ${className}
      `}
      onClick={clickableLabel ? toggle : undefined}
    >
      <div className="min-w-0 flex-1">
        {label && (
          <div className="text-[14px] font-semibold text-[var(--gray-900)]">
            {label}
          </div>
        )}
        {description && (
          <div className="mt-0.5 text-[12px] text-[var(--gray-500)] leading-relaxed">
            {description}
          </div>
        )}
      </div>
      <div className="pt-0.5">{switchEl}</div>
    </Wrapper>
  );
};
