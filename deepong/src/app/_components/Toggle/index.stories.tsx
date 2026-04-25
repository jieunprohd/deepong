import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import React, { useState } from "react";
import { Toggle } from "./index";

const meta: Meta<typeof Toggle> = {
  title: "Components/Toggle",
  component: Toggle,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Toggle>;

/**
 * 실제로 클릭하여 상태를 변경해볼 수 있는 예시입니다.
 */
export const Interactive: Story = {
  render: (args) => {
    const [checked, setChecked] = useState(args.checked);
    return (
      <div className="w-75 border p-4 rounded-lg bg-white">
        <Toggle
          {...args}
          checked={checked}
          onChange={(val) => {
            setChecked(val);
            args.onChange(val);
          }}
        />
        <div className="mt-4 text-sm text-gray-500">
          상태: {checked ? "ON (브랜드 컬러)" : "OFF (회색)"}
        </div>
      </div>
    );
  },
  args: {
    checked: false,
    label: "알림 설정",
    description: "메시지가 오면 알림을 받습니다.",
  },
};

export const Basic: Story = {
  args: {
    checked: true,
    label: "기본 토글",
  },
};

export const Disabled: Story = {
  args: {
    checked: true,
    label: "비활성화 상태",
    disabled: true,
  },
};
