import React from "react";
import { ChipProps } from "./types";

const Chip: React.FC<ChipProps> = ({
  variant = "filter",
  tone,
  presence,
  statusValue,
  label,
  icon,
  active,
  onClick,
  shortcut,
  className = "",
  size = "md",
}) => {
  const isInteractive = !!onClick;

  // 1. 상태별 아이콘 자동 결정
  const renderIcon = () => {
    if (variant === "status" && presence) {
      const dotColors: Record<string, string> = {
        free: "bg-[#00C471]",
        working: "bg-[#FF9500]",
        focus: "bg-[#3182F6]",
        off: "bg-[#B0B8C1]",
      };
      return (
        <div
          className={`w-2 h-2 rounded-full ${dotColors[presence]} ${presence === "focus" ? "animate-pulse" : ""}`}
        />
      );
    }
    return icon;
  };

  // 2. 상태별 라벨 동적 생성
  const renderLabel = () => {
    if (variant === "status" && presence) {
      switch (presence) {
        case "focus":
          return `집중 모드${statusValue ? ` · ${statusValue}분 남음` : ""}`;
        case "working":
          return `일하는 중${statusValue ? ` · ${statusValue}까지` : ""}`;
        case "free":
          return label || "여유로움";
        case "off":
          return label || "오프라인";
      }
    }
    return label;
  };

  const getVariantStyles = () => {
    switch (variant) {
      case "tone":
        switch (tone) {
          case "chat":
            return active
              ? "bg-[#F2F4F6] text-[#191F28] border-gray-300 shadow-sm"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200";
          case "ask":
            return active
              ? "bg-[#FEF4E2] text-[#B06B00] border-[#F5C265] shadow-sm"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200";
          case "urgent":
            return active
              ? "bg-[#FEECEE] text-[#C23040] border-[#F5A5A8] shadow-sm"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200";
          case "share":
            return active
              ? "bg-[#E8F2FE] text-[#1E5FC0] border-[#A5C9F5] shadow-sm"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200";
          default:
            return "bg-gray-100 text-gray-600 hover:bg-gray-200";
        }
      case "filter":
        return active
          ? "bg-gray-900 text-white"
          : "bg-gray-100 text-gray-600 hover:bg-gray-200";
      case "badge":
        if (tone === "urgent") return "bg-[#FEECEE] text-[#C23040]";
        if (tone === "ask") return "bg-[#FEF4E2] text-[#B06B00]";
        if (tone === "share") return "bg-[#E8F2FE] text-[#1E5FC0]";
        if (tone === "chat") return "bg-[#F2F4F6] text-[#4E5968]";
        return "bg-gray-100 text-gray-700";
      case "status":
        switch (presence) {
          case "free":
            return "bg-[#E6F9F1] text-[#00C471]";
          case "working":
            return "bg-[#FFF4E5] text-[#FF9500]";
          case "focus":
            return "bg-[#E8F2FE] text-[#3182F6]";
          case "off":
            return "bg-[#F2F4F6] text-[#8B95A1]";
          default:
            return "bg-white/80 backdrop-blur-[4px] text-gray-700 shadow-sm border border-gray-100";
        }
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  const getShapeStyles = () => {
    // tone과 badge는 약간 각진 형태 (6px), 나머지는 완전 원형
    if (variant === "tone" || variant === "badge") return "rounded-md";
    return "rounded-full";
  };

  const getSizeStyles = () => {
    if (variant === "badge") return "h-[18px] px-1.5 text-[10px] font-bold";
    if (variant === "status") return "h-[36px] px-[14px] text-[13px]";
    if (size === "sm") return "h-[24px] px-2 text-[11px]";
    return "h-[28px] px-[10px] text-[11px]";
  };

  const baseStyles =
    "inline-flex items-center gap-1 font-semibold transition-all border border-transparent whitespace-nowrap";
  const combinedClassName = `${baseStyles} ${getVariantStyles()} ${getShapeStyles()} ${getSizeStyles()} ${isInteractive ? "cursor-pointer" : ""} ${className}`;

  return (
    <button
      type="button"
      className={combinedClassName}
      onClick={onClick}
      disabled={!isInteractive}
    >
      {renderIcon() && (
        <span className="flex items-center shrink-0">{renderIcon()}</span>
      )}
      <span>{renderLabel()}</span>
      {shortcut && (
        <kbd className="ml-1 font-mono text-[9px] bg-white border border-gray-200 rounded px-1 text-gray-400">
          {shortcut}
        </kbd>
      )}
    </button>
  );
};

export default Chip;
