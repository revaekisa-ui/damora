import React, { useState } from 'react';
import { Project, Client, ProjectStatusConfig } from '../../../types';
import {
    CalendarIcon,
    MapPinIcon,
    CheckCircleIcon,
    WhatsappIcon,
    EyeIcon,
    PencilIcon,
    ClockIcon
} from '../../../constants';
import { MobileExpandableExtra } from '../../../components/ui/MobileProgressiveDisclosure';
import ProjectClientAvatar from './ProjectClientAvatar';

interface ProjectCardProps {
    project: Project;
    client: Client | undefined;
    projectStatusConfig: ProjectStatusConfig[];
    onStatusChange: (projectId: string, newStatus: string) => void;
    onViewDetails: (project: Project) => void;
    onEdit: (project: Project) => void;
    onSendMessage: (project: Project) => void;
}

const getStatusColor = (status: string, config: ProjectStatusConfig[]): string => {
    const statusConfig = config.find(c => c.name === status);
    return statusConfig ? statusConfig.color : '#64748b';
};

const getDaysUntil = (dateString: string): number => {
    const eventDate = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    eventDate.setHours(0, 0, 0, 0);
    const diffTime = eventDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
};

const getProgressPercentage = (status: string, config: ProjectStatusConfig[]): number => {
    const statusIndex = config.findIndex(s => s.name === status);
    if (statusIndex === -1) return 0;
    return ((statusIndex + 1) / config.length) * 100;
};

export const ProjectCard: React.FC<ProjectCardProps> = ({
    project,
    client,
    projectStatusConfig,
    onStatusChange,
    onViewDetails,
    onEdit,
    onSendMessage,
}) => {
    const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);

    const daysUntil = getDaysUntil(project.date);
    const progressPercentage = getProgressPercentage(project.status, projectStatusConfig);
    const statusColor = getStatusColor(project.status, projectStatusConfig);

    const isVIP = client && (client as any).isVIP; // Assuming VIP flag exists
    const isUrgent = daysUntil >= 0 && daysUntil <= 7;

    const handleStatusChange = (newStatus: string) => {
        onStatusChange(project.id, newStatus);
        setIsStatusDropdownOpen(false);
    };

    return (
        <div className={`h-fit self-start bg-white rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-[#EAEFF4] hover:shadow-[0_6px_16px_rgba(0,0,0,0.07)] transition-all duration-200 relative ${isStatusDropdownOpen ? 'z-40' : 'z-auto'}`}>
            <div className="p-2.5 sm:p-3">
                {/* Row 1: Project Name, Client, Date & Urgent Indicator */}
                <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                            <h3 className="font-bold text-xs sm:text-sm text-[#2A3547] leading-tight truncate">
                                {project.projectName}
                            </h3>
                            {isVIP && (
                                <span className="flex-shrink-0 text-[10px] px-1.5 py-0.2 rounded-full solid-orange text-white font-bold leading-none">
                                    ⭐ VIP
                                </span>
                            )}
                        </div>
                        <div className="mt-1 flex min-w-0 items-center gap-1.5">
                            <ProjectClientAvatar
                                client={client}
                                name={client?.name || project.clientName}
                                className="h-6 w-6 text-[8px]"
                            />
                            <p className="truncate text-[11px] font-medium leading-tight text-[#5A6A85] sm:text-xs">
                                {client?.name || project.clientName}
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-col items-end shrink-0 gap-0.5 text-[10px] sm:text-[11px] text-[#5A6A85]">
                        <div className="inline-flex items-center gap-1 font-medium leading-tight">
                            <CalendarIcon className="w-3 h-3 text-brand-accent shrink-0" />
                            <span>{project.date ? new Date(project.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Belum ditentukan'}</span>
                        </div>
                        {isUrgent && daysUntil >= 0 && (
                            <div className="inline-flex items-center gap-0.5 text-orange-600 font-bold leading-none">
                                <ClockIcon className="w-3 h-3 shrink-0" />
                                <span>{daysUntil === 0 ? 'Hari ini!' : `${daysUntil} hari lagi`}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Row 2: Status Dropdown + Inline Progress Bar & Percentage */}
                <div className="flex items-center justify-between gap-2 mt-1.5">
                    <div className="relative shrink-0">
                        <button
                            onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                            className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-bold leading-tight transition-all"
                            style={{
                                backgroundColor: `${statusColor}18`,
                                color: statusColor
                            }}
                        >
                            <span>{project.status}</span>
                            <svg className={`w-2.5 h-2.5 transition-transform ${isStatusDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>

                        {/* Status Dropdown */}
                        {isStatusDropdownOpen && (
                            <>
                                <div
                                    className="fixed inset-0 z-10"
                                    onClick={() => setIsStatusDropdownOpen(false)}
                                />
                                <div className="absolute top-full left-0 mt-1 w-44 bg-white border border-[#EAEFF4] rounded-xl shadow-xl z-20 py-1">
                                    {projectStatusConfig.map((statusConfig) => (
                                        <button
                                            key={statusConfig.id}
                                            onClick={() => handleStatusChange(statusConfig.name)}
                                            className={`w-full text-left px-3 py-1.5 text-xs font-bold hover:bg-[#F4F6F9] transition-colors flex items-center gap-2 ${project.status === statusConfig.name ? 'text-brand-accent' : 'text-[#2A3547]'}`}
                                            style={{ color: statusConfig.color }}
                                        >
                                            {project.status === statusConfig.name && (
                                                <CheckCircleIcon className="w-3.5 h-3.5" />
                                            )}
                                            <span className={project.status === statusConfig.name ? '' : 'ml-5'}>
                                                {statusConfig.name}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>

                    <div className="flex items-center gap-1.5 flex-1 max-w-[160px] justify-end">
                        <div className="w-full h-1.5 bg-[#F4F6F9] rounded-full overflow-hidden">
                            <div
                                className="h-full transition-all duration-500 rounded-full"
                                style={{
                                    width: `${progressPercentage}%`,
                                    backgroundColor: statusColor
                                }}
                            />
                        </div>
                        <span className="text-[10px] font-bold text-[#5A6A85] shrink-0 tabular-nums">
                            {Math.round(progressPercentage)}%
                        </span>
                    </div>
                </div>

                {/* Expandable Details & Actions */}
                <MobileExpandableExtra
                    labelOpen="Lihat Detail & Aksi"
                    labelClose="Ringkas"
                    headerRight={
                        <button
                            onClick={() => onViewDetails(project)}
                            className="px-2 py-0.5 rounded-lg bg-brand-accent/10 text-brand-accent transition-all inline-flex items-center gap-1 text-[10px] font-bold leading-tight"
                            title="Lihat Detail"
                        >
                            <EyeIcon className="w-3 h-3 flex-shrink-0" />
                            <span>Detail</span>
                        </button>
                    }
                >
                    <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-[10px] text-[#5A6A85]">
                            {project.location && (
                                <div className="flex items-center gap-1 min-w-0">
                                    <MapPinIcon className="w-3 h-3 text-orange-600 shrink-0" />
                                    <span className="truncate">{project.location}</span>
                                </div>
                            )}

                            {project.team && project.team.length > 0 && (
                                <div className="truncate">
                                    <span className="font-semibold text-[#2A3547]">Tim: </span>
                                    {project.team.map(t => t.name.split(' ')[0]).join(', ')}
                                </div>
                            )}
                        </div>

                        <div className="flex items-center justify-end gap-1.5 pt-1 border-t border-[#EAEFF4]/60">
                            <button
                                onClick={() => onSendMessage(project)}
                                className="px-2 py-0.5 rounded-lg solid-teal text-white transition-all inline-flex items-center gap-1 text-[10px] font-bold"
                                title="Chat Pengantin via WA"
                            >
                                <WhatsappIcon className="w-3 h-3 flex-shrink-0" />
                                <span>WA</span>
                            </button>

                            <button
                                onClick={() => onEdit(project)}
                                className="px-2 py-0.5 rounded-lg bg-orange-600/10 text-orange-600 transition-all inline-flex items-center gap-1 text-[10px] font-bold"
                                title="Edit Acara Pernikahan"
                            >
                                <PencilIcon className="w-3 h-3 flex-shrink-0" />
                                <span>Edit</span>
                            </button>
                        </div>
                    </div>
                </MobileExpandableExtra>
            </div>
        </div>
    );
};

export default ProjectCard;
