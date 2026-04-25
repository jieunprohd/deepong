import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Input } from "./index";

const meta: Meta<typeof Input> = {
  title: "Components/Input",
  component: Input,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Input>;

export const Default: Story = {
  args: {
    label: "이메일",
    placeholder: "you@example.com",
    containerClassName: "max-w-[400px]",
  },
};

export const WithError: Story = {
  args: {
    label: "닉네임",
    defaultValue: "중복된닉네임",
    error: "이미 사용 중인 닉네임입니다.",
    containerClassName: "max-w-[400px]",
  },
};

export const WithHelp: Story = {
  args: {
    label: "비밀번호",
    type: "password",
    placeholder: "••••••••",
    help: "8자 이상, 영문/숫자/특수문자 중 2종 이상",
    containerClassName: "max-w-[400px]",
  },
};

export const Disabled: Story = {
  args: {
    label: "아이디 (변경 불가)",
    defaultValue: "deepong_user",
    disabled: true,
    containerClassName: "max-w-[400px]",
  },
};
