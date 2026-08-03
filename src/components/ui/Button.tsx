import { forwardRef, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { CircleNotch } from '@phosphor-icons/react';
import { motion } from 'framer-motion';
import type { HTMLMotionProps } from 'framer-motion';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline' | 'inverse';
type ButtonSize = 'sm' | 'md' | 'lg';

// Extend from HTMLMotionProps to allow motion props
export interface ButtonProps extends Omit<HTMLMotionProps<"button">, 'ref'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: ReactNode;
  fullWidth?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-primary-700 text-surface-50 hover:bg-primary-600 focus-visible:ring-primary-500 shadow-sm border border-primary-600/50',
  secondary:
    'bg-white text-surface-800 hover:bg-surface-50 border border-surface-200 shadow-sm',
  ghost:
    'text-surface-700 hover:bg-surface-100',
  danger:
    'bg-danger-50 text-danger-600 hover:bg-danger-100 border border-danger-200',
  outline:
    'border border-primary-700/30 text-primary-700 hover:bg-primary-50',
  inverse:
    'bg-white text-primary-700 hover:bg-primary-50 focus-visible:ring-white shadow-sm',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm gap-1.5 rounded-lg',
  md: 'px-4 py-2.5 text-sm gap-2 rounded-xl',
  lg: 'px-6 py-3 text-base gap-2 rounded-2xl',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      icon,
      fullWidth = false,
      disabled,
      children,
      className,
      ...props
    },
    ref
  ) => {
    return (
      <motion.button
        ref={ref}
        disabled={disabled || loading}
        whileHover={{ scale: disabled || loading ? 1 : 1.01 }}
        whileTap={{ scale: disabled || loading ? 1 : 0.97 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        className={cn(
          'inline-flex items-center justify-center font-medium',
          'transition-colors duration-200 cursor-pointer',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none',
          variantStyles[variant],
          sizeStyles[size],
          fullWidth && 'w-full',
          className
        )}
        {...props}
      >
        {loading ? (
          <CircleNotch weight="bold" className="w-4 h-4 animate-spin" aria-hidden="true" />
        ) : icon ? (
          <span className="shrink-0" aria-hidden="true">{icon}</span>
        ) : null}
        {children as ReactNode}
      </motion.button>
    );
  }
);

Button.displayName = 'Button';
