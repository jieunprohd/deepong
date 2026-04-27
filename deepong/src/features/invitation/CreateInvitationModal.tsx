"use client";

import React, { useState, useCallback } from "react";
import { Modal } from "@/app/_components/Modal";
import { Button } from "@/app/_components/Button";
import { Toggle } from "@/app/_components/Toggle";
import { Select } from "@/app/_components/Select";
import { Input } from "@/app/_components/Input";
import { TTL_OPTIONS } from "./types";
import { createInvitation } from "./api";
import { Copy, Check, Link } from "lucide-react";

interface CreateInvitationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Step = "form" | "result";

export const CreateInvitationModal: React.FC<CreateInvitationModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [step, setStep] = useState<Step>("form");
  const [singleUse, setSingleUse] = useState(true);
  const [ttlSeconds, setTtlSeconds] = useState(86400);
  const [isLoading, setIsLoading] = useState(false);
  const [inviteUrl, setInviteUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await createInvitation({ singleUse, ttlSeconds });
      setInviteUrl(res.inviteUrl);
      setStep("result");
    } catch {
      setError("링크 생성에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setIsLoading(false);
    }
  }, [singleUse, ttlSeconds]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const input = document.createElement("input");
      input.value = inviteUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [inviteUrl]);

  const handleClose = useCallback(() => {
    onClose();
    // Reset state after close animation
    setTimeout(() => {
      setStep("form");
      setSingleUse(true);
      setTtlSeconds(86400);
      setInviteUrl("");
      setCopied(false);
      setError(null);
    }, 200);
  }, [onClose]);

  const ttlSelectOptions = TTL_OPTIONS.map((opt) => ({
    label: opt.label,
    value: opt.value,
  }));

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="친구 초대">
      {step === "form" ? (
        <div className="flex flex-col gap-5">
          <p className="text-[13px] text-[var(--gray-600)] leading-relaxed">
            초대 링크를 만들어 친구에게 공유하세요.
            <br />
            링크를 받은 친구가 수락하면 바로 연결됩니다.
          </p>

          <Toggle
            checked={singleUse}
            onChange={setSingleUse}
            label="일회용 링크"
            description="한 명만 수락할 수 있는 링크"
          />

          <Select
            label="유효 기간"
            value={ttlSeconds}
            onChange={(e) => setTtlSeconds(Number(e.target.value))}
            options={ttlSelectOptions}
          />

          {error && (
            <p className="text-[13px] text-[var(--danger)]">{error}</p>
          )}

          <Button
            variant="primary"
            fullWidth
            onClick={handleCreate}
            isLoading={isLoading}
            leftIcon={<Link size={16} />}
          >
            초대 링크 만들기
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          <div className="flex flex-col items-center gap-3 py-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--brand-primary-light)]">
              <Link size={22} className="text-[var(--brand-primary)]" />
            </div>
            <p className="text-[13px] text-[var(--gray-600)] text-center">
              링크가 생성되었습니다!
              <br />
              친구에게 공유해보세요.
            </p>
          </div>

          <Input
            readOnly
            value={inviteUrl}
            onClick={(e) => (e.target as HTMLInputElement).select()}
            rightElement={
              <button
                onClick={handleCopy}
                className="text-[var(--gray-400)] hover:text-[var(--brand-primary)] transition-colors"
              >
                {copied ? (
                  <Check size={16} className="text-[var(--success)]" />
                ) : (
                  <Copy size={16} />
                )}
              </button>
            }
          />

          <Button
            variant="primary"
            fullWidth
            onClick={handleCopy}
            leftIcon={
              copied ? <Check size={16} /> : <Copy size={16} />
            }
          >
            {copied ? "복사됨!" : "링크 복사"}
          </Button>

          <Button variant="ghost" fullWidth onClick={handleClose}>
            닫기
          </Button>
        </div>
      )}
    </Modal>
  );
};
