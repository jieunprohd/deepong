"use client";

import React from "react";
import Image from "next/image";

export type PresenceStatus = "free" | "working" | "focus" | "off";

export interface AvatarProps {
  /** 사용자의 프로필 이미지 URL */
  profile?: string;
  /** 사용자의 이름 (필수, 이미지 없을 시 첫 글자 추출) */
  name: string;
  /** 크기: sm(32px), md(40px), lg(48px), xl(56px) */
  size?: "sm" | "md" | "lg" | "xl";
  /** 온라인 상태 */
  presence?: PresenceStatus;
  /** 그룹 채팅 인원수 (3 이상 시 숫자 표시) */
  participantCount?: number;
  /** 아바타 우측 이름 라벨 (생략 시 name 사용) */
  label?: string;
  /** 이름 아래 상태 메시지 또는 칩 */
  subLabel?: React.ReactNode;
  /** 우측 상단 시간 표시 */
  time?: string;
  /** 이름 옆 방 종류 표시 (예: 1:1, 팀채팅) */
  roomType?: string;
  /** 추가 스타일 클래스 */
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  profile,
  name,
  size = "md",
  presence,
  participantCount,
  label,
  subLabel,
  time,
  roomType,
  className = "",
}) => {
  const isGroup = typeof participantCount === "number" && participantCount >= 3;
  const firstLetter = name ? name.charAt(0).toUpperCase() : "?";

  const sizeMap = {
    sm: "w-8 h-8 text-[12px]",
    md: "w-10 h-10 text-[14px]",
    lg: "w-12 h-12 text-[16px]",
    xl: "w-14 h-14 text-[18px]",
  };

  const bgMap: Record<PresenceStatus, string> = {
    free: "bg-[var(--success-light)] text-[var(--success)]",
    working: "bg-[var(--warning-light)] text-[var(--warning)]",
    focus: "bg-[var(--brand-primary-light)] text-[var(--brand-primary)]",
    off: "bg-[var(--gray-100)] text-[var(--gray-500)]",
  };

  const defaultBg = "bg-[var(--gray-100)] text-[var(--gray-700)]";
  const appliedBg = presence ? bgMap[presence] : defaultBg;

  const avatarContent = (
    <div className="relative inline-block shrink-0">
      <div
        className={`
          ${sizeMap[size]}
          ${appliedBg}
          rounded-full font-bold flex items-center justify-center overflow-hidden transition-colors
        `}
      >
        {isGroup ? (
          <span className="text-(--gray-600)">{participantCount}</span>
        ) : profile ? (
          <Image
            src={profile}
            alt={name}
            className="w-full h-full object-cover"
            width={56}
            height={56}
          />
        ) : (
          firstLetter
        )}
      </div>
      {presence && (
        <span
          className={`
            absolute -right-px -bottom-px rounded-full border-2 border-white
            ${size === "sm" ? "w-2.5 h-2.5" : "w-3.5 h-3.5"}
            bg-[var(--presence-${presence})]
          `}
        />
      )}
    </div>
  );

  // 텍스트 정보(label, subLabel, time, roomType) 중 하나라도 있으면 리스트 레이아웃으로 표시
  const hasTextInfo = !!(label || subLabel || time || roomType);

  if (hasTextInfo) {
    return (
      <div className={`flex items-center gap-3 w-full ${className}`}>
        {avatarContent}
        <div className="flex flex-col flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1 min-w-0">
              <span className="text-[15px] font-semibold text-(--gray-900) truncate">
                {label || name}
              </span>
              {roomType && (
                <span className="text-[13px] text-(--gray-400) shrink-0">
                  · {roomType}
                </span>
              )}
            </div>
            {time && (
              <span className="text-[12px] text-(--gray-400) shrink-0">
                {time}
              </span>
            )}
          </div>
          {subLabel && (
            <div className="flex items-center gap-1.5 text-[13px] text-(--gray-600) mt-0.5 truncate">
              {subLabel}
            </div>
          )}
        </div>
      </div>
    );
  }

  // 텍스트 정보가 없으면 아바타 원형만 반환
  return <div className={`inline-block ${className}`}>{avatarContent}</div>;
};
