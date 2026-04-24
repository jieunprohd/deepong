"use client";

import {useState} from "react";
import {AuthTabs} from "./AuthTabs";
import {Field} from "./Field";
import {OAuthSection} from "./OAuthSection";
import type {AuthTab} from "./types";

const INPUT_CLASS =
    "h-12 w-full rounded-md border border-gray-200 px-4 text-[15px] transition-colors focus:border-brand focus:outline-none";

export function AuthCard() {
    const [tab, setTab] = useState<AuthTab>("login");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [nickname, setNickname] = useState("");

    const isSignup = tab === "signup";

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log("submit", {tab, email, password, nickname});
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
                    />
                </Field>

                <button
                    type="submit"
                    className="mt-2 h-[52px] w-full rounded-md bg-brand text-[15px] font-semibold text-white transition-colors hover:bg-brand-hover"
                >
                    {isSignup ? "가입하고 시작하기" : "로그인"}
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
