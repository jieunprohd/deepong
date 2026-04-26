"use client";

import React from "react";
import { InputProps } from "./types";

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      help,
      leftElement,
      rightElement,
      className = "",
      containerClassName = "",
      id,
      ...props
    },
    ref,
  ) => {
    //  항상 컴포넌트 최상단에서 한 번만 호출
    const reactId = React.useId();
    const inputId = id ?? reactId; // 값만 조건으로 선택

    return (
      <div className={`flex flex-col gap-1.5 w-full ${containerClassName}`}>
        {label && (
          <label
            htmlFor={inputId}
            className="text-[13px] font-semibold text-(--gray-700) px-0.5"
          >
            {label}
          </label>
        )}

        <div className="relative flex items-center">
          {leftElement && (
            <div className="absolute left-4 flex items-center justify-center text-(--gray-400)">
              {leftElement}
            </div>
          )}

          <input
            id={inputId}
            ref={ref}
            className={`
              w-full h-12 rounded-(--r-md) border text-[15px] transition-all duration-(--t-fast)
              placeholder:text-(--gray-400) focus:outline-none bg-(--bg-surface)
              ${leftElement ? "pl-11" : "px-4"}
              ${rightElement ? "pr-11" : "px-4"}
              ${
                error
                  ? "border-(--danger) focus:border-(--danger)"
                  : "border-(--gray-200) focus:border-(--brand-primary)"
              }
              disabled:bg-(--gray-50) disabled:text-(--gray-400)
              read-only:bg-(--gray-50)
              ${className}
            `}
            {...props}
          />

          {rightElement && (
            <div className="absolute right-4 flex items-center justify-center text-(--gray-400)">
              {rightElement}
            </div>
          )}
        </div>

        {error ? (
          <p className="text-xs text-(--danger) px-0.5 mt-0.5">{error}</p>
        ) : (
          help && (
            <div className="text-xs text-(--gray-500) px-0.5 mt-0.5">
              {help}
            </div>
          )
        )}
      </div>
    );
  },
);

Input.displayName = "Input";
