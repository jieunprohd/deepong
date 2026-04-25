"use client";

import React from "react";

interface CardProps {
  children: React.ReactNode;
  variant?: "elevated" | "flat" | "glass" | "outline";
  padding?: "none" | "sm" | "md" | "lg";
  className?: string;
  title?: string;
}

interface CardItemProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  showDivider?: boolean;
}

// ✅ 이름 있는 컴포넌트 + 정적 프로퍼티로 Item 붙이기
const CardRoot: React.FC<CardProps> & { Item: React.FC<CardItemProps> } = ({
  children,
  variant = "elevated",
  padding = "md",
  className = "",
  title,
}) => {
  const variantStyles: Record<NonNullable<CardProps["variant"]>, string> = {
    elevated: "bg-white shadow-[var(--shadow-md)]",
    flat: "bg-[var(--gray-50)]",
    outline: "bg-white border border-[var(--gray-200)]",
    glass:
      "bg-[rgba(255,255,255,0.7)] backdrop-blur-md border border-[rgba(255,255,255,0.14)]",
  };

  const paddingStyles: Record<NonNullable<CardProps["padding"]>, string> = {
    none: "p-0",
    sm: "p-3",
    md: "p-5",
    lg: "p-8",
  };

  return (
    <div className="flex flex-col gap-2 w-full">
      {title && (
        <h3 className="text-[13px] font-semibold text-(--gray-500) px-1 uppercase tracking-wider">
          {title}
        </h3>
      )}
      <div
        className={`
          rounded-(--r-xl) overflow-hidden
          ${variantStyles[variant]}
          ${paddingStyles[padding]}
          ${className}
        `}
      >
        {children}
      </div>
    </div>
  );
};

// ✅ Card.Item도 이름 있는 컴포넌트로 분리
const CardItem: React.FC<CardItemProps> = ({
  children,
  onClick,
  className = "",
  showDivider = true,
}) => {
  return (
    <div
      onClick={onClick}
      className={`
        relative group
        ${onClick ? "cursor-pointer hover:bg-(--gray-50)" : ""}
        ${className}
      `}
    >
      <div className="py-3 px-1">{children}</div>
      {showDivider && (
        <div className="absolute bottom-0 left-0 right-0 h-px bg-(--gray-100) last:hidden" />
      )}
    </div>
  );
};

// 정적 프로퍼티로 연결
CardRoot.Item = CardItem;

// displayName 설정 (선택이지만 규칙에 따라 안전하게)
CardRoot.displayName = "Card";
CardItem.displayName = "Card.Item";

export const Card = CardRoot;
export type { CardProps, CardItemProps };
