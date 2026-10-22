import React from 'react';

interface AnalyticsChartCardProps {
    title: string;
    description?: string;
    children: React.ReactNode;
    className?: string;
    headerClassName?: string;
    bodyClassName?: string;
}

export const AnalyticsChartCard: React.FC<AnalyticsChartCardProps> = ({
    title,
    description,
    children,
    className = "bg-white rounded-xl border border-[#EAEFF4] shadow-[0_2px_4px_rgba(0,0,0,0.02)]",
    headerClassName = "mb-3",
    bodyClassName = "",
}) => {
    return (
        <div className={`p-4 ${className}`}>
            <div className={headerClassName}>
                <h4 className="text-sm font-bold text-[#2A3547]">{title}</h4>
                {description && <p className="hidden sm:block text-xs text-[#5A6A85] mt-0.5">{description}</p>}
            </div>
            <div className={bodyClassName}>
                {children}
            </div>
        </div>
    );
};
