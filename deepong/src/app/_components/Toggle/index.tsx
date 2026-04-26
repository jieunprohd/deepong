"use client";

import React from "react";

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
  description?: string;
}

export const Toggle: React.FC<ToggleProps> = ({
  checked,
  onChange,
  disabled = false,
  label,
  description,
}) => {
  return (
    <div className="flex items-center justify-between gap-4 w-full py-1">
      {(label || description) && (
        <div className="flex flex-col">
          {label && (
            <span className="text-[15px] font-medium text-(--gray-900)">
              {label}
            </span>
          )}
          {description && (
            <span className="text-[13px] text-(--gray-500)">{description}</span>
          )}
        </div>
      )}
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`
          relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent 
          transition-colors duration-200 ease-in-out focus:outline-none
          ${checked ? "bg-(--brand-primary)" : "bg-(--gray-200)"}
          ${disabled ? "opacity-50 cursor-not-allowed" : ""}
        `}
      >
        <span
          aria-hidden="true"
          className={`
            pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 
            transition duration-200 ease-in-out
            ${checked ? "translate-x-5" : "translate-x-0"}
          `}
        />
      </button>
    </div>
  );
};
