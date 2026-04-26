import React from "react";
import { EmptyStateProps, EmptyStateVariant } from "./types";

const VARIANT_DEFAULTS: Record<
  EmptyStateVariant,
  { title: string; description: string; hint?: string }
> = {
  connect: {
    title: "여기는 아직 너무 조용하네요",
    description:
      "디퐁은 친구 간의 대화 공간이에요.\n한 명만 초대하면 시작할 수 있어요.",
  },
  celebrate: {
    title: "오늘은 다 따라잡았어요 👏",
    description: "놓친 메시지가 없네요.\n새 메시지는 여기로 모일 거예요.",
    hint: "☕ 커피 한 잔 하면서 쉬어가도 좋아요",
  },
  quiet: {
    title: "친구와의 첫 대화를 시작해보세요",
    description:
      "톤 태그를 고르면 상대방에게 알림이 어떻게 갈지\n미리 알려드릴게요.",
    hint: "💡 Cmd+1~4 로 톤을 빠르게 바꿀 수 있어요",
  },
  "no-search": {
    title: "검색 결과가 없어요",
    description: "다른 단어로 검색해보거나, 필터를\n전체로 바꿔보세요.",
  },
  "empty-feed": {
    title: '"놓친 것" 필터에 해당하는 대화가 없어요',
    description:
      '모든 대화를 이미 읽으셨네요.\n"전체" 탭에서 대화를 이어가보세요.',
  },
  offline: {
    title: "인터넷 연결이 끊겼어요",
    description:
      "지금 작성한 메시지는 로컬에 저장되었다가\n연결되면 자동으로 전송될 거예요.",
    hint: "🔄 3초마다 재연결 시도 중",
  },
};

const EmptyState: React.FC<EmptyStateProps> = ({
  variant,
  title,
  description,
  action,
  secondaryAction,
  hint,
  className = "",
}) => {
  // 프롭으로 넘어온 값이 없으면 기본값 사용
  const finalTitle = title ?? VARIANT_DEFAULTS[variant].title;
  const finalDescription = description ?? VARIANT_DEFAULTS[variant].description;
  const finalHint = hint ?? VARIANT_DEFAULTS[variant].hint;

  const getIllustration = (v: EmptyStateVariant) => {
    switch (v) {
      case "connect":
        return (
          <svg className="w-full h-full" viewBox="0 0 120 120" fill="none">
            <circle cx="60" cy="60" r="55" fill="#EAF0FF" />
            <circle cx="42" cy="52" r="14" fill="#2F6BFF" />
            <circle cx="42" cy="52" r="10" fill="#fff" />
            <text
              x="42"
              y="57"
              textAnchor="middle"
              fontSize="14"
              fontWeight="700"
              fill="#2F6BFF"
            >
              나
            </text>
            <path
              d="M56 52 L74 52"
              stroke="#2F6BFF"
              strokeWidth="2"
              strokeDasharray="3 3"
            />
            <circle
              cx="88"
              cy="52"
              r="14"
              fill="#fff"
              stroke="#2F6BFF"
              strokeWidth="2"
              strokeDasharray="3 3"
            />
            <text
              x="88"
              y="57"
              textAnchor="middle"
              fontSize="18"
              fontWeight="700"
              fill="#2F6BFF"
            >
              ?
            </text>
            <path
              d="M60 78 Q60 90 48 92"
              stroke="#85B7EB"
              strokeWidth="2"
              fill="none"
            />
            <path
              d="M60 78 Q60 90 72 92"
              stroke="#85B7EB"
              strokeWidth="2"
              fill="none"
            />
          </svg>
        );
      case "celebrate":
        return (
          <svg className="w-full h-full" viewBox="0 0 120 120" fill="none">
            <circle cx="60" cy="60" r="55" fill="#E6F9F1" />
            <circle cx="60" cy="55" r="30" fill="#00C471" />
            <path
              d="M46 56 L55 66 L76 44"
              stroke="white"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="28" cy="38" r="3" fill="#00C471" fillOpacity="0.5" />
            <circle cx="95" cy="28" r="4" fill="#00C471" fillOpacity="0.4" />
            <circle cx="100" cy="80" r="2.5" fill="#00C471" fillOpacity="0.6" />
            <circle cx="22" cy="85" r="3.5" fill="#00C471" fillOpacity="0.4" />
          </svg>
        );
      case "quiet":
        return (
          <svg className="w-full h-full" viewBox="0 0 120 120" fill="none">
            <rect
              x="25"
              y="35"
              width="55"
              height="32"
              rx="12"
              fill="#A78BFA"
              fillOpacity="0.15"
            />
            <rect x="20" y="38" width="55" height="30" rx="12" fill="#A78BFA" />
            <circle cx="35" cy="53" r="2.5" fill="white" />
            <circle cx="47" cy="53" r="2.5" fill="white" />
            <circle cx="59" cy="53" r="2.5" fill="white" />
            <path
              d="M30 68 L20 80"
              stroke="#A78BFA"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <rect x="55" y="70" width="40" height="22" rx="10" fill="#F0EAFF" />
            <circle cx="95" cy="82" r="2" fill="#A78BFA" />
          </svg>
        );
      case "no-search":
        return (
          <svg className="w-full h-full" viewBox="0 0 120 120" fill="none">
            <circle
              cx="52"
              cy="52"
              r="28"
              fill="none"
              stroke="#B0B8C1"
              strokeWidth="4"
            />
            <circle cx="52" cy="52" r="20" fill="#F2F4F6" />
            <path
              d="M74 74 L94 94"
              stroke="#B0B8C1"
              strokeWidth="4"
              strokeLinecap="round"
            />
            <path
              d="M42 52 L62 52"
              stroke="#B0B8C1"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </svg>
        );
      case "empty-feed":
        return (
          <svg className="w-full h-full" viewBox="0 0 120 120" fill="none">
            <rect x="25" y="30" width="70" height="60" rx="8" fill="#FFF4E5" />
            <rect x="33" y="42" width="40" height="3" rx="1.5" fill="#F5C265" />
            <rect
              x="33"
              y="50"
              width="54"
              height="3"
              rx="1.5"
              fill="#F5C265"
              fillOpacity="0.6"
            />
            <rect
              x="33"
              y="58"
              width="30"
              height="3"
              rx="1.5"
              fill="#F5C265"
              fillOpacity="0.4"
            />
            <circle cx="90" cy="38" r="10" fill="#F59E0B" />
            <path
              d="M86 38 L89 41 L94 35"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        );
      case "offline":
        return (
          <svg className="w-full h-full" viewBox="0 0 120 120" fill="none">
            <circle cx="60" cy="60" r="55" fill="#F2F4F6" />
            <path
              d="M32 62 Q60 42 88 62"
              stroke="#8B95A1"
              strokeWidth="3"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M42 72 Q60 58 78 72"
              stroke="#8B95A1"
              strokeWidth="3"
              strokeLinecap="round"
              fill="none"
            />
            <circle cx="60" cy="82" r="4" fill="#8B95A1" />
            <path
              d="M28 28 L92 92"
              stroke="#F04452"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </svg>
        );
      default:
        return null;
    }
  };

  const getBgClass = (v: EmptyStateVariant) => {
    switch (v) {
      case "connect":
        return "bg-gradient-to-br from-[#EAF0FF] to-white";
      case "celebrate":
        return "bg-gradient-to-br from-[#F0FFF7] to-white";
      case "quiet":
        return "bg-gradient-to-br from-[#F8F5FF] to-white";
      case "no-search":
        return "bg-gradient-to-br from-[#F9FAFB] to-white";
      case "empty-feed":
        return "bg-gradient-to-br from-[#FFF4E5] to-white";
      case "offline":
        return "bg-gradient-to-br from-[#F9FAFB] to-white";
      default:
        return "bg-white";
    }
  };

  return (
    <div
      className={`flex flex-col items-center justify-center p-10 text-center min-h-[360px] rounded-2xl border border-gray-200 ${getBgClass(variant)} ${className}`}
    >
      <div className="w-[120px] h-[120px] mb-5 relative">
        {getIllustration(variant)}
      </div>
      <h3 className="text-[17px] font-bold tracking-tight mb-[6px] text-gray-900">
        {finalTitle}
      </h3>
      <p className="text-[13px] text-gray-600 leading-relaxed max-w-[320px] mb-5 whitespace-pre-wrap">
        {finalDescription}
      </p>

      {(action || secondaryAction) && (
        <div className="flex gap-2">
          {action && (
            <button
              onClick={action.onClick}
              className="inline-flex items-center gap-[6px] px-[18px] py-[10px] bg-[#2F6BFF] hover:bg-[#1F5AEB] text-white rounded-xl text-[13px] font-semibold transition-colors"
            >
              {action.label}
            </button>
          )}
          {secondaryAction && (
            <button
              onClick={secondaryAction.onClick}
              className="inline-flex items-center gap-[6px] px-[18px] py-[10px] bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-[13px] font-semibold transition-colors"
            >
              {secondaryAction.label}
            </button>
          )}
        </div>
      )}

      {finalHint && (
        <div className="mt-[14px] px-3 py-[6px] bg-white/80 backdrop-blur-[4px] rounded-full text-[11px] text-gray-700 font-medium">
          {finalHint}
        </div>
      )}
    </div>
  );
};

export default EmptyState;
