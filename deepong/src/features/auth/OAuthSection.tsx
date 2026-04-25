export function OAuthSection() {
    return (
        <>
            <div className="my-6 flex items-center gap-3 text-xs text-gray-400">
                <div className="h-px flex-1 bg-gray-200"/>
                <span>또는</span>
                <div className="h-px flex-1 bg-gray-200"/>
            </div>

            <div className="flex flex-col gap-2">
                <OAuthButton variant="kakao">카카오로 계속하기</OAuthButton>
                <OAuthButton variant="google">Google로 계속하기</OAuthButton>
            </div>
        </>
    );
}

type OAuthVariant = "kakao" | "google";

const OAUTH_STYLES: Record<OAuthVariant, string> = {
    kakao: "bg-[#FEE500] text-[#181600] hover:bg-[#F6D900]",
    google: "bg-white border border-gray-200 text-gray-800 hover:bg-gray-50",
};

type OAuthButtonProps = {
    variant: OAuthVariant;
    children: React.ReactNode;
};

const OAUTH_URLS: Record<OAuthVariant, string> = {
        google: "http://localhost:4000/api/v1/auth/google",
        kakao: "http://localhost:4000/api/v1/auth/kakao",
    };

function OAuthButton({variant, children}: OAuthButtonProps) {
    const handleClick = () => {
        window.location.href = OAUTH_URLS[variant];
    };

    return (
        <button
            type="button"
            onClick={handleClick}
            className={`flex h-12 items-center justify-center gap-2.5 rounded-md text-sm font-medium transition-colors ${OAUTH_STYLES[variant]}`}
        >
            {children}
        </button>
    );
}
