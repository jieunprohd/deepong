import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import React from "react";
import { Avatar } from "./index";

/**
 * ## Avatar 컴포넌트 가이드
 *
 * 디퐁 메신저의 모든 유저 정보 레이아웃을 담당하는 핵심 컴포넌트입니다.
 *
 * ### 주요 기능
 * - **Fallback**: `profile` 이미지가 없으면 `name`의 첫 글자를 따서 자동으로 배경색이 있는 아바타를 생성합니다.
 * - **Presence**: 유저의 상태(`free`, `working`, `focus`, `off`)를 색상과 하단 점(Dot)으로 표현합니다.
 * - **Group Mode**: `participantCount`가 3 이상이면 아바타 대신 인원수 숫자가 표시됩니다.
 * - **Complex Layout**: `label`, `subLabel`, `time`, `roomType` 중 하나라도 입력되면 리스트 형태의 가로 레이아웃이 활성화됩니다.
 */
const meta: Meta<typeof Avatar> = {
  title: "Components/Avatar",
  component: Avatar,
  tags: ["autodocs"],
  argTypes: {
    presence: {
      control: "select",
      options: ["free", "working", "focus", "off", undefined],
    },
    size: {
      control: "select",
      options: ["sm", "md", "lg", "xl"],
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
 * [No Presence] 상태 표시(점, 배경색)가 없는 순수 이미지 모드입니다.
 */
export const NoPresence: Story = {
  args: {
    name: "이지연",
    profile:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100",
    size: "md",
  },
};

/**
 * [Fallback] 이미지가 없을 때 이름 첫 글자와 상태별 배경색이 적용된 모습입니다.
 */
export const FallbackMode: Story = {
  args: {
    name: "민수",
    presence: "working",
    size: "md",
  },
};

/**
 * [Text Layout] 이름과 소속 정보(roomType)만 표시하는 검색 결과 스타일입니다.
 */
export const SearchResult: Story = {
  args: {
    name: "민수",
    roomType: "1:1",
    presence: "free",
  },
};

/**
 * [Catchup] 홈 화면 리스트에 사용되는 시간과 상태 칩이 포함된 복합 레이아웃입니다.
 */
export const ListWithMeta: Story = {
  args: {
    name: "민수",
    presence: "working",
    time: "오전 9:24",
    subLabel: (
      <div className="flex gap-1">
        <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-[var(--gray-100)] text-[11px] font-bold shrink-0">
          🤔 2
        </span>
        <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-[var(--gray-100)] text-[11px] font-bold shrink-0">
          💬 4
        </span>
      </div>
    ),
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
  },
};

/**
 * [Sizes] 시스템에서 제공하는 4가지 사이즈 비교입니다.
 */
export const SizeComparison: Story = {
  render: () => (
    <div className="flex items-end gap-6">
      <Avatar name="Small" size="sm" presence="free" />
      <Avatar name="Medium" size="md" presence="working" />
      <Avatar name="Large" size="lg" presence="focus" />
      <Avatar name="XLarge" size="xl" presence="off" />
    </div>
  ),
};
