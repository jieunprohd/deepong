"use client";

import React from "react";
import { ButtonProps } from "./types";

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      fullWidth = false,
      isLoading = false,
      leftIcon,
      rightIcon,
      children,
      className = "",
      disabled,
      ...props
    },
    ref,
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center gap-2 rounded-[var(--r-md)] font-semibold transition-all duration-[var(--t-fast)] active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none";

    const variantStyles: Record<string, string> = {
      primary:
        "bg-[var(--brand-primary)] text-white hover:bg-[var(--brand-primary-hover)]",
      secondary:
        "bg-[var(--gray-100)] text-[var(--gray-800)] hover:bg-[var(--gray-200)]",
      tertiary:
        "bg-[var(--brand-primary-light)] text-[var(--brand-primary)] hover:opacity-90",
      ghost: "bg-transparent text-[var(--gray-700)] hover:bg-[var(--gray-100)]",
      outline:
        "border border-[var(--gray-200)] bg-white text-[var(--gray-800)] hover:bg-[var(--gray-50)]",
      danger: "bg-[var(--danger)] text-white hover:opacity-90",
      link: "bg-transparent text-[var(--brand-primary)] hover:underline p-0 h-auto font-semibold",
    };

    const sizeStyles: Record<string, string> = {
      sm: "h-9 px-3.5 text-[13px]",
      md: "h-11 px-5 text-[15px]",
      lg: "h-[52px] px-6 text-base",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`
          ${baseStyles}
          ${variantStyles[variant]}
          ${variant === "link" ? "" : sizeStyles[size]}
          ${fullWidth ? "w-full" : ""}
          ${className}
        `}
        {...props}
      >
        {isLoading ? (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : (
          <>
            {leftIcon && (
              <span className="inline-flex items-center">{leftIcon}</span>
            )}
            {children}
            {rightIcon && (
              <span className="inline-flex items-center">{rightIcon}</span>
            )}
          </>
        )}
      </button>
    );
  },
);

Button.displayName = "Button";
