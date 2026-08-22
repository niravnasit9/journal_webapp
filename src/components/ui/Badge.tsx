import React from "react";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "neutral" | "success" | "warning" | "danger" | "info" | "free" | "starter" | "pro" | "elite";
  size?: "sm" | "md";
}

export function Badge({ className = "", variant = "neutral", size = "md", children, ...props }: BadgeProps) {
  const baseStyles = "inline-flex items-center font-bold uppercase tracking-wider rounded-md";
  
  const variants = {
    neutral: "bg-elevated text-secondary border border-default",
    success: "bg-success-bg text-success",
    warning: "bg-warning-bg text-warning",
    danger: "bg-danger-bg text-danger",
    info: "bg-info-bg text-info",
    free: "bg-[var(--plan-free-bg)] text-[var(--plan-free)]",
    starter: "bg-[var(--plan-starter-bg)] text-[var(--plan-starter)]",
    pro: "bg-[var(--plan-pro-bg)] text-[var(--plan-pro)]",
    elite: "bg-[var(--plan-elite-bg)] text-[var(--plan-elite)]",
  };

  const sizes = {
    sm: "text-[9px] px-1.5 py-0.5",
    md: "text-[10px] px-2 py-1",
  };

  return (
    <span className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`} {...props}>
      {children}
    </span>
  );
}
