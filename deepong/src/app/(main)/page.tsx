"use client";

import { useAuth } from "@/lib/auth";

export default function HomePage() {
  const { user } = useAuth();

  return (
    <div className="text-center">
      <p className="text-lg font-medium text-gray-800">
        환영합니다, {user!.nickname}님!
      </p>
      <p className="mt-1 text-sm text-gray-400">
        대화를 시작하려면 친구를 추가하세요
      </p>
      <p classNam="mt-1 text-sm text-gray-400">
        husky test
      </p>
    </div>
  );
}
