"use client";

import React, { useState, useRef, useEffect } from "react";
import { Send, Image as ImageIcon } from "lucide-react";
import { MessageComposerProps } from "./types";
import Chip from "../Chip";
import { ToneType } from "../Chip/types";

const MessageComposer: React.FC<MessageComposerProps> = ({
  tone,
  onToneChange,
  onSend,
  onAttachImage,
  placeholder = "메시지 입력…",
  disabled = false,
  className = "",
}) => {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 텍스트 영역 높이 자동 조절
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "inherit";
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(scrollHeight, 120)}px`;
    }
  }, [value]);

  const handleSend = () => {
    if (value.trim() && !disabled) {
      onSend(value);
      setValue("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const tones: {
    type: ToneType;
    label: string;
    icon: string;
    shortcut: string;
  }[] = [
    { type: "chat", label: "수다", icon: "💬", shortcut: "⌘1" },
    { type: "ask", label: "물어봄", icon: "🤔", shortcut: "⌘2" },
    { type: "urgent", label: "급함", icon: "⚡", shortcut: "⌘3" },
    { type: "share", label: "공유", icon: "📎", shortcut: "⌘4" },
  ];

  return (
    <div className={`border-t border-gray-200 bg-white p-5 pb-6 ${className}`}>
      <div className="mb-2 flex gap-1">
        {tones.map((t) => (
          <Chip
            key={t.type}
            variant="tone"
            tone={t.type}
            label={`${t.icon} ${t.label}`}
            active={tone === t.type}
            onClick={() => onToneChange(t.type)}
            shortcut={t.shortcut}
          />
        ))}
      </div>

      <div
        className={`flex items-end gap-2 rounded-xl bg-[#f2f4f6] p-1.5 pl-3.5 transition-all focus-within:bg-white focus-within:ring-2 focus-within:ring-[#eaf0ff] ${disabled ? "opacity-50" : ""}`}
      >
        <button
          onClick={onAttachImage}
          className="flex h-[30px] w-[30px] items-center justify-center rounded-lg text-[#8b95a1] hover:bg-gray-200 hover:text-gray-800 transition-colors"
          title="이미지 첨부"
        >
          <ImageIcon size={18} strokeWidth={2} />
        </button>

        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          rows={1}
          className="flex-1 resize-none bg-transparent py-2 text-sm leading-relaxed text-[#191f28] outline-none placeholder:text-[#b0b8c1]"
        />

        <button
          onClick={handleSend}
          disabled={!value.trim() || disabled}
          className={`flex h-9 w-9 items-center justify-center rounded-lg transition-all ${
            value.trim() && !disabled
              ? "bg-[#2f6bff] text-white shadow-sm hover:bg-[#1f5aeb]"
              : "bg-gray-300 text-gray-100 cursor-not-allowed"
          }`}
        >
          <Send size={18} strokeWidth={2.5} />
        </button>
      </div>

      <div className="mt-1.5 flex justify-between px-1 text-[11px] text-[#8b95a1]">
        <div className="flex gap-2">
          <span>
            전송:{" "}
            <kbd className="rounded border border-gray-200 bg-gray-50 px-1 font-mono text-[10px]">
              ↵
            </kbd>
          </span>
          <span>
            줄바꿈:{" "}
            <kbd className="rounded border border-gray-200 bg-gray-50 px-1 font-mono text-[10px]">
              ⇧↵
            </kbd>
          </span>
        </div>
        <span>{value.length.toLocaleString()} / 10,000</span>
      </div>
    </div>
  );
};

export default MessageComposer;
