import React from 'react';
import { Client, Project, Transaction } from '../../../types';
import { formatCurrency } from '../../../utils/currency';

interface ClientInfoViewProps {
  client: Client;
  projects: Project[];
  transactions: Transaction[];
}

export const ClientInfoView: React.FC<ClientInfoViewProps> = ({ client, projects, transactions }) => {
  const clientProjects = projects.filter(p => p.clientId === client.id);
  
  const totalCost = clientProjects.reduce((sum, p) => sum + p.totalCost, 0);
  const totalPaid = clientProjects.reduce((sum, p) => sum + p.amountPaid, 0);
  const outstanding = totalCost - totalPaid;

  return (
    <div className="max-w-2xl py-8 space-y-10">
      <div>
        <h3 className="text-lg font-semibold text-[#1F2937] mb-6">Informasi Pengantin</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-wider text-[#6B7280] font-medium">Nama Lengkap</p>
            <p className="text-base text-[#111827]">{client.name}</p>
          </div>
          
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-wider text-[#6B7280] font-medium">WhatsApp</p>
            <p className="text-base text-[#111827]">{client.whatsapp}</p>
          </div>

          <div className="space-y-1">
            <p className="text-xs uppercase tracking-wider text-[#6B7280] font-medium">Status</p>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium solid-teal text-white">
              {client.status}
            </span>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-[#1F2937] mb-6">Ringkasan Pembayaran</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
            <p className="text-xs uppercase tracking-wider text-[#6B7280] font-medium mb-1">Total Nilai Acara</p>
            <p className="text-xl font-bold text-[#111827]">{formatCurrency(totalCost)}</p>
          </div>
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
            <p className="text-xs uppercase tracking-wider text-[#6B7280] font-medium mb-1">Sudah Dibayar</p>
            <p className="text-xl font-bold text-emerald-600">{formatCurrency(totalPaid)}</p>
          </div>
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
            <p className="text-xs uppercase tracking-wider text-[#6B7280] font-medium mb-1">Sisa Pembayaran</p>
            <p className={`text-xl font-bold ${outstanding > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
              {formatCurrency(outstanding)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
