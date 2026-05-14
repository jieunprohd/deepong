"use client";

import React, { useRef, useState } from "react";
import { Camera } from "lucide-react";
import { Avatar } from "@/app/_components/Avatar";
import { Input } from "@/app/_components/Input";
import { Select } from "@/app/_components/Select";
import { DaySelector } from "@/app/_components/DaySelector";
import {
  TIMEZONE_OPTIONS,
  dayValuesToWeekdays,
  weekdaysToDayValues,
} from "@/features/settings/constants";
import { updateProfile, updateWorkspace } from "@/features/settings/api";
import type { ProfileDto, WorkspaceDto } from "@/features/settings/types";

interface Props {
  user: ProfileDto;
  workspace: WorkspaceDto | null;
  onNext: () => void;
}

const DEFAULT_WORKSPACE: WorkspaceDto = {
  workDays: [1, 2, 3, 4, 5],
  workStartTime: "09:00",
  workEndTime: "18:00",
  lunchBreak: true,
  shareWorktime: true,
};

function resizeImage(file: File, maxSize = 256): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new window.Image();
      img.onload = () => {
        const scale = Math.min(maxSize / img.width, maxSize / img.height, 1);
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext("2d")?.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.85));
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function Step1Profile({ user, workspace, onNext }: Props) {
  const ws = workspace ?? DEFAULT_WORKSPACE;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [nickname, setNickname] = useState(user.nickname);
  const [bio, setBio] = useState(user.bio ?? "");
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl ?? "");
  const [timezone, setTimezone] = useState(user.timezone);
  const [workDayValues, setWorkDayValues] = useState<string[]>(
    weekdaysToDayValues(ws.workDays),
  );
  const [workStart, setWorkStart] = useState(ws.workStartTime);
  const [workEnd, setWorkEnd] = useState(ws.workEndTime);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setAvatarUrl(await resizeImage(file));
    } catch {
      setError("이미지를 불러오지 못했어요.");
    }
    e.target.value = "";
  };

  const handleNext = async () => {
    if (!nickname.trim()) {
      setError("닉네임을 입력해주세요.");
      return;
    }
    if (workStart >= workEnd) {
      setError("근무 종료 시각은 시작 시각보다 늦어야 해요.");
      return;
    }
    setError(null);
    setIsSaving(true);
    try {
      await Promise.all([
        updateProfile({
          nickname: nickname.trim(),
          bio: bio.trim() || null,
          avatarUrl: avatarUrl || null,
          timezone,
        }),
        updateWorkspace({
          workDays: dayValuesToWeekdays(workDayValues),
          workStartTime: workStart,
          workEndTime: workEnd,
          lunchBreak: ws.lunchBreak,
          shareWorktime: ws.shareWorktime,
        }),
      ]);
      onNext();
    } catch {
      setError("저장에 실패했어요. 다시 시도해주세요.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <div className="flex-1 overflow-y-auto px-[72px] py-[48px]">
        <p className="mb-2 text-[11px] font-bold tracking-widest text-[var(--brand-primary)]">
          STEP 1 / 3
        </p>
        <h1 className="mb-2 text-[26px] font-bold tracking-tight text-[#191f28]">
          프로필과 업무 시간을 알려주세요
        </h1>
        <p className="mb-8 text-[14px] text-[#6b7684]">
          친구들에게 보이는 모습이고, 알림을 언제 보낼지 결정하는 기준이 됩니다.
        </p>

        {/* Avatar */}
        <div
          className="mb-6 flex cursor-pointer items-center gap-4 rounded-xl border border-dashed border-[#d1d6db] p-4 transition-colors hover:bg-[#f9fafb]"
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="relative shrink-0">
            <Avatar
              name={user.nickname}
              color="blue"
              size="2xl"
              profile={avatarUrl || undefined}
              hover={false}
            />
            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity hover:opacity-100">
              <Camera size={20} className="text-white" />
            </div>
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
          <div className="flex-1">
            <p className="text-[14px] font-semibold text-[#191f28]">{nickname || user.nickname}</p>
            <p className="mt-0.5 text-[12px] text-[#8b95a1]">
              프로필 사진을 설정하면 친구들이 더 쉽게 알아봐요.
            </p>
          </div>
          <button
            type="button"
            className="h-9 rounded-lg bg-[#f2f4f6] px-4 text-[13px] font-medium text-[#4e5968] hover:bg-[#e8eaed]"
          >
            업로드
          </button>
        </div>

        {/* Profile fields */}
        <div className="flex flex-col gap-4">
          <Input
            label="닉네임"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            maxLength={20}
          />
          <Input
            label="한 줄 소개 (선택)"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="친구들에게 보일 짧은 소개"
            maxLength={100}
          />
          <Select
            label="시간대"
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            options={TIMEZONE_OPTIONS}
          />
        </div>

        {/* Work hours */}
        <div className="my-8 flex items-center gap-3">
          <div className="h-px flex-1 bg-[#e5e8eb]" />
          <span className="text-[13px] font-semibold text-[#8b95a1]">업무 시간</span>
          <div className="h-px flex-1 bg-[#e5e8eb]" />
        </div>
        <p className="mb-4 text-[13px] text-[#6b7684]">
          이 시간에는 "일하는 중" 상태가 되고, 수다 메시지 알림은 쉬는 시간에 묶어서 도착해요.
        </p>

        <DaySelector
          label="근무 요일"
          selectedDays={workDayValues}
          onChange={setWorkDayValues}
        />

        <div className="mt-4">
          <label className="mb-2 block text-[13px] font-semibold text-[#4e5968]">
            근무 시간
          </label>
          <div className="flex items-center gap-3">
            <input
              type="time"
              value={workStart}
              onChange={(e) => setWorkStart(e.target.value)}
              className="h-11 flex-1 rounded-lg border border-[#e5e8eb] px-3 text-[14px] text-[#191f28] focus:border-[var(--brand-primary)] focus:outline-none"
            />
            <span className="text-[#b0b8c1]">—</span>
            <input
              type="time"
              value={workEnd}
              onChange={(e) => setWorkEnd(e.target.value)}
              className="h-11 flex-1 rounded-lg border border-[#e5e8eb] px-3 text-[14px] text-[#191f28] focus:border-[var(--brand-primary)] focus:outline-none"
            />
          </div>
        </div>

        {error && (
          <p className="mt-4 text-[13px] text-[var(--danger)]">{error}</p>
        )}
      </div>

      {/* Footer */}
      <footer className="shrink-0 flex items-center justify-end border-t border-[#f2f4f6] px-[72px] py-4">
        <button
          onClick={handleNext}
          disabled={isSaving}
          className="h-11 rounded-xl bg-[var(--brand-primary)] px-6 text-[14px] font-semibold text-white transition-colors hover:bg-[var(--brand-primary-hover)] disabled:opacity-50"
        >
          {isSaving ? "저장 중..." : "다음으로"}
        </button>
      </footer>
    </>
  );
}
