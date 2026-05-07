"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@/app/_components/Button";
import { DaySelector } from "@/app/_components/DaySelector";
import { Toggle } from "@/app/_components/Toggle";
import { dayValuesToWeekdays, weekdaysToDayValues } from "./constants";
import { updateWorkspace } from "./api";
import { SettingsApiError, WorkspaceDto } from "./types";

interface WorkspaceSectionProps {
  initialWorkspace: WorkspaceDto;
  onSaved: (workspace: WorkspaceDto) => void;
}

interface FormState {
  workDayValues: string[];
  workStartTime: string;
  workEndTime: string;
  lunchBreak: boolean;
  shareWorktime: boolean;
}

interface FieldErrors {
  range?: string;
  workDays?: string;
  general?: string;
}

function toForm(workspace: WorkspaceDto): FormState {
  return {
    workDayValues: weekdaysToDayValues(workspace.workDays),
    workStartTime: workspace.workStartTime,
    workEndTime: workspace.workEndTime,
    lunchBreak: workspace.lunchBreak,
    shareWorktime: workspace.shareWorktime,
  };
}

function isEqual(a: WorkspaceDto, b: WorkspaceDto): boolean {
  if (a.workDays.length !== b.workDays.length) return false;
  if (a.workDays.some((d, i) => d !== b.workDays[i])) return false;
  return (
    a.workStartTime === b.workStartTime &&
    a.workEndTime === b.workEndTime &&
    a.lunchBreak === b.lunchBreak &&
    a.shareWorktime === b.shareWorktime
  );
}

function buildPayload(form: FormState): WorkspaceDto {
  return {
    workDays: dayValuesToWeekdays(form.workDayValues),
    workStartTime: form.workStartTime,
    workEndTime: form.workEndTime,
    lunchBreak: form.lunchBreak,
    shareWorktime: form.shareWorktime,
  };
}

export const WorkspaceSection: React.FC<WorkspaceSectionProps> = ({
  initialWorkspace,
  onSaved,
}) => {
  const [form, setForm] = useState<FormState>(toForm(initialWorkspace));
  const [errors, setErrors] = useState<FieldErrors>({});
  const [isSaving, setIsSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  useEffect(() => {
    if (!savedAt) return;
    const t = setTimeout(() => setSavedAt(null), 2000);
    return () => clearTimeout(t);
  }, [savedAt]);

  const payload = useMemo(() => buildPayload(form), [form]);
  const isDirty = !isEqual(payload, initialWorkspace);

  const validate = (): boolean => {
    const next: FieldErrors = {};
    if (form.workDayValues.length === 0) {
      next.workDays = "근무 요일을 하나 이상 선택해주세요.";
    }
    if (form.workStartTime >= form.workEndTime) {
      next.range = "근무 종료 시각은 시작 시각보다 늦어야 해요.";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSave = async () => {
    if (!validate() || !isDirty) return;
    setIsSaving(true);
    setErrors({});

    try {
      const res = await updateWorkspace(payload);
      setForm(toForm(res.workspace));
      onSaved(res.workspace);
      setSavedAt(Date.now());
    } catch (err) {
      if (err instanceof SettingsApiError) {
        setErrors({
          general:
            err.fieldMessage ?? "저장에 실패했어요. 잠시 후 다시 시도해주세요.",
        });
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
        <h2 className="text-[16px] font-bold text-[var(--gray-900)]">
          업무 시간
        </h2>
        <p className="mt-1 text-[13px] text-[var(--gray-500)]">
          업무 시간을 설정하면 친구에게 알림이 가는 시점이 자동으로 조정돼요.
        </p>
      </header>

      <div className="flex flex-col gap-5">
        <div>
          <DaySelector
            label="근무 요일"
            selectedDays={form.workDayValues}
            onChange={(days) => setForm((s) => ({ ...s, workDayValues: days }))}
          />
          {errors.workDays && (
            <p className="mt-1.5 text-xs text-[var(--danger)] px-0.5">
              {errors.workDays}
            </p>
          )}
        </div>

        <div>
          <label className="block text-[13px] font-semibold text-[var(--gray-700)] mb-2">
            근무 시간
          </label>
          <div className="flex items-center gap-3">
            <input
              type="time"
              value={form.workStartTime}
              onChange={(e) =>
                setForm((s) => ({ ...s, workStartTime: e.target.value }))
              }
              className="h-12 flex-1 rounded-md border border-[var(--gray-200)] bg-[var(--bg-surface)] px-4 text-[15px] focus:border-[var(--brand-primary)] focus:outline-none"
            />
            <span className="text-[var(--gray-400)]">—</span>
            <input
              type="time"
              value={form.workEndTime}
              onChange={(e) =>
                setForm((s) => ({ ...s, workEndTime: e.target.value }))
              }
              className="h-12 flex-1 rounded-md border border-[var(--gray-200)] bg-[var(--bg-surface)] px-4 text-[15px] focus:border-[var(--brand-primary)] focus:outline-none"
            />
          </div>
          {errors.range && (
            <p className="mt-1.5 text-xs text-[var(--danger)] px-0.5">
              {errors.range}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-3 pt-2">
          <Toggle
            checked={form.lunchBreak}
            onChange={(v) => setForm((s) => ({ ...s, lunchBreak: v }))}
            label="점심 시간 비우기"
            description="12:00–13:00에는 알림을 보류해요."
          />
          <Toggle
            checked={form.shareWorktime}
            onChange={(v) => setForm((s) => ({ ...s, shareWorktime: v }))}
            label="친구에게 업무 시간 공유"
            description="친구가 내 근무 시간 정보를 볼 수 있어요."
          />
        </div>
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
