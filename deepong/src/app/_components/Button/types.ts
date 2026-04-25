import { ButtonHTMLAttributes, ReactNode } from "react";

export type ButtonVariant =
  | "primary" // Brand color (#2F6BFF)
  | "secondary" // Gray-100/Gray-800
  | "ghost" // Transparent
  | "outline" // Bordered
  | "danger" // Red (F04452)
  | "tertiary" // Light blue/Brand subtle
  | "link"; // Text only

export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: ReactNode;
  fullWidth?: boolean;
  isLoading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}
