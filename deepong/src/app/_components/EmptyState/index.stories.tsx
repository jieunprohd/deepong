import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import EmptyState from "./index";

const meta: Meta<typeof EmptyState> = {
  title: "Components/EmptyState",
  component: EmptyState,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: [
        "connect",
        "celebrate",
        "quiet",
        "no-search",
        "empty-feed",
        "offline",
      ],
    },
  },
};

export default meta;
type Story = StoryObj<typeof EmptyState>;

/**
 * 기본 사용법: variant만 넘기면 기본 텍스트가 적용됩니다.
 */
export const Default: Story = {
  args: {
    variant: "connect",
    action: {
      label: "초대 링크 만들기",
      onClick: () => alert("Invite clicked"),
    },
  },
};

/**
 * 텍스트 수정: title이나 description을 직접 넘기면 기본값이 덮어씌워집니다.
 */
export const Customized: Story = {
  args: {
    variant: "no-search",
    title: "검색 결과가 하나도 없어요!",
    description: "다른 검색어를 입력하거나 필터를 초기화 해주세요.",
    secondaryAction: {
      label: "필터 초기화",
      onClick: () => alert("Reset clicked"),
    },
  },
};

export const Celebrate: Story = {
  args: {
    variant: "celebrate",
  },
};

export const Quiet: Story = {
  args: {
    variant: "quiet",
  },
};

export const Offline: Story = {
  args: {
    variant: "offline",
  },
};

export const AllVariants: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-5 max-w-[1000px]">
      <div className="flex flex-col gap-2">
        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider px-1">
          기본 (Connect)
        </span>
        <EmptyState
          variant="connect"
          action={{ label: "초대 링크 만들기", onClick: () => {} }}
        />
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider px-1">
          기본 (Celebrate)
        </span>
        <EmptyState variant="celebrate" />
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider px-1">
          기본 (Quiet)
        </span>
        <EmptyState variant="quiet" />
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider px-1">
          기본 (No Search)
        </span>
        <EmptyState
          variant="no-search"
          secondaryAction={{ label: "필터 초기화", onClick: () => {} }}
        />
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider px-1">
          기본 (Empty Feed)
        </span>
        <EmptyState
          variant="empty-feed"
          secondaryAction={{ label: "전체 보기", onClick: () => {} }}
        />
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider px-1">
          기본 (Offline)
        </span>
        <EmptyState variant="offline" />
      </div>
    </div>
  ),
};
