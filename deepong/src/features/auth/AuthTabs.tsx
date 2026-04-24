"use client";

import type {AuthTab} from "./types";

type AuthTabsProps = {
    value: AuthTab;
    onChange: (tab: AuthTab) => void;
};

export function AuthTabs({value, onChange}: AuthTabsProps) {
    return (
        <div className="mb-7 flex gap-1 rounded-md bg-gray-100 p-1">
            <TabButton active={value === "login"} onClick={() => onChange("login")}>
                로그인
            </TabButton>
            <TabButton active={value === "signup"} onClick={() => onChange("signup")}>
                회원가입
            </TabButton>
        </div>
    );
}

type TabButtonProps = {
    active: boolean;
    onClick: () => void;
    children: React.ReactNode;
};

function TabButton({active, onClick, children}: TabButtonProps) {
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
