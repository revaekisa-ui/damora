import React, { useState, useMemo } from 'react';
import { Project, ProjectStatusConfig } from '../../../types';
import DonutChart from '../../../shared/ui/DonutChart';
import { FolderKanbanIcon, ClockIcon } from '../../../constants';
import { ChevronDown, BarChart2 } from 'lucide-react';
import { AnalyticsChartCard } from '../../../shared/ui/AnalyticsChartCard';
import { ModernStatCard } from '../../../components/modernize/ModernStatCard';

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
};
// ... (rest of the file)

// --- Project Value by Type Chart Component ---
export const ProjectValueByTypeChart: React.FC<{ projects: Project[] }> = ({ projects }) => {
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

    const chartData = useMemo(() => {
        const typeValues = projects.reduce((acc, p) => {
            acc[p.projectType] = (acc[p.projectType] || 0) + p.totalCost;
            return acc;
        }, {} as Record<string, number>);

        return Object.entries(typeValues)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 6); // Top 6 types
    }, [projects]);

    const maxValue = Math.max(...chartData.map(d => d.value), 1);
    const colors = ['#2563EB', '#16A34A', '#EA580C', '#DB2777', '#0891B2', '#7C3AED'];

    if (chartData.length === 0) {
        return (
            <div className="flex items-center justify-center h-48 text-sm text-[#5A6A85]">
                Belum ada data Acara Pernikahan
            </div>
        );
    }

    return (
        <div className="space-y-3.5">
            {chartData.map((item, index) => {
                const percentage = (item.value / maxValue) * 100;
                const isHovered = hoveredIndex === index;
                const barColor = colors[index % colors.length];
                return (
                    <div
                        key={item.name}
                        className="relative"
                        onMouseEnter={() => setHoveredIndex(index)}
                        onMouseLeave={() => setHoveredIndex(null)}
                    >
                        <div className="flex items-center justify-between mb-1.5">
                            <span className={`text-xs sm:text-sm font-bold transition-colors ${isHovered ? 'text-brand-accent' : 'text-[#2A3547]'}`}>
                                {item.name}
                            </span>
                            <span className="text-xs font-semibold text-[#5A6A85]">
                                {formatCurrency(item.value)}
                            </span>
                        </div>
                        <div className="h-2.5 bg-[#F4F6F9] rounded-full overflow-hidden">
                            <div
                                className="h-full rounded-full transition-all duration-500"
                                style={{ width: `${percentage}%`, backgroundColor: barColor }}
                            ></div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export interface ProjectAnalyticsProps {
    projects: Project[];
    projectStatusConfig: ProjectStatusConfig[];
    totals: {
        activeProjects: number;
        [key: string]: any;
    };
    onStatCardClick: (stat: 'count' | 'deadline' | 'top_type' | 'status_dist') => void;
}

export const ProjectAnalytics: React.FC<ProjectAnalyticsProps> = ({ projects, projectStatusConfig, totals, onStatCardClick }) => {
    const activeProjects = useMemo(() => projects.filter(p => p.status !== 'Selesai' && p.status !== 'Dibatalkan'), [projects]);
    
    // ... stats calculation remains same ...
    const stats = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const in7Days = new Date(today);
        in7Days.setDate(in7Days.getDate() + 7);

        const deadlineSoonCount = activeProjects.filter(p => {
            const d = new Date(p.deadlineDate || p.date);
            d.setHours(0, 0, 0, 0);
            return d >= today && d <= in7Days;
        }).length;

        const projectTypeCounts = projects.reduce((acc, p) => {
            acc[p.projectType] = (acc[p.projectType] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const topProjectType = Object.keys(projectTypeCounts).length > 0
            ? Object.entries(projectTypeCounts).sort(([, a], [, b]) => b - a)[0][0]
            : 'N/A';

        const statusCounts = activeProjects.reduce((acc, p) => {
            acc[p.status] = (acc[p.status] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
        const topStatus = Object.keys(statusCounts).length > 0
            ? Object.entries(statusCounts).sort(([, a], [, b]) => b - a)[0][0]
            : 'N/A';

        return { activeCount: totals?.activeProjects ?? 0, deadlineSoonCount, topProjectType, topStatus };
    }, [activeProjects, projects, totals?.activeProjects]);

    const [showCharts, setShowCharts] = useState(false);

    const projectStatusDistribution = useMemo(() => {
        const statusCounts = activeProjects.reduce((acc, p) => {
            acc[p.status] = (acc[p.status] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        return Object.entries(statusCounts).map(([label, value]) => {
            const config = projectStatusConfig.find(s => s.name === label);
            return {
                label,
                value,
                color: config ? config.color : '#2563EB'
            };
        }).sort((a, b) => b.value - a.value);
    }, [activeProjects, projectStatusConfig]);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-5">
                <ModernStatCard
                    icon={<FolderKanbanIcon className="w-5 h-5 sm:w-6 sm:h-6" />}
                    title="Acara Aktif"
                    value={stats.activeCount}
                    subtitle="Pernikahan berjalan"
                    iconColorVariant="primary"
                    compactOnMobile
                    onClick={() => onStatCardClick('count')}
                />
                <ModernStatCard
                    icon={<ClockIcon className="w-5 h-5 sm:w-6 sm:h-6" />}
                    title="Deadline Dekat"
                    value={stats.deadlineSoonCount}
                    subtitle="Jatuh tempo 7 hari"
                    iconColorVariant="warning"
                    compactOnMobile
                    onClick={() => onStatCardClick('deadline')}
                />
                <ModernStatCard
                    icon={<FolderKanbanIcon className="w-5 h-5 sm:w-6 sm:h-6" />}
                    title="Jenis Acara Teratas"
                    value={stats.topProjectType}
                    subtitle="Paling sering"
                    iconColorVariant="secondary"
                    compactOnMobile
                    onClick={() => onStatCardClick('top_type')}
                />
            </div>


            {/* Progressive Disclosure Toggle for In-Depth Analytics */}
            <div className="flex items-center justify-between pt-1">
                <p className="text-xs text-[#5A6A85]">
                    <span className="font-bold text-[#2A3547]">{stats.activeCount}</span> Acara Pernikahan aktif terpantau
                </p>
                <button
                    type="button"
                    onClick={() => setShowCharts(prev => !prev)}
                    className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-brand-accent/10 hover:bg-brand-accent/20 text-brand-accent transition-all"
                    aria-label="Buka analitik visual acara"
                >
                    <BarChart2 className="w-3.5 h-3.5" />
                    <span>{showCharts ? 'Tutup Analisis Grafik' : 'Lihat Analisis Grafik & Nilai'}</span>
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showCharts ? 'rotate-180' : ''}`} />
                </button>
            </div>

            {showCharts && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
                    <AnalyticsChartCard 
                        title="Distribusi Progres Pengantin" 
                        description="Breakdown progres pernikahan aktif"
                    >
                        <DonutChart data={projectStatusDistribution} />
                    </AnalyticsChartCard>
                    <AnalyticsChartCard 
                        title="Nilai Acara Pernikahan per Jenis" 
                        description="Total nilai Acara Pernikahan berdasarkan jenis Acara"
                    >
                        <ProjectValueByTypeChart projects={activeProjects} />
                    </AnalyticsChartCard>
                </div>
            )}
        </div>
    );
};

export default ProjectAnalytics;
