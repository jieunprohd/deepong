"use client";

import React from "react";
import Image from "next/image";
import { PresenceType } from "../Chip/types";

export type AvatarColor =
  | "amber"
  | "green"
  | "purple"
  | "pink"
  | "gray"
  | "blue";

export interface AvatarProps {
  /** 사용자의 이름 (필수, 이미지 없을 시 첫 글자 추출) */
  name: string;
  /** 사용자의 프로필 이미지 URL */
  profile?: string;
  /** 크기: sm(32px), md(38px), lg(40px), xl(56px), 2xl(80px) */
  size?: "sm" | "md" | "lg" | "xl" | "2xl";
  /** 온라인 상태 */
  presence?: PresenceType;
  /** 아바타 배경 색상 */
  color?: AvatarColor;
  /** 마지막 메시지 (리스트 레이아웃용) */
  lastMessage?: string;
  /** 시간 표시 (리스트 레이아웃용) */
  time?: string;
  /** 추가 스타일 클래스 */
  className?: string;
  /** 활성화(선택) 상태 여부 (리스트 레이아웃용) */
  isActive?: boolean;
  /** 리스트 레이아웃에서 호버 효과 여부 (기본값 true) */
  hover?: boolean;
  /** 클릭 이벤트 */
  onClick?: () => void;
  /** 그룹 채팅 인원수 */
  participantCount?: number;
  /** 방 타입 (예: 1:1, 그룹) */
  roomType?: string;
  /** 이름 아래 표시될 커스텀 영역 (뱃지, 설명 문구 등) */
  subLabel?: React.ReactNode;
}

export const Avatar: React.FC<AvatarProps> = ({
  name,
  profile,
  size = "md",
  presence,
  color = "gray",
  lastMessage,
  time,
  className = "",
  isActive = false,
  hover = true,
  onClick,
  participantCount,
  roomType,
  subLabel,
}) => {
  const isGroup = typeof participantCount === "number" && participantCount >= 3;
  const displayText = name ? name.charAt(0) : "?";

  const sizeMap = {
    sm: "w-8 h-8 text-[13px]",
    md: "w-[38px] h-[38px] text-sm",
    lg: "w-10 h-10 text-sm",
    xl: "w-[56px] h-[56px] text-lg",
    "2xl": "w-20 h-20 text-2xl",
  };

  const bgStyles: Record<AvatarColor, string> = {
    amber: "bg-gradient-to-br from-[#ffb26b] to-[#f59e0b] text-white",
    green: "bg-gradient-to-br from-[#60e0b0] to-[#00c471] text-white",
    purple: "bg-gradient-to-br from-[#a78bfa] to-[#7f77dd] text-white",
    pink: "bg-gradient-to-br from-[#fba5c0] to-[#d4537e] text-white",
    gray: "bg-[#e5e8eb] text-[#4e5968]",
    blue: "bg-gradient-to-br from-[#2f6bff] to-[#85b7eb] text-white",
  };

  const presenceBg = {
    working: "bg-[#ff9500]",
    free: "bg-[#00c471]",
    focus: "bg-[#3182f6]",
    off: "bg-[#b0b8c1]",
  };

  const avatarCircle = (
    <div className="relative shrink-0">
      <div
        className={`
          ${sizeMap[size]}
          ${bgStyles[color]}
          rounded-full font-bold flex items-center justify-center overflow-hidden transition-all shadow-sm
        `}
      >
        {isGroup ? (
          <span>{participantCount}</span>
        ) : profile ? (
          <Image
            src={profile}
            alt={name}
            className="w-full h-full object-cover"
            width={80}
            height={80}
          />
        ) : (
          displayText
        )}
      </div>
      {presence && (
        <div
          className={`absolute bottom-0 right-0 rounded-full border-2 border-white 
            ${presenceBg[presence]}
            ${size === "sm" ? "h-2 w-2" : size === "md" || size === "lg" ? "h-2.5 w-2.5" : "h-3.5 w-3.5"}`}
        />
      )}
    </div>
  );

  const isListLayout = !!(lastMessage || time || roomType || subLabel);

  if (isListLayout) {
    return (
      <div
        onClick={onClick}
        className={`flex gap-2.5 rounded-lg p-2.5 transition-colors 
          ${isActive ? "bg-[#f4f7ff]" : ""} 
          ${hover ? "hover:bg-[#f9fafb] cursor-pointer" : ""} 
          ${className}`}
      >
        {avatarCircle}
        <div className="flex-1 min-w-0">
          <div className="mb-0.5 flex items-baseline justify-between">
            <div className="flex items-center gap-1 min-w-0">
              <span className="truncate text-sm font-semibold text-[#191f28]">
                {name}
              </span>
              {roomType && (
                <span className="text-[12px] text-[#8b95a1] shrink-0">
                  · {roomType}
                </span>
              )}
            </div>
            {time && (
              <span className="shrink-0 text-[11px] text-[#8b95a1]">
                {time}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 truncate text-xs text-[#6b7684]">
            {subLabel}
            {lastMessage && <span className="truncate">{lastMessage}</span>}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className={`inline-block ${hover ? "cursor-pointer" : ""} ${className}`}
    >
      {avatarCircle}
    </div>
  );
};
