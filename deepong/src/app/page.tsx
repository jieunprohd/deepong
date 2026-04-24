"use client";

import { useState } from "react";

type AuthTab = "login" | "signup";

export default function LoginPage() {
  const [tab, setTab] = useState<AuthTab>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nickname, setNickname] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("submit", { tab, email, password, nickname });
  };

  return (
    <main className="flex min-h-screen items-stretch bg-gray-100">
      <BrandPanel />
      <section className="flex w-full max-w-[480px] flex-col justify-center px-14 py-16 bg-white">
        <header className="mb-10">
          <h1 className="text-[26px] font-bold tracking-[-0.025em] mb-2">
            {tab === "login" ? "다시 만나서 반가워요" : "딥워크에 오신 걸 환영해요"}
          </h1>
          <p className="text-sm text-gray-600">
            {tab === "login"
              ? "이메일로 이어가거나 소셜 계정으로 시작하세요"
              : "이메일로 가입하거나 소셜 계정으로 시작하세요"}
          </p>
        </header>

        <div className="mb-7 flex gap-1 rounded-md bg-gray-100 p-1">
          <TabButton active={tab === "login"} onClick={() => setTab("login")}>
            로그인
          </TabButton>
          <TabButton active={tab === "signup"} onClick={() => setTab("signup")}>
            회원가입
          </TabButton>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-[14px]">
          {tab === "signup" && (
            <Field label="닉네임">
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="친구에게 보여질 이름"
                className="h-12 w-full rounded-md border border-gray-200 px-4 text-[15px] transition-colors focus:border-brand focus:outline-none"
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
              className="h-12 w-full rounded-md border border-gray-200 px-4 text-[15px] transition-colors focus:border-brand focus:outline-none"
            />
          </Field>

          <Field
            label="비밀번호"
            help={
              tab === "login" ? (
                <>
                  비밀번호를 잊으셨나요?{" "}
                  <a href="#" className="font-semibold text-brand">
                    재설정
                  </a>
                </>
              ) : (
                "8자 이상, 영문/숫자/특수문자 중 2종 이상"
              )
            }
          >
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete={tab === "login" ? "current-password" : "new-password"}
              className="h-12 w-full rounded-md border border-gray-200 px-4 text-[15px] transition-colors focus:border-brand focus:outline-none"
            />
          </Field>

          <button
            type="submit"
            className="mt-2 h-13 min-h-13 w-full rounded-md bg-brand text-[15px] font-semibold text-white transition-colors hover:bg-brand-hover"
            style={{ height: 52 }}
          >
            {tab === "login" ? "로그인" : "가입하고 시작하기"}
          </button>
        </form>

        <div className="my-6 flex items-center gap-3 text-xs text-gray-400">
          <div className="h-px flex-1 bg-gray-200" />
          <span>또는</span>
          <div className="h-px flex-1 bg-gray-200" />
        </div>

        <div className="flex flex-col gap-2">
          <OAuthButton variant="kakao">카카오로 계속하기</OAuthButton>
          <OAuthButton variant="google">Google로 계속하기</OAuthButton>
        </div>

        <p className="mt-6 text-center text-sm text-gray-600">
          {tab === "login" ? (
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
          ) : (
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
          )}
        </p>
      </section>
    </main>
  );
}

function TabButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex h-9 flex-1 items-center justify-center rounded-sm text-sm font-semibold transition-all ${
        active
          ? "bg-white text-gray-900 shadow-xs"
          : "text-gray-600 hover:text-gray-800"
      }`}
    >
      {children}
    </button>
  );
}

function Field({
  label,
  help,
  children,
}: {
  label: string;
  help?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-[13px] font-semibold text-gray-700">
        {label}
      </label>
      {children}
      {help && <p className="mt-1.5 text-xs text-gray-500">{help}</p>}
    </div>
  );
}

function OAuthButton({
  variant,
  children,
}: {
  variant: "kakao" | "google";
  children: React.ReactNode;
}) {
  const base =
    "h-12 rounded-md flex items-center justify-center gap-2.5 text-sm font-medium transition-colors";
  const styles =
    variant === "kakao"
      ? "bg-[#FEE500] text-[#181600] hover:bg-[#F6D900]"
      : "bg-white border border-gray-200 text-gray-800 hover:bg-gray-50";

  return (
    <button type="button" className={`${base} ${styles}`}>
      {children}
    </button>
  );
}

function BrandPanel() {
  return (
    <section
      className="relative hidden flex-1 flex-col justify-between overflow-hidden p-14 text-white md:flex"
      style={{
        background: "linear-gradient(155deg, #2F6BFF 0%, #1F4FD9 100%)",
      }}
    >
      <div className="pointer-events-none absolute -right-24 -top-24 h-[400px] w-[400px] rounded-full bg-white/5" />
      <div className="pointer-events-none absolute -bottom-20 -left-10 h-60 w-60 rounded-full bg-white/5" />

      <div className="relative flex items-center gap-2 text-sm font-bold opacity-90">
        <span className="inline-block h-2 w-2 rounded-full bg-white" />
        딥워크
      </div>

      <div className="relative">
        <h2 className="mb-4 text-[36px] font-bold leading-[1.25] tracking-[-0.03em]">
          알림이 나를
          <br />
          방해하지 않는
          <br />
          메신저
        </h2>
        <p className="text-base leading-relaxed opacity-85">
          메시지는 언제든, 알림은 적절할 때.
          <br />
          집중과 연결이 공존하는 공간.
        </p>
      </div>

      <div className="relative rounded-md border border-white/15 bg-white/10 px-5 py-4 backdrop-blur">
        <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.06em] opacity-70">
          DEEPWORK 원칙
        </div>
        <div className="text-sm leading-relaxed">
          친구가 집중 중일 때, 수다는 조용히 기다립니다. 급할 때만 알림이
          갑니다.
        </div>
      </div>
    </section>
  );
}
