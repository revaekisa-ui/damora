import React, { useState } from 'react';
import { Client, Project, Transaction, Package, AddOn, ViewType, NavigationAction, Card } from '../../types';
import { ArrowLeftIcon } from 'lucide-react';
// I will import the necessary components that were inside ClientDetailModal

interface ClientHubPageProps {
  client: Client | null;
  projects: Project[];
  transactions: Transaction[];
  packages: Package[];
  addOns?: AddOn[];
  onBack: () => void;
  onEditClient: (client: Client) => void;
  onDeleteClient: (clientId: string) => void;
  onViewReceipt: (transaction: Transaction) => void;
  onViewInvoice: (project: Project) => void;
  handleNavigation: (view: ViewType, action?: NavigationAction) => void;
  onRecordPayment: (projectId: string, amount: number, destinationCardId: string) => void;
  cards: Card[];
  onSharePortal: (client: Client) => void;
  onDeleteProject: (projectId: string) => void;
  showNotification: (message: string) => void;
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
  setCards: React.Dispatch<React.SetStateAction<Card[]>>;
}

const ClientHubPage: React.FC<ClientHubPageProps> = (props) => {
  const [activeTab, setActiveTab] = useState<'pengantin' | 'acara' | 'kontrak' | 'laporan'>('pengantin');
  const { client, onBack } = props;

  if (!client) return <div>Client not found</div>;

  const tabs = [
    { id: 'pengantin', label: 'Pengantin' },
    { id: 'acara', label: 'Acara Pernikahan' },
    { id: 'kontrak', label: 'Kontrak Kerja' },
    { id: 'laporan', label: 'Laporan Pengantin & KPI' },
  ] as const;

  return (
    <div className="space-y-6 p-4">
        <button onClick={onBack} className="flex items-center text-sm text-brand-text-secondary hover:text-brand-text-primary">
            <ArrowLeftIcon className="w-4 h-4 mr-1" /> Kembali ke Daftar
        </button>
      <div className="border-b border-brand-border">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`${
                activeTab === tab.id
                  ? 'border-brand-accent text-brand-accent'
                  : 'border-transparent text-brand-text-secondary hover:text-brand-text-primary hover:border-brand-border'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="mt-6">
        {activeTab === 'pengantin' && <div>Konten Pengantin (Migrate from ClientDetailModal)</div>}
        {activeTab === 'acara' && <div>Konten Acara (Migrate from ClientDetailModal/ProjectsPage)</div>}
        {activeTab === 'kontrak' && <div>Konten Kontrak (Migrate from ContractsPage)</div>}
        {activeTab === 'laporan' && <div>Konten Laporan (Migrate from ClientKPI)</div>}
      </div>
    </div>
  );
};

export default ClientHubPage;
