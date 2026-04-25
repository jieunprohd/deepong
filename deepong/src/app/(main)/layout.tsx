"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { useEffect } from "react";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading, isAuthenticated, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/auth");
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-sm text-gray-400">로딩 중...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col">
      {/* 헤더 */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-gray-200 px-6">
        <h1 className="text-lg font-bold tracking-tight">디퐁</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600">{user!.nickname}</span>
          <button
            onClick={logout}
            className="rounded-md px-3 py-1.5 text-sm text-gray-500 transition-colors hover:bg-gray-100"
          >
            로그아웃
          </button>
        </div>
      </header>

      {/* 메인 */}
      <main className="flex flex-1 overflow-hidden">
        {/* 사이드바 */}
        <aside className="flex w-64 flex-col border-r border-gray-200 bg-gray-50">
          <div className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand text-sm font-semibold text-white">
                {user!.nickname[0]}
              </div>
              <div>
                <p className="text-sm font-medium">{user!.nickname}</p>
                <p className="text-xs text-gray-400">@{user!.handle}</p>
              </div>
            </div>
          </div>

          <nav className="flex-1 px-2">
            <p className="px-3 py-6 text-center text-xs text-gray-400">
              대화 목록이 여기에 표시됩니다
            </p>
          </nav>
        </aside>

        {/* 컨텐츠 영역 */}
        <section className="flex flex-1 items-center justify-center bg-white">
          {children}
        </section>
      </main>
    </div>
  );
}
