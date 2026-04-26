import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Button } from "./index";

const meta: Meta<typeof Button> = {
  title: "Components/Button",
  component: Button,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Primary: Story = {
  args: {
    variant: "primary",
    children: "로그인",
    fullWidth: true,
    size: "lg",
  },
};

export const Secondary: Story = {
  args: {
    variant: "secondary",
    children: "업로드",
    size: "sm",
  },
};

export const Outline: Story = {
  args: {
    variant: "outline",
    children: "Google로 계속하기",
    fullWidth: true,
  },
};

export const Link: Story = {
  args: {
    variant: "link",
    children: "재설정",
  },
};

export const Tertiary: Story = {
  args: {
    variant: "tertiary",
    children: "화",
  },
};
