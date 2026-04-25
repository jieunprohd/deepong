"use client";

import React from "react";
import { SelectProps } from "./types";

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, className = "", id, ...props }, ref) => {
    const reactId = React.useId();
    const selectId = id ?? reactId; // 값만 조건부로 선택

    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label
            htmlFor={selectId}
            className="text-[13px] font-semibold text-(--gray-700)"
          >
            {label}
          </label>
        )}
        <div className="relative">
          <select
            id={selectId}
            ref={ref}
            className={`
              w-full h-12 px-4 rounded-md border text-[15px] appearance-none bg-white
              transition-all duration-200 cursor-pointer focus:outline-none
              ${
                error
                  ? "border-(--danger) focus:border-(--danger)"
                  : "border-(--gray-200) focus:border-(--brand-primary)"
              }
              ${className}
            `}
            {...props}
          >
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
            <svg
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M2.5 4.5L6 8L9.5 4.5"
                stroke="var(--gray-500)"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
        {error && <p className="text-xs text-(--danger)">{error}</p>}
      </div>
    );
  },
);

Select.displayName = "Select";
