"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { Step1Profile } from "./_steps/Step1Profile";
import { Step2Friends } from "./_steps/Step2Friends";
import { Step3Norms } from "./_steps/Step3Norms";

function onboardingKey(userId: string) {
  return `deepong-onboarding-${userId}`;
}

export default function OnboardingPage() {
  const { user, workspace, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(1);

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      router.replace("/auth");
      return;
    }
    if (user && localStorage.getItem(onboardingKey(user.id)) === "done") {
      router.replace("/");
    }
  }, [isLoading, isAuthenticated, user, router]);

  const markDone = () => {
    if (user) {
      localStorage.setItem(onboardingKey(user.id), "done");
    }
    router.replace("/");
  };

  if (isLoading || !isAuthenticated || !user) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#f2f4f6]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--brand-primary)] border-t-transparent" />
      </div>
    );
  }

  const progress = (step / 3) * 100;

  return (
    <div className="flex h-screen items-center justify-center bg-[#f2f4f6] p-10">
      <div className="relative flex h-[720px] w-[720px] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* Progress bar */}
        <div className="h-[3px] w-full bg-[#f2f4f6]">
          <div
            className="h-full bg-[var(--brand-primary)] transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Step content */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {step === 1 && (
            <Step1Profile user={user} workspace={workspace} onNext={() => setStep(2)} />
          )}
          {step === 2 && (
            <Step2Friends onNext={() => setStep(3)} onPrev={() => setStep(1)} />
          )}
          {step === 3 && (
            <Step3Norms onComplete={markDone} onPrev={() => setStep(2)} />
          )}
        </div>
      </div>
    </div>
  );
}
