import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Card } from "./index";
import { Toggle } from "../Toggle";
import { Avatar } from "../Avatar";

/**
 * Card 컴포넌트는 설정, 친구 관리, 그룹화된 정보를 담는 컨테이너입니다.
 *
 * - `Card.Item`: 내부 아이템들을 구분선과 함께 배치할 수 있습니다 (04, 13 프로토타입 참고).
 * - `title`: 카드 상단에 그룹 이름을 표시할 수 있습니다.
 */
const meta: Meta<typeof Card> = {
  title: "Components/Card",
  component: Card,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Card>;

export const SettingsGroup: Story = {
  render: () => (
    <Card title="일반 설정" variant="outline" padding="none">
      <Card.Item>
        <Toggle
          checked={true}
          onChange={() => {}}
          label="다크 모드 사용"
          description="시스템 설정에 맞춥니다."
        />
      </Card.Item>
      <Card.Item>
        <Toggle checked={false} onChange={() => {}} label="알림 소리" />
      </Card.Item>
      <Card.Item showDivider={false}>
        <div className="flex justify-between items-center px-1 py-1">
          <span className="text-[15px]">언어 설정</span>
          <span className="text-[13px] text-(--gray-500)">한국어</span>
        </div>
      </Card.Item>
    </Card>
  ),
};

export const RelationshipNorms: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      <Card title="관계 규칙" variant="outline" padding="none">
        <Card.Item>
          <div className="flex items-center justify-between">
            <Avatar name="민수" presence="working" label="민수" />
            <span className="text-[13px] text-(--brand-primary) font-semibold">
              편집
            </span>
          </div>
        </Card.Item>
        <Card.Item showDivider={false}>
          <div className="text-[14px] text-(--gray-600) leading-relaxed">
            민수님과는 업무 시간에만 급한 메시지를 주고받기로 했습니다. 수다
            메시지는 업무 시간 종료 후 전달됩니다.
          </div>
        </Card.Item>
      </Card>
    </div>
  ),
};
