"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { createPortal } from "react-dom";
import {
  CheckCircle2,
  AlertCircle,
  Info,
  X,
  AlertTriangle,
} from "lucide-react";

export type ToastTone = "info" | "success" | "warning" | "danger";

export interface ToastOptions {
  /** 본문 메시지 */
  message: React.ReactNode;
  /** 톤 (기본 info) */
  tone?: ToastTone;
  /** 노출 시간 ms (기본 3000, 0이면 자동 닫힘 없음) */
  duration?: number;
  /** 액션 버튼 라벨 + 콜백 */
  action?: { label: string; onClick: () => void };
}

interface ToastInternal extends ToastOptions {
  id: string;
}

interface ToastContextValue {
  show: (opts: ToastOptions) => string;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within <ToastProvider>");
  }
  return ctx;
}

const toneStyles: Record<ToastTone, string> = {
  info: "bg-[var(--gray-900)] text-white",
  success: "bg-[var(--success)] text-white",
  warning: "bg-[var(--warning)] text-white",
  danger: "bg-[var(--danger)] text-white",
};

const ICONS: Record<ToastTone, React.ReactNode> = {
  info: <Info size={16} strokeWidth={2.4} />,
  success: <CheckCircle2 size={16} strokeWidth={2.4} />,
  warning: <AlertTriangle size={16} strokeWidth={2.4} />,
  danger: <AlertCircle size={16} strokeWidth={2.4} />,
};

export interface ToastProviderProps {
  children: React.ReactNode;
  /** 동시에 표시 가능한 최대 토스트 수 (기본 3) */
  maxVisible?: number;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({
  children,
  maxVisible = 3,
}) => {
  const [toasts, setToasts] = useState<ToastInternal[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const show = useCallback(
    (opts: ToastOptions): string => {
      const id =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `toast-${Date.now()}-${Math.random()}`;
      const toast: ToastInternal = {
        id,
        tone: "info",
        duration: 3000,
        ...opts,
      };
      setToasts((prev) => {
        const next = [...prev, toast];
        return next.slice(-maxVisible);
      });
      if (toast.duration && toast.duration > 0) {
        setTimeout(() => dismiss(id), toast.duration);
      }
      return id;
    },
    [dismiss, maxVisible],
  );

  return (
    <ToastContext.Provider value={{ show, dismiss }}>
      {children}
      {mounted &&
        createPortal(
          <div
            aria-live="polite"
            className="pointer-events-none fixed bottom-6 left-1/2 z-[9999] flex -translate-x-1/2 flex-col items-center gap-2"
          >
            {toasts.map((t) => (
              <div
                key={t.id}
                role="status"
                className={`
                  pointer-events-auto flex items-center gap-2.5
                  rounded-[var(--r-md)] px-3.5 py-2.5
                  shadow-[var(--shadow-lg)]
                  text-[13px] font-medium
                  animate-in fade-in slide-in-from-bottom-2 duration-200
                  min-w-[260px] max-w-[420px]
                  ${toneStyles[t.tone ?? "info"]}
                `}
              >
                <span className="shrink-0">{ICONS[t.tone ?? "info"]}</span>
                <span className="flex-1">{t.message}</span>
                {t.action && (
                  <button
                    onClick={() => {
                      t.action?.onClick();
                      dismiss(t.id);
                    }}
                    className="text-[12px] font-bold underline-offset-2 hover:underline shrink-0"
                  >
                    {t.action.label}
                  </button>
                )}
                <button
                  onClick={() => dismiss(t.id)}
                  className="-mr-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-md opacity-70 transition-opacity hover:opacity-100"
                  aria-label="닫기"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>,
          document.body,
        )}
    </ToastContext.Provider>
  );
};
