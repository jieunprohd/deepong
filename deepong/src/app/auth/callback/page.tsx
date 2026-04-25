"use client";

import {useRouter, useSearchParams} from "next/navigation";
import {Suspense, useEffect} from "react";

function CallbackContent() {
    const params = useSearchParams();
    const router = useRouter();

    const accessToken = params.get("accessToken");
    const refreshToken = params.get("refreshToken");

    useEffect(() => {
        if (!accessToken || !refreshToken) return;

        localStorage.setItem("accessToken", accessToken);
        localStorage.setItem("refreshToken", refreshToken);

        window.location.href = "/";
    }, [accessToken, refreshToken, router]);

    if (!accessToken || !refreshToken) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-50">
                <p className="text-sm text-gray-500">로그인 정보가 올바르지 않습니다.</p>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50">
            <p className="text-sm text-gray-500">로그인 중...</p>
        </div>
    );
}

export default function AuthCallbackPage() {
    return (
        <Suspense>
            <CallbackContent/>
        </Suspense>
    );
}
