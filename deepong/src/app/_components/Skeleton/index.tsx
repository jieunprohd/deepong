"use client";

import React from "react";

export type SkeletonVariant = "text" | "circle" | "rect";

export interface SkeletonProps {
  /** 모양 (기본 text) */
  variant?: SkeletonVariant;
  /** 너비 (px 또는 %) */
  width?: number | string;
  /** 높이 (px) */
  height?: number | string;
  /** 추가 클래스 */
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  variant = "text",
  width,
  height,
  className = "",
}) => {
  const radiusMap: Record<SkeletonVariant, string> = {
    text: "rounded",
    circle: "rounded-full",
    rect: "rounded-[var(--r-md)]",
  };

  const defaultHeight: Record<SkeletonVariant, string> = {
    text: "0.85em",
    circle: "40px",
    rect: "60px",
  };

  return (
    <span
      className={`block animate-pulse bg-[var(--gray-100)] ${radiusMap[variant]} ${className}`}
      style={{
        width: width ?? (variant === "circle" ? "40px" : "100%"),
        height: height ?? defaultHeight[variant],
      }}
      aria-hidden
    />
  );
};

export interface SkeletonListProps {
  /** 반복할 개수 */
  count: number;
  /** 각 라인의 height */
  lineHeight?: number;
  /** 라인 간격 */
  gap?: number;
  className?: string;
}

export const SkeletonList: React.FC<SkeletonListProps> = ({
  count,
  lineHeight = 12,
  gap = 8,
  className = "",
}) => {
  return (
    <div
      className={`flex flex-col ${className}`}
      style={{ gap: `${gap}px` }}
      aria-hidden
    >
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} variant="text" height={lineHeight} />
      ))}
    </div>
  );
};
