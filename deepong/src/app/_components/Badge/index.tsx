"use client";

import React from "react";

export type BadgeTone =
  | "neutral"
  | "brand"
  | "success"
  | "warning"
  | "danger"
  | "info";
export type BadgeSize = "sm" | "md";

export interface BadgeProps {
  /** 배지 라벨 (숫자 또는 텍스트). dot 모드일 때는 무시 */
  label?: React.ReactNode;
  /** 색상 톤 (기본 neutral) */
  tone?: BadgeTone;
  /** 크기 */
  size?: BadgeSize;
  /** 점 형태로만 표시 */
  dot?: boolean;
  /** 99 이상이면 99+로 표시 */
  max?: number;
  /** 추가 클래스 */
  className?: string;
}

const toneStyles: Record<BadgeTone, string> = {
  neutral: "bg-[var(--gray-100)] text-[var(--gray-700)]",
  brand: "bg-[var(--brand-primary)] text-white",
  success: "bg-[var(--success)] text-white",
  warning: "bg-[var(--warning)] text-white",
  danger: "bg-[var(--danger)] text-white",
  info: "bg-[var(--info)] text-white",
};

const dotStyles: Record<BadgeTone, string> = {
  neutral: "bg-[var(--gray-400)]",
  brand: "bg-[var(--brand-primary)]",
  success: "bg-[var(--success)]",
  warning: "bg-[var(--warning)]",
  danger: "bg-[var(--danger)]",
  info: "bg-[var(--info)]",
};

const sizeStyles: Record<BadgeSize, string> = {
  sm: "h-4 min-w-[16px] px-1 text-[10px]",
  md: "h-[18px] min-w-[18px] px-1.5 text-[11px]",
};

export const Badge: React.FC<BadgeProps> = ({
  label,
  tone = "neutral",
  size = "md",
  dot = false,
  max = 99,
  className = "",
}) => {
  if (dot) {
    return (
      <span
        className={`inline-block h-2 w-2 rounded-full ring-2 ring-white ${dotStyles[tone]} ${className}`}
      />
    );
  }

  const display = typeof label === "number" && label > max ? `${max}+` : label;

  return (
    <span
      className={`
        inline-flex items-center justify-center
        rounded-full font-bold leading-none
        ${toneStyles[tone]}
        ${sizeStyles[size]}
        ${className}
      `}
    >
      {display}
    </span>
  );
};
