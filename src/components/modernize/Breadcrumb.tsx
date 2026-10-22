import React from 'react';

export interface BreadcrumbItem {
  title: string;
  to?: string;
  onClick?: () => void;
}

export interface BreadcrumbProps {
  title: string;
  subtitle?: string;
  items?: BreadcrumbItem[];
  children?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

/**
 * Modernize Breadcrumb Component (Tailwind CSS implementation)
 * Features the signature Modernize top-of-page accent banner with a brand gradient background,
 * high-contrast Plus Jakarta typography, dot-separated breadcrumb links, and right-side slot.
 */
export const Breadcrumb: React.FC<BreadcrumbProps> = ({
  title,
  subtitle,
  items,
  children,
  action,
  className = '',
}) => {
  return (
    <div
      className={`
        relative
        overflow-hidden
        rounded-2xl
        grad-brand
        border border-white/10
        p-6 sm:p-7
        mb-6
        flex flex-col md:flex-row md:items-center md:justify-between
        gap-4
        shadow-xs
        ${className}
      `}
    >
      {/* Subtle decorative circles inspired by Modernize banner */}
      <div className="absolute -top-8 -right-8 w-36 h-36 rounded-full bg-white/10 pointer-events-none blur-xl" />
      <div className="absolute -bottom-10 right-20 w-28 h-28 rounded-full bg-white/10 pointer-events-none blur-lg" />

      {/* Left content: Title, Subtitle, Trail */}
      <div className="relative z-10 max-w-xl">
        <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight leading-tight">
          {title}
        </h2>

        {subtitle && (
          <p className="text-xs sm:text-sm text-white/80 font-normal mt-1 leading-relaxed">
            {subtitle}
          </p>
        )}

        {items && items.length > 0 && (
          <nav aria-label="breadcrumb" className="mt-3 flex items-center flex-wrap gap-1.5 text-xs">
            {items.map((item, idx) => {
              const isLast = idx === items.length - 1;
              return (
                <React.Fragment key={idx}>
                  {item.onClick ? (
                    <button
                      type="button"
                      onClick={item.onClick}
                      className="text-white/80 hover:text-white font-medium transition-colors cursor-pointer"
                    >
                      {item.title}
                    </button>
                  ) : item.to ? (
                    <a
                      href={item.to}
                      className="text-white/80 hover:text-white font-medium transition-colors"
                    >
                      {item.title}
                    </a>
                  ) : (
                    <span
                      className={`font-semibold ${
                        isLast ? 'text-white' : 'text-white/80'
                      }`}
                    >
                      {item.title}
                    </span>
                  )}

                  {!isLast && (
                    <span className="w-1.5 h-1.5 rounded-full bg-white/50 mx-1 flex-shrink-0" />
                  )}
                </React.Fragment>
              );
            })}
          </nav>
        )}
      </div>

      {/* Right side slot: Actions or Children */}
      <div className="relative z-10 flex-shrink-0 flex items-center gap-3">
        {action}
        {children}
      </div>
    </div>
  );
};

export default Breadcrumb;
