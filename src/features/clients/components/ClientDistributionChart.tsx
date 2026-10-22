import React, { useState } from 'react';

interface DistributionData {
    name: string;
    percentage: number;
    count: number;
}

const ClientDistributionChart: React.FC<{ data: DistributionData[] }> = ({ data }) => {
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
    const maxPercentage = Math.max(...data.map(d => d.percentage), 1);
    const hasData = data.some(d => d.count > 0);

    if (!hasData) {
        return (
            <div className="bg-brand-surface p-6 rounded-2xl shadow-lg h-full border border-brand-border">
                <h3 className="font-bold text-lg text-gradient mb-6">Distribusi Pengantin per Wilayah</h3>
                <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="w-20 h-20 rounded-2xl bg-brand-bg border-2 border-dashed border-brand-border flex items-center justify-center mb-3">
                        <svg className="w-10 h-10 text-brand-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                    </div>
                    <p className="text-sm font-medium text-brand-text-light mb-1">Belum Ada Data</p>
                    <p className="text-xs text-brand-text-secondary">Data distribusi wilayah akan muncul di sini</p>
                </div>
            </div>
        );
    }

    // Generate gradient colors for each bar
    const getBarColor = (index: number) => {
        const colors = [
            { from: 'from-blue-600', to: 'to-cyan-400', solid: 'bg-blue-600', glow: 'shadow-blue-600/50' },
            { from: 'from-purple-500', to: 'to-pink-400', solid: 'bg-purple-600', glow: 'shadow-purple-500/50' },
            { from: 'from-green-500', to: 'to-emerald-400', solid: 'bg-green-600', glow: 'shadow-green-500/50' },
            { from: 'from-orange-500', to: 'to-amber-400', solid: 'bg-orange-600', glow: 'shadow-orange-500/50' },
            { from: 'from-pink-500', to: 'to-rose-400', solid: 'bg-pink-500', glow: 'shadow-pink-500/50' },
            { from: 'from-indigo-500', to: 'to-blue-800', solid: 'bg-indigo-600', glow: 'shadow-indigo-500/50' },
            { from: 'from-teal-500', to: 'to-cyan-400', solid: 'bg-teal-500', glow: 'shadow-teal-500/50' },
            { from: 'from-red-500', to: 'to-orange-400', solid: 'bg-red-600', glow: 'shadow-red-500/50' },
            { from: 'from-violet-500', to: 'to-purple-400', solid: 'bg-violet-500', glow: 'shadow-violet-500/50' },
            { from: 'from-cyan-500', to: 'to-blue-800', solid: 'bg-cyan-500', glow: 'shadow-cyan-500/50' },
        ];
        return colors[index % colors.length];
    };

    const totalCount = data.reduce((sum, d) => sum + d.count, 0);

    return (
        <div className="bg-brand-surface p-6 rounded-2xl shadow-lg h-full border border-brand-border">
            <h3 className="font-bold text-lg text-gradient mb-2">Distribusi Pengantin per Wilayah</h3>
            <p className="text-xs text-brand-text-secondary mb-6">Sebaran {totalCount} pengantin berdasarkan asal daerah</p>
            
            <div className="space-y-3">
                {data.map((item, index) => {
                    const width = Math.max((item.percentage / maxPercentage) * 100, 5);
                    const isHovered = hoveredIndex === index;
                    const barColor = getBarColor(index);

                    return (
                        <div
                            key={item.name}
                            className="relative cursor-pointer"
                            onMouseEnter={() => setHoveredIndex(index)}
                            onMouseLeave={() => setHoveredIndex(null)}
                        >
                            {/* Label and percentage */}
                            <div className="flex items-center justify-between mb-1">
                                <span className={`text-sm font-medium transition-all duration-300 ${isHovered
                                    ? 'text-brand-accent font-bold'
                                    : 'text-brand-text-light'
                                    }`}>
                                    {item.name}
                                </span>
                                <div className="flex items-center gap-2">
                                    <span className={`text-xs font-bold transition-all duration-300 ${isHovered
                                        ? 'text-brand-accent'
                                        : 'text-brand-text-secondary'
                                        }`}>
                                        {item.percentage.toFixed(1)}%
                                    </span>
                                    <span className={`text-xs font-medium transition-all duration-300 ${isHovered
                                        ? 'text-brand-accent'
                                        : 'text-brand-text-secondary'
                                        }`}>
                                        ({item.count})
                                    </span>
                                </div>
                            </div>

                            {/* Bar with gradient */}
                            <div className="relative h-8 bg-brand-bg/50 rounded-lg overflow-hidden">
                                <div
                                    className={`h-full rounded-lg transition-all duration-300 bg-gradient-to-r ${barColor.from} ${barColor.to} relative overflow-hidden ${isHovered
                                        ? `shadow-xl ${barColor.glow} scale-y-105`
                                        : 'shadow-md'
                                        }`}
                                    style={{ width: `${width}%` }}
                                >
                                    {/* Shine effect */}
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>

                                    {/* Animated pulse when hovered */}
                                    {isHovered && (
                                        <div className="absolute inset-0 animate-pulse bg-white/10"></div>
                                    )}
                                </div>

                                {/* Tooltip */}
                                {isHovered && (
                                    <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-gradient-to-br from-brand-surface to-brand-bg border-2 border-brand-accent/40 text-white font-semibold py-2 px-3 rounded-xl shadow-2xl text-xs whitespace-nowrap z-20 backdrop-blur-sm">
                                        <p className="text-brand-accent font-bold">{item.name}</p>
                                        <p className="text-brand-text-light">
                                            <span className="font-bold text-lg">{item.count}</span> Pengantin
                                        </p>
                                        <p className="text-brand-text-secondary text-[10px]">{item.percentage.toFixed(1)}% dari total</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Summary info */}
            <div className="mt-6 pt-4 border-t border-brand-border flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-brand-text-secondary">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>Total: <span className="font-bold text-brand-text-light">{totalCount} Pengantin</span></span>
                </div>
                <div className="text-brand-text-secondary">
                    Wilayah: <span className="font-bold text-brand-text-light">{data.length} Daerah</span>
                </div>
            </div>
        </div>
    );
};

export default ClientDistributionChart;
