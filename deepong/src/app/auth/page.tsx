"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { AuthCard } from "@/features/auth/AuthCard";
import { BrandPanel } from "@/features/auth/BrandPanel";

export default function AuthPage() {
  const { isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-sm text-gray-400">로딩 중...</p>
      </div>
    );
  }

  if (isAuthenticated) {
    router.replace("/");
    return null;
  }

  return (
    <main className="flex h-screen items-stretch bg-gray-100">
      <BrandPanel />
      <AuthCard />
    </main>
  );
}
