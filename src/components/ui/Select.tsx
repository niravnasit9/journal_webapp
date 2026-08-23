import React, { forwardRef } from "react";

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { label: string; value: string | number }[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className = "", label, error, options, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-semibold text-primary mb-1.5">
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            className={`w-full min-h-[44px] bg-surface border rounded-lg px-3 py-2 text-sm text-primary focus:outline-none focus:ring-2 transition-colors appearance-none disabled:opacity-50 disabled:cursor-not-allowed ${
              error 
                ? "border-danger focus:ring-danger" 
                : "border-default hover:border-strong focus:border-strong focus:ring-blue-500"
            } ${className}`}
            {...props}
          >
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted">
            <i className="las la-angle-down"></i>
          </div>
        </div>
        {error && <p className="mt-1.5 text-xs text-danger font-medium">{error}</p>}
      </div>
    );
  }
);

Select.displayName = "Select";
