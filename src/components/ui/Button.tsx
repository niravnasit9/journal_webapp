import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "outline";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export function Button({
  className = "",
  variant = "primary",
  size = "md",
  isLoading = false,
  leftIcon,
  rightIcon,
  children,
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles = "inline-flex min-h-[44px] items-center justify-center font-semibold rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 shadow-sm",
    secondary: "bg-surface border border-default text-primary hover:bg-elevated active:bg-base",
    ghost: "text-secondary hover:text-primary hover:bg-elevated active:bg-base",
    danger: "bg-danger text-white hover:bg-red-700 active:bg-red-800 shadow-sm",
    outline: "bg-transparent border border-default text-primary hover:border-strong hover:bg-elevated active:bg-base"
  };

  const sizes = {
    sm: "text-xs px-3 py-1.5 gap-1.5",
    md: "text-sm px-4 py-2 gap-2",
    lg: "text-base px-5 py-2.5 gap-2.5"
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <i className="las la-spinner animate-spin text-lg" />
      ) : leftIcon ? (
        leftIcon
      ) : null}
      
      {children}
      
      {!isLoading && rightIcon && rightIcon}
    </button>
  );
}
