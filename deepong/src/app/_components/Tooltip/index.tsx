"use client";

import React, { useState, useRef } from "react";

export type TooltipPlacement = "top" | "bottom" | "left" | "right";

export interface TooltipProps {
  /** 툴팁에 표시할 내용 */
  content: React.ReactNode;
  /** 툴팁이 붙을 대상 요소 */
  children: React.ReactElement;
  /** 표시 위치 (기본 top) */
  placement?: TooltipPlacement;
  /** 호버 후 표시까지의 지연(ms, 기본 200) */
  delay?: number;
  /** 비활성화 시 툴팁 숨김 */
  disabled?: boolean;
  /** 추가 클래스 */
  className?: string;
}

const placementStyles: Record<TooltipPlacement, string> = {
  top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
  bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
  left: "right-full top-1/2 -translate-y-1/2 mr-2",
  right: "left-full top-1/2 -translate-y-1/2 ml-2",
};

const arrowStyles: Record<TooltipPlacement, string> = {
  top: "top-full left-1/2 -translate-x-1/2 border-t-[var(--gray-900)] border-x-transparent border-b-transparent",
  bottom:
    "bottom-full left-1/2 -translate-x-1/2 border-b-[var(--gray-900)] border-x-transparent border-t-transparent",
  left: "left-full top-1/2 -translate-y-1/2 border-l-[var(--gray-900)] border-y-transparent border-r-transparent",
  right:
    "right-full top-1/2 -translate-y-1/2 border-r-[var(--gray-900)] border-y-transparent border-l-transparent",
};

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  placement = "top",
  delay = 200,
  disabled = false,
  className = "",
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const show = () => {
    if (disabled) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setIsVisible(true), delay);
  };

  const hide = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setIsVisible(false);
  };

  return (
    <span
      className="relative inline-flex"
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      {children}
      {isVisible && !disabled && (
        <span
          role="tooltip"
          className={`
            pointer-events-none absolute z-50 whitespace-nowrap
            rounded-md bg-[var(--gray-900)] px-2 py-1
            text-[11px] font-medium text-white shadow-[var(--shadow-md)]
            animate-in fade-in zoom-in-95 duration-150
            ${placementStyles[placement]}
            ${className}
          `}
        >
          {content}
          <span
            className={`absolute h-0 w-0 border-[5px] ${arrowStyles[placement]}`}
          />
        </span>
      )}
    </span>
  );
};
