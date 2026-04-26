import { InputHTMLAttributes, ReactNode } from "react";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  help?: ReactNode;
  leftElement?: ReactNode;
  rightElement?: ReactNode;
  containerClassName?: string;
}
