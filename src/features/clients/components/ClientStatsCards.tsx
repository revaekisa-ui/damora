import React from 'react';
import ModernStatCard from '../../../components/modernize/ModernStatCard';
import StatCardModal from '../../../shared/ui/StatCardModal';
import { UsersIcon, TrendingUpIcon, AlertCircleIcon, MapPinIcon } from '../../../constants';
import { Client, Project, ClientStatus } from '../../../types';
import { formatCurrency } from '../utils/clientHelpers';

export type StatModalType = 'total' | 'active' | 'receivables' | 'location' | null;

interface ClientStatsCardsProps {
    clientStats: {
        totalClients: number;
        activeClients: number;
        totalReceivables: string;
        mostFrequentLocation: string;
    };
    activeStatModal: StatModalType;
    setActiveStatModal: React.Dispatch<React.SetStateAction<StatModalType>>;
    clients: Client[];
    projects: Project[];
}

export const ClientStatsCards: React.FC<ClientStatsCardsProps> = ({
    clientStats,
    activeStatModal,
    setActiveStatModal,
    clients,
    projects,
}) => {
    return (
        <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5">
                <ModernStatCard
                    icon={<UsersIcon className="w-6 h-6" />}
                    title="Total Pengantin"
                    value={clientStats.totalClients.toString()}
                    subtitle="Semua pengantin terdaftar"
                    iconColorVariant="primary"
                    compactOnMobile
                    onClick={() => setActiveStatModal('total')}
                />
                <ModernStatCard
                    icon={<TrendingUpIcon className="w-6 h-6" />}
                    title="Pengantin Aktif"
                    value={clientStats.activeClients.toString()}
                    subtitle="Acara pernikahan berjalan"
                    iconColorVariant="success"
                    compactOnMobile
                    onClick={() => setActiveStatModal('active')}
                />
                <ModernStatCard
                    icon={<AlertCircleIcon className="w-6 h-6" />}
                    title="Total Piutang"
                    value={clientStats.totalReceivables}
                    subtitle="Pembayaran belum lunas"
                    iconColorVariant="error"
                    compactOnMobile
                    onClick={() => setActiveStatModal('receivables')}
                />
                <ModernStatCard
                    icon={<MapPinIcon className="w-6 h-6" />}
                    title="Lokasi Teratas"
                    value={clientStats.mostFrequentLocation}
                    subtitle="Lokasi paling sering dipilih"
                    iconColorVariant="warning"
                    compactOnMobile
                    onClick={() => setActiveStatModal('location')}
                />
            </div>

            {/* StatCard Detail Modals */}
            <StatCardModal
                isOpen={activeStatModal === 'total'}
                onClose={() => setActiveStatModal(null)}
                icon={<UsersIcon className="w-6 h-6" />}
                title="Total Pengantin"
                value={clientStats.totalClients.toString()}
                subtitle="Semua pengantin terdaftar"
                colorVariant="blue"
                description={`Total pengantin yang terdaftar dalam sistem Anda.\n\nTotal: ${clientStats.totalClients} pengantin\n\nPengantin adalah aset berharga bisnis Anda. Jaga hubungan baik untuk repeat business dan referral.`}
            >
                <div className="space-y-3">
                    <h4 className="font-bold text-[#2A3547] border-b border-[#EAEFF4] pb-2 text-sm">Daftar Pengantin</h4>
                    {clients.slice(0, 10).map(client => {
                        const clientProjects = projects.filter(p => p.clientId === client.id);
                        return (
                            <div key={client.id} className="p-3 bg-[#F4F6F9] hover:bg-brand-accent/10 rounded-xl border border-[#EAEFF4] transition-colors">
                                <div className="flex justify-between items-start mb-1">
                                    <p className="font-bold text-[#2A3547] text-sm">{client.name}</p>
                                    <span
                                        className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                                            client.status === ClientStatus.ACTIVE
                                                ? 'solid-teal text-white'
                                                : client.status === ClientStatus.INACTIVE
                                                ? 'bg-gray-100 text-gray-600'
                                                : 'solid-blue text-white'
                                        }`}
                                    >
                                        {client.status}
                                    </span>
                                </div>
                                <p className="text-xs text-[#5A6A85]">{client.email}</p>
                                <p className="text-xs text-[#5A6A85] mt-1">{clientProjects.length} Acara Pernikahan</p>
                            </div>
                        );
                    })}
                    {clients.length > 10 && (
                        <p className="text-xs text-[#5A6A85] text-center pt-2">Dan {clients.length - 10} pengantin lainnya...</p>
                    )}
                </div>
            </StatCardModal>

            <StatCardModal
                isOpen={activeStatModal === 'active'}
                onClose={() => setActiveStatModal(null)}
                icon={<TrendingUpIcon className="w-6 h-6" />}
                title="Pengantin Aktif"
                value={clientStats.activeClients.toString()}
                subtitle="Pengantin dengan Acara Pernikahan berjalan"
                colorVariant="green"
                description={`Pengantin yang memiliki Acara Pernikahan aktif saat ini.\n\nAktif: ${clientStats.activeClients} pengantin\n\nFokus pada pengantin aktif untuk memastikan kepuasan dan penyelesaian Acara Pernikahan tepat waktu.`}
            >
                <div className="space-y-3">
                    <h4 className="font-bold text-[#2A3547] border-b border-[#EAEFF4] pb-2 text-sm">Pengantin dengan Acara Pernikahan Aktif</h4>
                    {clients
                        .filter(c => projects.some(p => p.clientId === c.id && p.status !== 'Selesai' && p.status !== 'Dibatalkan'))
                        .map(client => {
                            const activeProjects = projects.filter(
                                p => p.clientId === client.id && p.status !== 'Selesai' && p.status !== 'Dibatalkan'
                            );
                            return (
                                <div key={client.id} className="p-3 bg-[#F4F6F9] hover:bg-brand-accent/10 rounded-xl border border-[#EAEFF4] transition-colors">
                                    <p className="font-bold text-[#2A3547] text-sm">{client.name}</p>
                                    <p className="text-xs text-[#5A6A85] mt-1">{activeProjects.length} Acara Pernikahan aktif</p>
                                    <div className="mt-2 flex flex-wrap gap-1">
                                        {activeProjects.slice(0, 3).map(p => (
                                            <span key={p.id} className="text-xs px-2.5 py-0.5 rounded-full solid-blue text-white font-medium">
                                                {p.projectName}
                                            </span>
                                        ))}
                                        {activeProjects.length > 3 && (
                                            <span className="text-xs text-[#5A6A85]">+{activeProjects.length - 3} lagi</span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                </div>
            </StatCardModal>

            <StatCardModal
                isOpen={activeStatModal === 'receivables'}
                onClose={() => setActiveStatModal(null)}
                icon={<AlertCircleIcon className="w-6 h-6" />}
                title="Total Piutang"
                value={clientStats.totalReceivables}
                subtitle="Pembayaran belum lunas"
                colorVariant="orange"
                description={`Total piutang dari semua pengantin yang belum dibayar.\n\nPiutang: ${clientStats.totalReceivables}\n\nSegera tindak lanjuti pembayaran untuk menjaga cash flow bisnis Anda.`}
            >
                <div className="space-y-3">
                    <h4 className="font-bold text-[#2A3547] border-b border-[#EAEFF4] pb-2 text-sm">Pengantin dengan Piutang</h4>
                    {clients
                        .map(client => {
                            const clientProjects = projects.filter(p => p.clientId === client.id);
                            const totalReceivable = clientProjects.reduce((sum, p) => sum + (p.totalCost - p.amountPaid), 0);
                            if (totalReceivable <= 0) return null;
                            return (
                                <div key={client.id} className="p-3 bg-[#F4F6F9] hover:bg-red-600/5 rounded-xl border border-[#EAEFF4] transition-colors">
                                    <div className="flex justify-between items-start mb-1">
                                        <p className="font-bold text-[#2A3547] text-sm">{client.name}</p>
                                        <span className="text-sm text-red-600 font-bold">{formatCurrency(totalReceivable)}</span>
                                    </div>
                                    <p className="text-xs text-[#5A6A85]">
                                        {clientProjects.filter(p => p.totalCost - p.amountPaid > 0).length} Acara Pernikahan dengan piutang
                                    </p>
                                </div>
                            );
                        })
                        .filter(Boolean)}
                </div>
            </StatCardModal>

            <StatCardModal
                isOpen={activeStatModal === 'location'}
                onClose={() => setActiveStatModal(null)}
                icon={<MapPinIcon className="w-6 h-6" />}
                title="Lokasi Teratas"
                value={clientStats.mostFrequentLocation}
                subtitle="Lokasi paling sering dipilih"
                colorVariant="purple"
                description={`Lokasi yang paling sering dipilih oleh pengantin Anda.\n\nTeratas: ${clientStats.mostFrequentLocation}\n\nInformasi ini membantu Anda memahami area market utama.`}
            >
                <div className="space-y-3">
                    <h4 className="font-bold text-[#2A3547] border-b border-[#EAEFF4] pb-2 text-sm">Distribusi Lokasi Pengantin</h4>
                    {Object.entries(
                        clients.reduce((acc, c) => {
                            const clientProjects = projects.filter(p => p.clientId === c.id);
                            const loc = clientProjects.length > 0 && clientProjects[0].location ? clientProjects[0].location : 'Tidak Diketahui';
                            acc[loc] = (acc[loc] || 0) + 1;
                            return acc;
                        }, {} as Record<string, number>)
                    )
                        .sort(([, a], [, b]) => b - a)
                        .map(([location, count]) => (
                            <div key={location} className="p-3 bg-[#F4F6F9] rounded-xl border border-[#EAEFF4] flex justify-between items-center">
                                <p className="font-bold text-[#2A3547] text-sm">{location}</p>
                                <span className="text-sm text-brand-accent font-semibold">{count} pengantin</span>
                            </div>
                        ))}
                </div>
            </StatCardModal>
        </>
    );
};

export default ClientStatsCards;
