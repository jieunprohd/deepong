"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Avatar } from "@/app/_components/Avatar";
import { Button } from "@/app/_components/Button";
import { Input } from "@/app/_components/Input";
import { Select } from "@/app/_components/Select";
import {
  BIO_MAX_LENGTH,
  NICKNAME_MAX_LENGTH,
  TIMEZONE_OPTIONS,
} from "./constants";
import { updateProfile } from "./api";
import { ProfileDto, SettingsApiError, UpdateProfileRequest } from "./types";

interface ProfileSectionProps {
  initialProfile: ProfileDto;
  onSaved: (profile: ProfileDto) => void;
}

interface FormState {
  nickname: string;
  bio: string;
  avatarUrl: string;
  timezone: string;
}

interface FieldErrors {
  nickname?: string;
  timezone?: string;
  general?: string;
}

function toForm(profile: ProfileDto): FormState {
  return {
    nickname: profile.nickname,
    bio: profile.bio ?? "",
    avatarUrl: profile.avatarUrl ?? "",
    timezone: profile.timezone,
  };
}

function diffPatch(initial: ProfileDto, form: FormState): UpdateProfileRequest {
  const patch: UpdateProfileRequest = {};
  if (form.nickname.trim() !== initial.nickname) {
    patch.nickname = form.nickname.trim();
  }
  const nextBio = form.bio.trim() === "" ? null : form.bio.trim();
  if (nextBio !== (initial.bio ?? null)) {
    patch.bio = nextBio;
  }
  const nextAvatar =
    form.avatarUrl.trim() === "" ? null : form.avatarUrl.trim();
  if (nextAvatar !== (initial.avatarUrl ?? null)) {
    patch.avatarUrl = nextAvatar;
  }
  if (form.timezone !== initial.timezone) {
    patch.timezone = form.timezone;
  }
  return patch;
}

export const ProfileSection: React.FC<ProfileSectionProps> = ({
  initialProfile,
  onSaved,
}) => {
  const [form, setForm] = useState<FormState>(toForm(initialProfile));
  const [errors, setErrors] = useState<FieldErrors>({});
  const [isSaving, setIsSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  useEffect(() => {
    if (!savedAt) return;
    const t = setTimeout(() => setSavedAt(null), 2000);
    return () => clearTimeout(t);
  }, [savedAt]);

  const patch = useMemo(
    () => diffPatch(initialProfile, form),
    [initialProfile, form],
  );
  const isDirty = Object.keys(patch).length > 0;

  const validate = (): boolean => {
    const next: FieldErrors = {};
    const nickname = form.nickname.trim();
    if (nickname.length < 1 || nickname.length > NICKNAME_MAX_LENGTH) {
      next.nickname = `닉네임은 1~${NICKNAME_MAX_LENGTH}자여야 해요.`;
    }
    if (!form.timezone) {
      next.timezone = "타임존을 선택해주세요.";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSave = async () => {
    if (!validate() || !isDirty) return;
    setIsSaving(true);
    setErrors({});

    try {
      const res = await updateProfile(patch);
      setForm(toForm(res.user));
      onSaved(res.user);
      setSavedAt(Date.now());
    } catch (err) {
      if (err instanceof SettingsApiError) {
        if (err.code === "INVALID_NICKNAME") {
          setErrors({
            nickname: err.fieldMessage ?? "닉네임 형식이 올바르지 않아요.",
          });
        } else if (err.code === "INVALID_TIMEZONE") {
          setErrors({
            timezone: err.fieldMessage ?? "타임존이 유효하지 않아요.",
          });
        } else {
          setErrors({
            general:
              err.fieldMessage ??
              "저장에 실패했어요. 잠시 후 다시 시도해주세요.",
          });
        }
      } else {
        setErrors({ general: "서버에 연결할 수 없어요." });
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="rounded-xl border border-[var(--gray-200)] bg-white p-6">
      <header className="mb-5">
        <h2 className="text-[16px] font-bold text-[var(--gray-900)]">프로필</h2>
        <p className="mt-1 text-[13px] text-[var(--gray-500)]">
          친구에게 보여지는 내 정보를 설정해요.
        </p>
      </header>

      <div className="flex items-center gap-4 pb-5 border-b border-[var(--gray-100)]">
        <Avatar
          name={initialProfile.nickname}
          color="blue"
          size="2xl"
          profile={form.avatarUrl || undefined}
          hover={false}
        />
        <div className="flex flex-col gap-0.5">
          <p className="text-[15px] font-semibold text-[var(--gray-900)]">
            {initialProfile.nickname}
          </p>
          <p className="text-[12px] text-[var(--gray-500)]">
            @{initialProfile.handle}
          </p>
          <p className="mt-1 text-[12px] text-[var(--gray-400)]">
            핸들은 변경할 수 없어요.
          </p>
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-4">
        <Input label="이메일" value={initialProfile.email} readOnly disabled />

        <Input
          label="닉네임"
          value={form.nickname}
          onChange={(e) => setForm((s) => ({ ...s, nickname: e.target.value }))}
          maxLength={NICKNAME_MAX_LENGTH}
          error={errors.nickname}
          help={`${form.nickname.trim().length}/${NICKNAME_MAX_LENGTH}`}
        />

        <div className="flex flex-col gap-1.5 w-full">
          <label className="text-[13px] font-semibold text-[var(--gray-700)] px-0.5">
            소개
          </label>
          <textarea
            value={form.bio}
            onChange={(e) => setForm((s) => ({ ...s, bio: e.target.value }))}
            placeholder="자기소개를 입력해주세요"
            maxLength={BIO_MAX_LENGTH}
            rows={3}
            className="w-full rounded-md border border-[var(--gray-200)] bg-[var(--bg-surface)] p-3 text-[15px] resize-none focus:border-[var(--brand-primary)] focus:outline-none"
          />
          <p className="px-0.5 text-xs text-[var(--gray-500)]">
            {form.bio.length}/{BIO_MAX_LENGTH}
          </p>
        </div>

        <Input
          label="아바타 이미지 URL"
          value={form.avatarUrl}
          onChange={(e) =>
            setForm((s) => ({ ...s, avatarUrl: e.target.value }))
          }
          placeholder="https://..."
          help="비워두면 기본 아바타가 표시돼요."
        />

        <Select
          label="타임존"
          value={form.timezone}
          onChange={(e) => setForm((s) => ({ ...s, timezone: e.target.value }))}
          options={TIMEZONE_OPTIONS}
          error={errors.timezone}
        />
      </div>

      {errors.general && (
        <p className="mt-4 text-[13px] text-[var(--danger)]">
          {errors.general}
        </p>
      )}

      <div className="mt-6 flex items-center justify-end gap-3">
        {savedAt && (
          <span className="text-[13px] text-[var(--success)]">
            저장되었어요
          </span>
        )}
        <Button
          variant="primary"
          onClick={handleSave}
          isLoading={isSaving}
          disabled={!isDirty || isSaving}
        >
          저장
        </Button>
      </div>
    </section>
  );
};
