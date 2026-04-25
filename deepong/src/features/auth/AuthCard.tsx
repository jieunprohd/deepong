"use client";

import {useState} from "react";
import {useRouter} from "next/navigation";
import {AuthTabs} from "./AuthTabs";
import {Field} from "./Field";
import {OAuthSection} from "./OAuthSection";
import type {AuthTab} from "./types";

const API_BASE = "http://localhost:4000/api/v1";

const INPUT_CLASS =
    "h-12 w-full rounded-md border border-gray-200 px-4 text-[15px] transition-colors focus:border-brand focus:outline-none";

export function AuthCard() {
    const router = useRouter();
    const [tab, setTab] = useState<AuthTab>("login");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [nickname, setNickname] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const isSignup = tab === "signup";

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const url = isSignup ? `${API_BASE}/auth/signup` : `${API_BASE}/auth/login`;
            const body = isSignup
                ? {email, password, nickname}
                : {email, password};

            const res = await fetch(url, {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify(body),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.message ?? "요청에 실패했습니다.");
                return;
            }

            localStorage.setItem("accessToken", data.accessToken);
            localStorage.setItem("refreshToken", data.refreshToken);
            router.replace("/");
        } catch {
            setError("서버에 연결할 수 없습니다.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <section className="flex w-full max-w-[480px] flex-col overflow-y-auto bg-white px-14 py-16">
            <header className="mb-10">
                <h1 className="mb-2 text-[26px] font-bold tracking-[-0.025em]">
                    {isSignup ? "디퐁에 오신 걸 환영해요" : "다시 만나서 반가워요"}
                </h1>
                <p className="text-sm text-gray-600">
                    {isSignup
                        ? "이메일로 가입하거나 소셜 계정으로 시작하세요"
                        : "이메일로 이어가거나 소셜 계정으로 시작하세요"}
                </p>
            </header>

            <AuthTabs value={tab} onChange={setTab}/>

            <form onSubmit={handleSubmit} className="flex flex-col gap-[14px]">
                {isSignup && (
                    <Field label="닉네임">
                        <input
                            type="text"
                            value={nickname}
                            onChange={(e) => setNickname(e.target.value)}
                            placeholder="친구에게 보여질 이름"
                            className={INPUT_CLASS}
                            required
                        />
                    </Field>
                )}

                <Field label="이메일">
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        autoComplete="email"
                        className={INPUT_CLASS}
                        required
                    />
                </Field>

                <Field
                    label="비밀번호"
                    help={
                        isSignup ? (
                            "8자 이상, 영문/숫자/특수문자 중 2종 이상"
                        ) : (
                            <>
                                비밀번호를 잊으셨나요?{" "}
                                <a href="#" className="font-semibold text-brand">
                                    재설정
                                </a>
                            </>
                        )
                    }
                >
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        autoComplete={isSignup ? "new-password" : "current-password"}
                        className={INPUT_CLASS}
                        required
                    />
                </Field>

                {error && (
                    <p className="text-sm text-danger">{error}</p>
                )}

                <button
                    type="submit"
                    disabled={loading}
                    className="mt-2 h-[52px] w-full rounded-md bg-brand text-[15px] font-semibold text-white transition-colors hover:bg-brand-hover disabled:opacity-50"
                >
                    {loading
                        ? "처리 중..."
                        : isSignup
                            ? "가입하고 시작하기"
                            : "로그인"}
                </button>
            </form>

            <OAuthSection/>

            <p className="mt-6 text-center text-sm text-gray-600">
                {isSignup ? (
                    <>
                        이미 계정이 있나요?{" "}
                        <button
                            type="button"
                            onClick={() => setTab("login")}
                            className="font-semibold text-brand"
                        >
                            로그인
                        </button>
                    </>
                ) : (
                    <>
                        아직 계정이 없나요?{" "}
                        <button
                            type="button"
                            onClick={() => setTab("signup")}
                            className="font-semibold text-brand"
                        >
                            가입하기
                        </button>
                    </>
                )}
            </p>
        </section>
    );
}
