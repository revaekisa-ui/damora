import React from 'react';
import ModernBadge, { type BadgeVariant } from './ModernBadge';

export interface ModernStatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  subtitle?: string;
  change?: string;
  changeType?: 'increase' | 'decrease';
  iconColorVariant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  onClick?: () => void;
  className?: string;
  valueClassName?: string;
  compactOnMobile?: boolean;
  badge?: { text: string; variant: BadgeVariant };
}

const iconVariants = {
  primary: 'grad-brand text-white',
  secondary: 'grad-cyan text-white',
  success: 'grad-green text-white',
  warning: 'grad-orange text-white',
  error: 'bg-gradient-to-br from-red-600 to-red-700 text-white',
};

/**
 * Modernize StatCard Component
 * Replicates the clean metric cards of Modernize:
 * Crisp white card, subtle 1px border, solid/gradient colored icon pill, bold display font, and change badge.
 */
export const ModernStatCard: React.FC<ModernStatCardProps> = ({
  title,
  value,
  icon,
  subtitle,
  change,
  changeType = 'increase',
  iconColorVariant = 'primary',
  onClick,
  className = '',
  valueClassName = '',
  compactOnMobile = false,
  badge,
}) => {
  return (
    <div
      onClick={onClick}
      className={`
        relative
        bg-white
        rounded-xl sm:rounded-2xl
        border border-[#EAEFF4]
        p-2.5 sm:p-6
        shadow-[0_9px_17.5px_rgba(0,0,0,0.05)]
        hover:shadow-md
        transition-all duration-200
        ${onClick ? 'cursor-pointer' : ''}
        flex
        ${compactOnMobile ? 'flex-row items-center gap-2.5 sm:flex-col sm:items-stretch sm:justify-between sm:gap-0' : 'flex-col justify-between'}
        min-h-[90px] sm:min-h-0
        ${className}
      `}
    >
      <div className={`flex ${compactOnMobile ? 'items-center justify-start gap-0 mb-0 sm:items-start sm:justify-between sm:gap-2 sm:mb-4' : 'items-start justify-between gap-1.5 mb-2 sm:gap-2 sm:mb-4'}`}>
        <div
          className={`
            w-7 h-7 sm:w-12 sm:h-12
            rounded-lg sm:rounded-xl
            flex items-center justify-center
            flex-shrink-0
            ${iconVariants[iconColorVariant] || iconVariants.primary}
            transition-transform duration-200
            hover:scale-105
          `}
        >
          {React.cloneElement(icon as React.ReactElement, { className: 'w-4 h-4 sm:w-6 sm:h-6' })}
        </div>

        {change && (
          <ModernBadge
            variant={changeType === 'increase' ? 'success' : 'error'}
            size="sm"
            className="text-[8px] sm:text-xs"
          >
            {changeType === 'increase' ? '+' : '-'}{change}
          </ModernBadge>
        )}
        {badge && (
          <ModernBadge variant={badge.variant} size="sm" className="text-[8px] sm:text-xs">
            {badge.text}
          </ModernBadge>
        )}
      </div>

      <div className={compactOnMobile ? 'min-w-0 flex-1 sm:w-full sm:flex-none' : ''}>
        <p className="text-[8px] sm:text-xs font-semibold uppercase tracking-wider text-[#5A6A85] mb-0.5 sm:mb-1">
          {title}
        </p>
        <h4 className={`text-xs sm:text-2xl font-extrabold text-[#2A3547] tracking-tight leading-tight tabular-nums ${valueClassName}`}>
          {value}
        </h4>
        {subtitle && (
          <p className="hidden sm:block text-xs text-[#5A6A85] mt-1 leading-relaxed font-normal">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
};

export default ModernStatCard;
