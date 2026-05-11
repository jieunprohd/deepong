"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@/app/_components/Button";
import { Toggle } from "@/app/_components/Toggle";
import {
  fetchNotificationPreference,
  updateNotificationPreference,
  type NotificationPreferenceResponse,
} from "@/features/attention/api";

interface FormState {
  batchIntervalMin: number;
  allowUrgentInFocus: boolean;
  osNotification: boolean;
  inAppToast: boolean;
}

interface FieldErrors {
  batchIntervalMin?: string;
  general?: string;
}

const BATCH_MIN = 5;
const BATCH_MAX = 480;

function toForm(p: NotificationPreferenceResponse): FormState {
  return {
    batchIntervalMin: p.batchIntervalMin,
    allowUrgentInFocus: p.allowUrgentInFocus,
    osNotification: p.osNotification,
    inAppToast: p.inAppToast,
  };
}

function isEqual(a: FormState, b: FormState): boolean {
  return (
    a.batchIntervalMin === b.batchIntervalMin &&
    a.allowUrgentInFocus === b.allowUrgentInFocus &&
    a.osNotification === b.osNotification &&
    a.inAppToast === b.inAppToast
  );
}

export const NotificationPreferenceSection: React.FC = () => {
  const [pref, setPref] = useState<NotificationPreferenceResponse | null>(null);
  const [form, setForm] = useState<FormState | null>(null);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchNotificationPreference()
      .then((p) => {
        if (cancelled) return;
        setPref(p);
        setForm(toForm(p));
      })
      .catch(() => setErrors({ general: "알림 설정을 불러오지 못했어요." }))
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!savedAt) return;
    const t = setTimeout(() => setSavedAt(null), 2000);
    return () => clearTimeout(t);
  }, [savedAt]);

  const isDirty = useMemo(() => {
    if (!pref || !form) return false;
    return !isEqual(form, toForm(pref));
  }, [form, pref]);

  const validate = (next: FormState): boolean => {
    const errs: FieldErrors = {};
    if (
      !Number.isInteger(next.batchIntervalMin) ||
      next.batchIntervalMin < BATCH_MIN ||
      next.batchIntervalMin > BATCH_MAX
    ) {
      errs.batchIntervalMin = `${BATCH_MIN}분에서 ${BATCH_MAX}분 사이로 입력해주세요.`;
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!form || !validate(form) || !isDirty) return;
    setIsSaving(true);
    setErrors({});
    try {
      const res = await updateNotificationPreference(form);
      setPref(res);
      setForm(toForm(res));
      setSavedAt(Date.now());
    } catch {
      setErrors({ general: "저장에 실패했어요. 잠시 후 다시 시도해주세요." });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <section className="rounded-xl border border-[var(--gray-200)] bg-white p-6">
        <div className="h-12 animate-pulse rounded bg-[var(--gray-100)]" />
      </section>
    );
  }

  if (!form) {
    return (
      <section className="rounded-xl border border-[var(--gray-200)] bg-white p-6">
        <p className="text-[13px] text-[var(--danger)]">
          {errors.general ?? "알림 설정을 불러올 수 없어요."}
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-[var(--gray-200)] bg-white p-6">
      <header className="mb-5">
        <h2 className="text-[16px] font-bold text-[var(--gray-900)]">
          알림 환경설정
        </h2>
        <p className="mt-1 text-[13px] text-[var(--gray-500)]">
          집중 모드와 알림 모음 주기를 설정하세요.
        </p>
      </header>

      <div className="flex flex-col gap-5">
        <div>
          <label className="block text-[13px] font-semibold text-[var(--gray-700)] mb-2">
            모아서 알림 주기 (분)
          </label>
          <input
            type="number"
            min={BATCH_MIN}
            max={BATCH_MAX}
            value={form.batchIntervalMin}
            onChange={(e) =>
              setForm((s) =>
                s
                  ? {
                      ...s,
                      batchIntervalMin:
                        Number.parseInt(e.target.value, 10) || 0,
                    }
                  : s,
              )
            }
            className="h-12 w-32 rounded-md border border-[var(--gray-200)] bg-[var(--bg-surface)] px-4 text-[15px] focus:border-[var(--brand-primary)] focus:outline-none"
          />
          <p className="mt-1.5 text-[12px] text-[var(--gray-500)]">
            업무 중에는 일반 메시지를 모아 한 번에 알립니다. ({BATCH_MIN}~
            {BATCH_MAX}분)
          </p>
          {errors.batchIntervalMin && (
            <p className="mt-1.5 text-xs text-[var(--danger)] px-0.5">
              {errors.batchIntervalMin}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-3 pt-2">
          <Toggle
            checked={form.allowUrgentInFocus}
            onChange={(v) =>
              setForm((s) => (s ? { ...s, allowUrgentInFocus: v } : s))
            }
            label="집중 모드에서 급함 알림 허용"
            description="끄면 집중 중에는 급함 메시지도 따라잡기 피드로 보류됩니다."
          />
          <Toggle
            checked={form.osNotification}
            onChange={(v) =>
              setForm((s) => (s ? { ...s, osNotification: v } : s))
            }
            label="OS 데스크톱 알림"
            description="브라우저/OS 시스템 트레이로 알림이 표시됩니다."
          />
          <Toggle
            checked={form.inAppToast}
            onChange={(v) => setForm((s) => (s ? { ...s, inAppToast: v } : s))}
            label="앱 내 토스트 표시"
            description="화면 하단에 짧게 새 알림 미리보기가 뜹니다."
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
