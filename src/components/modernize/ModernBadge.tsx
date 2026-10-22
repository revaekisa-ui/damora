import React from 'react';

export type BadgeVariant = 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';

export interface ModernBadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  dot?: boolean;
}

const variantStyles: Record<BadgeVariant, { bg: string; text: string; dot: string }> = {
  primary: {
    bg: 'grad-brand',
    text: 'text-white',
    dot: 'bg-white',
  },
  secondary: {
    bg: 'solid-cyan',
    text: 'text-white',
    dot: 'bg-white',
  },
  success: {
    bg: 'solid-green',
    text: 'text-white',
    dot: 'bg-white',
  },
  warning: {
    bg: 'solid-orange',
    text: 'text-white',
    dot: 'bg-white',
  },
  error: {
    bg: 'bg-red-600',
    text: 'text-white',
    dot: 'bg-white',
  },
  info: {
    bg: 'solid-blue',
    text: 'text-white',
    dot: 'bg-white',
  },
};

const sizeStyles = {
  sm: 'text-[9px] sm:text-[11px] px-1.5 sm:px-2 py-0.5 font-semibold',
  md: 'text-[10px] sm:text-xs px-2 sm:px-2.5 py-0.5 sm:py-1 font-semibold',
  lg: 'text-xs sm:text-sm px-2 sm:px-3 py-0.5 sm:py-1.5 font-bold',
};

/**
 * Modernize Badge Component (Tailwind CSS implementation)
 * Solid / gradient pill with high-contrast white foreground text.
 */
export const ModernBadge: React.FC<ModernBadgeProps> = ({
  variant = 'primary',
  children,
  size = 'md',
  className = '',
  dot = false,
}) => {
  const styles = variantStyles[variant] || variantStyles.primary;

  return (
    <span
      className={`
        inline-flex items-center gap-1.5
        rounded-full
        ${styles.bg}
        ${styles.text}
        ${sizeStyles[size]}
        leading-tight
        whitespace-nowrap
        select-none
        ${className}
      `}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${styles.dot}`} />}
      {children}
    </span>
  );
};

export default ModernBadge;
