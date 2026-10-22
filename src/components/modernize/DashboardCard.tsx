import React from 'react';

export interface DashboardCardProps {
  title?: string | React.ReactNode;
  subtitle?: string | React.ReactNode;
  action?: React.ReactNode;
  footer?: React.ReactNode;
  middlecontent?: React.ReactNode;
  children?: React.ReactNode;
  cardheading?: boolean;
  headtitle?: string | React.ReactNode;
  headsubtitle?: string | React.ReactNode;
  className?: string;
  isCardShadow?: boolean;
  noPadding?: boolean;
}

/**
 * Modernize DashboardCard component (Tailwind CSS implementation)
 * Replicates the clean, rounded card structure, subtle border, and spacious typography of Modernize Admin.
 */
export const DashboardCard: React.FC<DashboardCardProps> = ({
  title,
  subtitle,
  children,
  action,
  footer,
  cardheading,
  headtitle,
  headsubtitle,
  middlecontent,
  className = '',
  isCardShadow = true,
  noPadding = false,
}) => {
  return (
    <div
      className={`
        relative
        bg-white
        rounded-2xl
        border border-[#EAEFF4]
        ${isCardShadow ? 'shadow-[0_9px_17.5px_rgba(0,0,0,0.05)] hover:shadow-md' : 'shadow-none'}
        transition-all duration-200
        overflow-hidden
        ${className}
      `}
    >
      {cardheading ? (
        <div className="p-2 sm:p-6 border-b border-[#EAEFF4]/70">
          {typeof headtitle === 'string' ? (
            <h3 className="text-xs sm:text-lg font-bold text-[#2A3547] leading-snug">{headtitle}</h3>
          ) : (
            headtitle
          )}
          {headsubtitle && (
            <p className="hidden sm:block text-xs text-[#5A6A85] mt-1">{headsubtitle}</p>
          )}
        </div>
      ) : null}

      <div className={noPadding ? '' : 'p-2 sm:p-6'}>
        {title ? (
          <div className="flex items-center justify-between gap-2 sm:gap-4 mb-2 sm:mb-5">
            <div>
              {typeof title === 'string' ? (
                <h3 className="text-xs sm:text-lg font-bold text-[#2A3547] tracking-tight leading-snug">
                  {title}
                </h3>
              ) : (
                title
              )}
              {subtitle && (
                <p className="hidden sm:block text-xs text-[#5A6A85] mt-1 font-medium leading-relaxed">
                  {subtitle}
                </p>
              )}
            </div>
            {action && <div className="flex-shrink-0">{action}</div>}
          </div>
        ) : null}

        {children}
      </div>

      {middlecontent && (
        <div className="px-5 sm:px-6 py-3 bg-[#F4F6F9]/60 border-t border-b border-[#EAEFF4]/80">
          {middlecontent}
        </div>
      )}

      {footer && (
        <div className="px-5 sm:px-6 py-4 bg-[#F4F6F9]/30 border-t border-[#EAEFF4] rounded-b-2xl">
          {footer}
        </div>
      )}
    </div>
  );
};

export default DashboardCard;
