import React from 'react';
import { Plus, Trash2, Package as PackageIcon } from 'lucide-react';
import { InvoiceLineItem } from '../types/invoiceForm';
import { Package } from '../../../types';
import RupiahInput from '../../../shared/form/RupiahInput';

interface InvoiceLineItemsEditorProps {
  items: InvoiceLineItem[];
  onAddItem: (item?: Partial<InvoiceLineItem>) => void;
  onUpdateItem: (id: string, field: 'description' | 'quantity' | 'unitPrice', value: string | number) => void;
  onRemoveItem: (id: string) => void;
  packages?: Package[];
}

const formatCurrency = (val: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(val || 0);

export const InvoiceLineItemsEditor: React.FC<InvoiceLineItemsEditorProps> = ({
  items,
  onAddItem,
  onUpdateItem,
  onRemoveItem,
  packages = [],
}) => {
  const [selectedPkgId, setSelectedPkgId] = React.useState('');

  const handlePackageSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const pkgId = e.target.value;
    if (!pkgId) return;
    const pkg = packages.find((p) => p.id === pkgId);
    if (pkg) {
      // Show digital deliverables; package notes are not invoice line details.
      const details: string[] = [];
      if (pkg.digitalItems && pkg.digitalItems.length > 0) {
        pkg.digitalItems.forEach((d) => { if (d) details.push(d); });
      }

      onAddItem({
        description: pkg.name,           // editable name — just the package name
        packageDetails: details,          // sub-list shown below, not editable
        quantity: 1,
        unitPrice: pkg.price || 0,
        totalPrice: pkg.price || 0,
        sourceType: 'package',
      });
      setSelectedPkgId('');
    }
  };

  const lineItemsSubtotal = items.reduce((sum, item) => sum + (item.totalPrice || 0), 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-brand-border">
        <div>
          <h4 className="text-sm font-bold text-brand-text-primary">
            Rincian Item / Layanan
          </h4>
          <p className="text-xs text-brand-text-secondary">
            Tentukan deskripsi item, kuantitas, dan harga satuan secara fleksibel
          </p>
        </div>

        {packages.length > 0 && (
          <div className="flex items-center gap-2">
            <PackageIcon className="w-4 h-4 text-brand-accent shrink-0" />
            <select
              value={selectedPkgId}
              onChange={handlePackageSelect}
              className="text-xs px-2.5 py-1.5 rounded-lg border border-brand-border bg-brand-surface text-brand-text-primary focus:outline-none focus:ring-1 focus:ring-brand-accent"
            >
              <option value="">+ Tambah dari Paket...</option>
              {packages.map((pkg) => (
                <option key={pkg.id} value={pkg.id}>
                  {pkg.name} — {formatCurrency(pkg.price)}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto rounded-xl border border-brand-border bg-brand-surface">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-brand-bg/60 text-brand-text-secondary border-b border-brand-border">
              <th className="py-2.5 px-3 text-center w-12 font-bold uppercase tracking-wider">No</th>
              <th className="py-2.5 px-3 text-left font-bold uppercase tracking-wider min-w-[240px]">
                Deskripsi Produk / Layanan
              </th>
              <th className="py-2.5 px-3 text-center w-24 font-bold uppercase tracking-wider">
                Qty
              </th>
              <th className="py-2.5 px-3 text-right w-44 font-bold uppercase tracking-wider">
                Harga Satuan (Rp)
              </th>
              <th className="py-2.5 px-3 text-right w-44 font-bold uppercase tracking-wider">
                Total (Rp)
              </th>
              <th className="py-2.5 px-3 text-center w-14 font-bold uppercase tracking-wider">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-border/60">
            {items.map((item, index) => (
              <tr key={item.id} className="hover:bg-brand-bg/30 transition-colors">
                <td className="py-2.5 px-3 text-center font-medium text-brand-text-secondary">
                  {index + 1}
                </td>
                <td className="py-2.5 px-3">
                  <input
                    type="text"
                    value={item.description}
                    onChange={(e) => onUpdateItem(item.id, 'description', e.target.value)}
                    placeholder="Nama paket atau rincian layanan..."
                    className="w-full px-3 py-1.5 rounded-lg border border-brand-border bg-brand-surface text-brand-text-primary placeholder:text-brand-text-secondary/50 focus:outline-none focus:ring-1 focus:ring-brand-accent text-xs"
                  />
                  {item.packageDetails && item.packageDetails.length > 0 && (
                    <ul className="mt-1.5 space-y-0.5 pl-1">
                      {item.packageDetails.map((detail, i) => (
                        <li key={i} className="flex items-start gap-1 text-[10px] text-brand-text-secondary leading-snug">
                          <span className="mt-0.5 shrink-0 text-brand-accent/60">•</span>
                          <span>{detail}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </td>
                <td className="py-2.5 px-3 text-center">
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={item.quantity}
                    onChange={(e) => {
                      const val = Math.max(1, parseInt(e.target.value, 10) || 1);
                      onUpdateItem(item.id, 'quantity', val);
                    }}
                    className="w-full text-center px-2 py-1.5 rounded-lg border border-brand-border bg-brand-surface text-brand-text-primary focus:outline-none focus:ring-1 focus:ring-brand-accent text-xs font-semibold"
                  />
                </td>
                <td className="py-2.5 px-3">
                  <RupiahInput
                    value={String(item.unitPrice || '')}
                    onChange={(rawVal) => {
                      const num = Number(rawVal) || 0;
                      onUpdateItem(item.id, 'unitPrice', num);
                    }}
                    placeholder="0"
                    className="w-full text-right px-3 py-1.5 rounded-lg border border-brand-border bg-brand-surface text-brand-text-primary focus:outline-none focus:ring-1 focus:ring-brand-accent text-xs font-medium"
                  />
                </td>
                <td className="py-2.5 px-3 text-right font-bold text-brand-text-primary whitespace-nowrap">
                  {formatCurrency(item.totalPrice)}
                </td>
                <td className="py-2.5 px-3 text-center">
                  <button
                    type="button"
                    onClick={() => onRemoveItem(item.id)}
                    disabled={items.length === 1}
                    className="p-1.5 rounded-lg text-brand-text-secondary hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
                    title="Hapus baris"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {items.map((item, index) => (
          <div
            key={item.id}
            className="p-3.5 rounded-xl border border-brand-border bg-brand-surface space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-brand-accent bg-brand-accent/10 px-2 py-0.5 rounded-full">
                Item #{index + 1}
              </span>
              <button
                type="button"
                onClick={() => onRemoveItem(item.id)}
                disabled={items.length === 1}
                className="p-1 text-red-400 hover:bg-red-500/10 rounded-md transition-colors disabled:opacity-30"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-brand-text-secondary">
                Deskripsi Produk / Layanan
              </label>
              <input
                type="text"
                value={item.description}
                onChange={(e) => onUpdateItem(item.id, 'description', e.target.value)}
                placeholder="Nama paket atau rincian layanan..."
                className="w-full px-3 py-2 rounded-lg border border-brand-border bg-brand-surface text-brand-text-primary text-xs focus:outline-none focus:ring-1 focus:ring-brand-accent"
              />
              {item.packageDetails && item.packageDetails.length > 0 && (
                <ul className="mt-1 space-y-0.5 pl-1">
                  {item.packageDetails.map((detail, i) => (
                    <li key={i} className="flex items-start gap-1 text-[10px] text-brand-text-secondary leading-snug">
                      <span className="mt-0.5 shrink-0 text-brand-accent/60">•</span>
                      <span>{detail}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-brand-text-secondary">
                  Jumlah (Qty)
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={item.quantity}
                  onChange={(e) => {
                    const val = Math.max(1, parseInt(e.target.value, 10) || 1);
                    onUpdateItem(item.id, 'quantity', val);
                  }}
                  className="w-full text-center px-3 py-2 rounded-lg border border-brand-border bg-brand-surface text-brand-text-primary text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-brand-accent"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-brand-text-secondary">
                  Harga Satuan (Rp)
                </label>
                <RupiahInput
                  value={String(item.unitPrice || '')}
                  onChange={(rawVal) => {
                    const num = Number(rawVal) || 0;
                    onUpdateItem(item.id, 'unitPrice', num);
                  }}
                  placeholder="0"
                  className="w-full text-right px-3 py-2 rounded-lg border border-brand-border bg-brand-surface text-brand-text-primary text-xs font-medium focus:outline-none focus:ring-1 focus:ring-brand-accent"
                />
              </div>
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-brand-border/60 text-xs">
              <span className="text-brand-text-secondary font-medium">Subtotal Item:</span>
              <span className="font-black text-brand-text-primary text-sm">
                {formatCurrency(item.totalPrice)}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Footer / Add button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        <button
          type="button"
          onClick={() => onAddItem()}
          className="button-secondary inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-bold"
        >
          <Plus className="w-4 h-4 text-brand-accent" />
          <span>Tambah Item Baru</span>
        </button>

        <div className="text-right text-xs bg-brand-bg/60 px-3.5 py-2 rounded-xl border border-brand-border">
          <span className="text-brand-text-secondary mr-2">
            Subtotal {items.length} Item:
          </span>
          <span className="text-sm font-black text-brand-text-primary">
            {formatCurrency(lineItemsSubtotal)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default InvoiceLineItemsEditor;
