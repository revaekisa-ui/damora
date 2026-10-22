import React from 'react';

export interface BlankCardProps {
  className?: string;
  children: React.ReactNode;
  isCardShadow?: boolean;
  onClick?: () => void;
}

/**
 * Modernize BlankCard component (Tailwind CSS implementation)
 * Replicates the clean container card without default padding.
 */
export const BlankCard: React.FC<BlankCardProps> = ({
  children,
  className = '',
  isCardShadow = true,
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className={`
        relative
        bg-white
        rounded-2xl
        border border-[#EAEFF4]
        ${isCardShadow ? 'shadow-[0_9px_17.5px_rgba(0,0,0,0.05)] hover:shadow-md' : 'shadow-none'}
        transition-all duration-200
        overflow-hidden
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
};

export default BlankCard;
