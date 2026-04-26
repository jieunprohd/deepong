import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import Chip from "./index";

/**
 * ## Chip 컴포넌트 가이드
 *
 * 디퐁 시스템에서 필터, 상태 표시, 버튼 보조 등 다양한 용도로 사용되는 다목적 컴포넌트입니다.
 *
 * ### 주요 특징
 * - **Shape**: `filter`, `status`는 완전한 원형(`full`)이며, `tone`, `badge`는 살짝 각진 형태(`md`, 6px)입니다.
 * - **Interactivity**: `onClick` 프롭이 전달되면 자동으로 `cursor-pointer` 및 호버 효과가 적용됩니다.
 * - **Auto-labeling**: `status` 변이의 경우 `presence`와 `statusValue` 조합으로 문구를 자동 생성합니다.
 */
const meta: Meta<typeof Chip> = {
  title: "Components/Chip",
  component: Chip,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["filter", "tone", "badge", "status"],
      description: "칩의 전반적인 스타일 테마를 결정합니다.",
    },
    presence: {
      control: "select",
      options: ["free", "working", "focus", "off"],
      description: "status 변이에서 아이콘과 색상을 결정합니다.",
    },
  },
};

export default meta;
type Story = StoryObj<typeof Chip>;

/**
 * [Filter] 대화 목록 상단 필터링에 사용됩니다. (완전 원형)
 */
export const Filter: Story = {
  args: {
    variant: "filter",
    label: "전체",
    active: true,
    onClick: () => {},
  },
};

/**
 * [Tone] 메시지 작성 시 톤을 선택하는 버튼입니다. (6px 모서리)
 * 활성화 시 각 톤의 고유 색상과 그림자가 적용됩니다.
 */
export const ToneSelection: Story = {
  render: () => (
    <div className="flex gap-2">
      <Chip
        variant="tone"
        tone="chat"
        label="💬 수다"
        active
        shortcut="⌘1"
        onClick={() => {}}
      />
      <Chip
        variant="tone"
        tone="ask"
        label="🤔 물어봄"
        active
        shortcut="⌘2"
        onClick={() => {}}
      />
      <Chip
        variant="tone"
        tone="urgent"
        label="⚡ 급함"
        active
        shortcut="⌘3"
        onClick={() => {}}
      />
      <Chip
        variant="tone"
        tone="share"
        label="📎 공유"
        active
        shortcut="⌘4"
        onClick={() => {}}
      />
    </div>
  ),
};

/**
 * [Badge] 리스트 아이템이나 피드 카드 내에서 정보를 요약할 때 사용됩니다. (6px 모서리, 소형)
 */
export const Badges: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <Chip variant="badge" label="🤔 2" tone="ask" />
      <Chip variant="badge" label="💬 4" tone="chat" />
      <Chip variant="badge" label="⚡ 1" tone="urgent" />
      <Chip variant="badge" label="📎 7" tone="share" />
    </div>
  ),
};

/**
 * [Status] 유저의 프레즌스 상태를 실시간으로 보여줄 때 사용됩니다. (완전 원형)
 * `statusValue`를 통해 "n분 남음", "시간까지" 문구를 동적으로 생성합니다.
 */
export const StatusPills: Story = {
  render: () => (
    <div className="flex flex-col gap-3">
      <Chip variant="status" presence="focus" statusValue="18" />
      <Chip variant="status" presence="working" statusValue="오후 6:30" />
      <Chip variant="status" presence="free" label="대화 가능" />
      <Chip variant="status" presence="off" label="오프라인" />
    </div>
  ),
};

/**
 * [Shapes] 모서리 형태에 따른 차이를 비교합니다.
 */
export const ShapeComparison: Story = {
  render: () => (
    <div className="flex flex-col gap-4 border p-6 rounded-xl bg-gray-50">
      <div className="flex items-center gap-4">
        <span className="text-xs font-bold text-gray-400 w-24">
          Rounded Full
        </span>
        <Chip variant="filter" label="전체" active />
        <Chip variant="status" presence="free" label="대화 가능" />
      </div>
      <div className="flex items-center gap-4">
        <span className="text-xs font-bold text-gray-400 w-24">
          Rounded MD (6px)
        </span>
        <Chip variant="tone" tone="chat" label="💬 수다" active />
        <Chip variant="badge" label="🤔 2" tone="ask" />
      </div>
    </div>
  ),
};
