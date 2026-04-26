import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Avatar } from "./index";
import Chip from "../Chip";

/**
 * ## Avatar 컴포넌트 가이드
 *
 * 디퐁 메신저의 모든 유저 정보 레이아웃을 담당하는 핵심 컴포넌트입니다.
 *
 * ### 주요 기능
 * - **Auto-fallback**: `profile` 이미지가 없으면 `name`의 첫 글자를 자동으로 추출하여 배경색이 있는 아바타를 생성합니다.
 * - **Presence**: 유저의 상태(`free`, `working`, `focus`, `off`)를 색상과 하단 점(Dot)으로 표현합니다.
 * - **Flexible subLabel**: `subLabel` 프롭을 통해 이름 아래에 텍스트나 뱃지(Chip) 등을 자유롭게 배치할 수 있습니다.
 * - **Group Mode**: `participantCount`가 3 이상이면 아바타 대신 인원수 숫자가 표시됩니다.
 */
const meta: Meta<typeof Avatar> = {
  title: "Components/Avatar",
  component: Avatar,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    presence: {
      control: "select",
      options: ["free", "working", "focus", "off", undefined],
    },
    size: {
      control: "select",
      options: ["sm", "md", "lg", "xl", "2xl"],
    },
    color: {
      control: "select",
      options: ["amber", "green", "purple", "pink", "gray", "blue"],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Avatar>;

/**
 * [기본] 프로필 이미지와 프레즌스만 있는 아바타 원형 모드입니다.
 */
export const OnlyAvatar: Story = {
  args: {
    name: "Oscar",
    profile:
      "https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100",
    presence: "free",
    size: "lg",
  },
};

/**
 * [Selected] 대화방이 선택된 상태의 스타일입니다.
 */
export const Selected: Story = {
  args: {
    name: "민수",
    color: "amber",
    presence: "working",
    lastMessage: "오늘 저녁 약속 가능해?",
    isActive: true,
  },
};

/**
 * [Custom subLabel] subLabel을 사용하여 이름 아래에 뱃지(Chip)를 넣은 예시입니다.
 */
export const WithChips: Story = {
  args: {
    name: "민수",
    color: "amber",
    presence: "working",
    time: "오전 9:24",
    subLabel: (
      <div className="flex items-center gap-1">
        <Chip variant="badge" tone="ask" label="🤔 2" />
        <Chip variant="badge" label="💬 4" />
      </div>
    ),
  },
};

/**
 * [Fallback] 이미지가 없을 때 이름 첫 글자가 자동으로 추출되어 적용된 모습입니다.
 */
export const FallbackMode: Story = {
  args: {
    name: "지은",
    color: "green",
    presence: "free",
    size: "md",
  },
};

/**
 * [Group] 3인 이상의 그룹 채팅방 인원수 표시 모드입니다.
 */
export const GroupChat: Story = {
  args: {
    name: "디퐁 개발팀",
    participantCount: 12,
    roomType: "개발팀 공지",
    time: "어제",
    subLabel: "지훈: 새로운 업데이트 내용 공유드립니다.",
    color: "gray",
  },
};

/**
 * [Brand Profile] 시스템 브랜드 컬러가 적용된 본인 프로필 스타일입니다.
 */
export const BrandProfile: Story = {
  args: {
    name: "Oscar",
    color: "blue",
    presence: "focus",
    size: "lg",
  },
};

/**
 * [Sizes] 시스템에서 제공하는 5가지 사이즈 비교입니다.
 */
export const SizeComparison: Story = {
  render: () => (
    <div className="flex items-end gap-6">
      <Avatar name="Small" size="sm" presence="free" color="green" />
      <Avatar name="Medium" size="md" presence="working" color="amber" />
      <Avatar name="Large" size="lg" presence="focus" color="blue" />
      <Avatar name="XLarge" size="xl" presence="off" color="purple" />
      <Avatar name="2XLarge" size="2xl" presence="free" color="pink" />
    </div>
  ),
};
