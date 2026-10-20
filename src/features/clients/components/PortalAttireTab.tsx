import React, { useState, useEffect, useMemo } from 'react';
import {
  Client,
  Profile,
  AttireRecord,
  AttireCatalogItem,
  AttireMainCategory,
  AttireSelectionStatus,
  AttireMeasurements,
} from '../../../types';
import {
  listAttireRecords,
  createAttireRecord,
  updateAttireRecord,
} from '../../../services/attireRecords';
import {
  listAttireCatalog,
  ATTIRE_CATEGORIES,
} from '../../../services/attireCatalog';
import {
  ShirtIcon,
  CheckCircle2Icon,
  ClockIcon,
  AlertCircleIcon,
  RulerIcon,
  SparklesIcon,
  PrinterIcon,
  MessageSquareIcon,
  ChevronRightIcon,
  SearchIcon,
  EyeIcon,
  CheckIcon,
  PlusIcon,
  XIcon,
} from 'lucide-react';

interface PortalAttireTabProps {
  client: Client;
  profile: Profile;
  showNotification?: (msg: string) => void;
}

const MAIN_CATEGORIES: AttireMainCategory[] = [
  'Gaun Pengantin',
  'Busana Orang Tua',
  'Busana Saudara',
  'Aksesori',
];

export const PortalAttireTab: React.FC<PortalAttireTabProps> = ({
  client,
  profile,
  showNotification,
}) => {
  const [records, setRecords] = useState<AttireRecord[]>([]);
  const [catalog, setCatalog] = useState<AttireCatalogItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeCategory, setActiveCategory] = useState<string>('Semua');

  // Sub-tabs in Portal Attire: 'terpilih' (Selected Attire) vs 'katalog' (Explore Vendor Catalog)
  const [portalAttireView, setPortalAttireView] = useState<'terpilih' | 'katalog'>('terpilih');

  // Catalog browser search & filter
  const [catalogSearch, setCatalogSearch] = useState<string>('');
  const [catalogCategory, setCatalogCategory] = useState<string>('Semua');

  // Client measurement form modal
  const [isMeasurementModalOpen, setIsMeasurementModalOpen] = useState<boolean>(false);
  const [selectedRecordForMeasurement, setSelectedRecordForMeasurement] = useState<AttireRecord | null>(null);
  const [inputChest, setInputChest] = useState<string>('');
  const [inputWaist, setInputWaist] = useState<string>('');
  const [inputHips, setInputHips] = useState<string>('');
  const [inputShoulder, setInputShoulder] = useState<string>('');
  const [inputSleeve, setInputSleeve] = useState<string>('');
  const [inputLength, setInputLength] = useState<string>('');
  const [inputHeight, setInputHeight] = useState<string>('');
  const [inputWeight, setInputWeight] = useState<string>('');
  const [inputShoes, setInputShoes] = useState<string>('');
  const [inputNotes, setInputNotes] = useState<string>('');
  const [isSubmittingMeasurement, setIsSubmittingMeasurement] = useState<boolean>(false);

  // Detail preview modal
  const [previewPhotoUrl, setPreviewPhotoUrl] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [recData, catData] = await Promise.all([
        listAttireRecords(client.id),
        listAttireCatalog(),
      ]);
      setRecords(recData);
      setCatalog(catData);
    } catch (e) {
      console.error('[PortalAttireTab] Failed to load attire data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (client?.id) {
      loadData();
    }
  }, [client?.id]);

  // Filtered records
  const filteredRecords = useMemo(() => {
    if (activeCategory === 'Semua') return records;
    return records.filter(r => r.mainCategory === activeCategory || r.category === activeCategory);
  }, [records, activeCategory]);

  // Filtered catalog
  const filteredCatalog = useMemo(() => {
    return catalog.filter(item => {
      if (catalogCategory !== 'Semua' && item.mainCategory !== catalogCategory) {
        return false;
      }
      if (catalogSearch.trim()) {
        const q = catalogSearch.toLowerCase();
        const matchName = item.name.toLowerCase().includes(q);
        const matchColor = item.color.toLowerCase().includes(q);
        const matchModel = (item.model || '').toLowerCase().includes(q);
        const matchSub = item.subcategory.toLowerCase().includes(q);
        if (!matchName && !matchColor && !matchModel && !matchSub) return false;
      }
      return true;
    });
  }, [catalog, catalogCategory, catalogSearch]);

  // Quick stats
  const stats = useMemo(() => {
    const total = records.length;
    const dipilihCount = records.filter(r => (r.selectionStatus || r.status) === 'Dipilih').length;
    const cadanganCount = records.filter(r => (r.selectionStatus || r.status) === 'Cadangan').length;
    const gaunCount = records.filter(r => r.mainCategory === 'Gaun Pengantin' || r.category?.includes('Gaun')).length;
    return { total, dipilihCount, cadanganCount, gaunCount };
  }, [records]);

  // Handle client selecting an item from the vendor catalog
  const handleSelectFromCatalog = async (item: AttireCatalogItem, asStatus: AttireSelectionStatus) => {
    try {
      await createAttireRecord({
        clientId: client.id,
        personName: client.name,
        personRole: item.mainCategory === 'Gaun Pengantin' ? 'Pengantin' : 'Saudara',
        mainCategory: item.mainCategory,
        subcategory: item.subcategory,
        category: item.subcategory as any,
        itemName: item.name,
        model: item.model || '',
        color: item.color || '',
        size: item.size || 'All Size',
        priceType: item.priceType || 'Sewa',
        rentalPrice: item.rentalPrice || 0,
        selectionStatus: asStatus,
        status: asStatus,
        fittingNotes: `Dipilih oleh pengantin dari Portal pada ${new Date().toLocaleDateString('id-ID')}`,
        photoUrl: item.photoUrl || '',
        measurements: item.measurements || {},
      });

      if (showNotification) {
        showNotification(`Busana "${item.name}" berhasil ditambahkan ke daftar Anda!`);
      }
      loadData();
      setPortalAttireView('terpilih');
    } catch (e) {
      console.error('[PortalAttireTab] Failed to add item from catalog:', e);
      if (showNotification) showNotification('Gagal menambahkan busana');
    }
  };

  // Open measurement input modal
  const handleOpenMeasurementModal = (rec: AttireRecord) => {
    setSelectedRecordForMeasurement(rec);
    const m = rec.measurements || {};
    setInputChest(m.chest ? m.chest.toString() : '');
    setInputWaist(m.waist ? m.waist.toString() : '');
    setInputHips(m.hips ? m.hips.toString() : '');
    setInputShoulder(m.shoulder ? m.shoulder.toString() : '');
    setInputSleeve(m.sleeveLength ? m.sleeveLength.toString() : '');
    setInputLength(m.shirtLength ? m.shirtLength.toString() : '');
    setInputHeight(m.height ? m.height.toString() : '');
    setInputWeight(m.weight ? m.weight.toString() : '');
    setInputShoes(m.shoesSize || '');
    setInputNotes(m.customNotes || '');
    setIsMeasurementModalOpen(true);
  };

  // Submit client measurements
  const handleSaveMeasurements = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecordForMeasurement) return;

    setIsSubmittingMeasurement(true);
    const newMeasurements: AttireMeasurements = {
      chest: inputChest ? Number(inputChest) : undefined,
      waist: inputWaist ? Number(inputWaist) : undefined,
      hips: inputHips ? Number(inputHips) : undefined,
      shoulder: inputShoulder ? Number(inputShoulder) : undefined,
      sleeveLength: inputSleeve ? Number(inputSleeve) : undefined,
      shirtLength: inputLength ? Number(inputLength) : undefined,
      height: inputHeight ? Number(inputHeight) : undefined,
      weight: inputWeight ? Number(inputWeight) : undefined,
      shoesSize: inputShoes || undefined,
      customNotes: inputNotes || undefined,
    };

    try {
      await updateAttireRecord(selectedRecordForMeasurement.id, {
        measurements: newMeasurements,
        fittingNotes: `${selectedRecordForMeasurement.fittingNotes || ''}\n[Update Ukuran Pengantin: ${new Date().toLocaleDateString('id-ID')}]`.trim(),
      });

      if (showNotification) {
        showNotification('Ukuran fitting Anda berhasil dikirim ke vendor!');
      }
      setIsMeasurementModalOpen(false);
      loadData();
    } catch (e) {
      console.error('[PortalAttireTab] Failed to save measurements:', e);
      if (showNotification) showNotification('Gagal menyimpan ukuran');
    } finally {
      setIsSubmittingMeasurement(false);
    }
  };

  // WhatsApp consultation link
  const vendorPhone = profile?.phone || '085693994277';
  const cleanPhone = vendorPhone.replace(/\D/g, '');
  const formattedPhone = cleanPhone.startsWith('0') ? '62' + cleanPhone.slice(1) : cleanPhone;
  const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(
    `Halo ${profile.companyName || 'Vendor'}, saya ${client.name}. Saya ingin konsultasi mengenai fitting busana & gaun pernikahan saya di Portal Pengantin.`
  )}`;

  const getStatusBadge = (s: AttireSelectionStatus | string) => {
    switch (s) {
      case 'Dipilih':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2Icon className="w-3.5 h-3.5 text-emerald-600" /> Pilihan Utama
          </span>
        );
      case 'Cadangan':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-black bg-amber-100 text-amber-800 border border-amber-300">
            <ClockIcon className="w-3.5 h-3.5 text-amber-600" /> Pilihan Cadangan
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-black bg-slate-100 text-slate-700 border border-slate-300">
            <AlertCircleIcon className="w-3.5 h-3.5 text-slate-500" /> Belum Dipilih
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="portal-card rounded-3xl p-5 sm:p-6 portal-animate portal-animate-1 bg-gradient-to-br from-white to-pink-50/40 border border-pink-100/80 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-2xl bg-pink-100 text-pink-700 flex items-center justify-center font-bold shadow-xs">
                <ShirtIcon className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-pink-600">
                  Fitting & Katalog Pengantin
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-zinc-900 leading-tight">
                  Pilihan Busana & Gaun Pernikahan
                </h2>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-zinc-500 max-w-xl">
              Lihat pilihan gaun akad, resepsi, busana orang tua, saudara/bridesmaid, serta catatan ukuran fitting tubuh Anda.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
            >
              <MessageSquareIcon className="w-4 h-4" /> Konsultasi Fitting (WA)
            </a>
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50 rounded-xl text-xs font-semibold shadow-xs transition-colors"
            >
              <PrinterIcon className="w-4 h-4 text-zinc-500" /> Cetak Lembar Fitting
            </button>
          </div>
        </div>

        {/* 4 KPI Summary Counters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-pink-100/60">
          <div className="bg-white/80 p-3 rounded-2xl border border-zinc-100">
            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Total Busana</p>
            <p className="text-xl font-black text-zinc-900 mt-0.5">{stats.total} Item</p>
          </div>
          <div className="bg-white/80 p-3 rounded-2xl border border-zinc-100">
            <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Pilihan Utama</p>
            <p className="text-xl font-black text-emerald-700 mt-0.5">{stats.dipilihCount} Busana</p>
          </div>
          <div className="bg-white/80 p-3 rounded-2xl border border-zinc-100">
            <p className="text-[10px] font-bold uppercase tracking-wider text-amber-600">Pilihan Cadangan</p>
            <p className="text-xl font-black text-amber-700 mt-0.5">{stats.cadanganCount} Busana</p>
          </div>
          <div className="bg-white/80 p-3 rounded-2xl border border-zinc-100">
            <p className="text-[10px] font-bold uppercase tracking-wider text-pink-600">Gaun Pengantin</p>
            <p className="text-xl font-black text-pink-700 mt-0.5">{stats.gaunCount} Gaun</p>
          </div>
        </div>
      </div>

      {/* View Switcher: Busana Terpilih vs Jelajahi Katalog Vendor */}
      <div className="flex items-center justify-between gap-3 bg-white p-2 rounded-2xl border border-zinc-200 shadow-xs">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setPortalAttireView('terpilih')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              portalAttireView === 'terpilih'
                ? 'bg-zinc-900 text-white shadow-xs'
                : 'text-zinc-600 hover:bg-zinc-100'
            }`}
          >
            👰 Busana Terpilih Anda ({records.length})
          </button>
          <button
            onClick={() => setPortalAttireView('katalog')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              portalAttireView === 'katalog'
                ? 'bg-zinc-900 text-white shadow-xs'
                : 'text-zinc-600 hover:bg-zinc-100'
            }`}
          >
            <SparklesIcon className="w-3.5 h-3.5 text-pink-500" />
            Jelajahi Katalog Vendor ({catalog.length})
          </button>
        </div>

        <span className="text-[11px] text-zinc-400 font-medium hidden sm:inline mr-2">
          {portalAttireView === 'terpilih' ? 'Data busana & fitting Anda' : 'Koleksi busana resmi vendor'}
        </span>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          VIEW 1: BUSANA TERPILIH PENGANTIN
      ══════════════════════════════════════════════════════════════════ */}
      {portalAttireView === 'terpilih' && (
        <div className="space-y-4">
          {/* Category Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 bg-white p-2 rounded-2xl border border-zinc-200">
            <button
              onClick={() => setActiveCategory('Semua')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeCategory === 'Semua' ? 'bg-pink-600 text-white shadow-xs' : 'text-zinc-600 hover:bg-zinc-100'
              }`}
            >
              Semua ({records.length})
            </button>
            {MAIN_CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  activeCategory === cat ? 'bg-pink-600 text-white shadow-xs' : 'text-zinc-600 hover:bg-zinc-100'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="py-16 text-center text-sm text-zinc-400 portal-card rounded-3xl">
              Memuat pilihan busana Anda...
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="portal-card rounded-3xl p-8 sm:p-12 text-center space-y-3 bg-white border border-zinc-200">
              <ShirtIcon className="w-12 h-12 text-zinc-300 mx-auto" />
              <h3 className="text-base font-black text-zinc-800">Belum ada busana tercatat</h3>
              <p className="text-xs text-zinc-500 max-w-md mx-auto">
                Anda belum memilih busana atau gaun pernikahan. Jelajahi katalog resmi kami untuk memilih gaun akad, resepsi, dan busana keluarga.
              </p>
              <button
                onClick={() => setPortalAttireView('katalog')}
                className="mt-2 inline-flex items-center gap-2 px-5 py-2.5 bg-pink-600 text-white rounded-xl text-xs font-bold shadow-xs hover:bg-pink-700 transition-colors"
              >
                <SparklesIcon className="w-4 h-4" /> Buka Katalog Busana Vendor
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredRecords.map(rec => {
                const m = rec.measurements || {};
                const selStatus = rec.selectionStatus || rec.status || 'Dipilih';
                const hasMeasurements = Boolean(
                  m.chest || m.waist || m.hips || m.shoulder || m.sleeveLength ||
                  m.shirtLength || m.height || m.weight || m.shoesSize
                );

                return (
                  <div
                    key={rec.id}
                    className="portal-card rounded-3xl p-5 bg-white border border-zinc-200 shadow-xs flex flex-col justify-between space-y-4 hover:shadow-md transition-shadow"
                  >
                    <div>
                      {/* Top Header & Role */}
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-pink-100 text-pink-700">
                              {rec.personRole}
                            </span>
                            <span className="text-xs font-bold text-zinc-500">{rec.personName}</span>
                          </div>
                          <h3 className="text-base font-black text-zinc-900 mt-1">{rec.itemName}</h3>
                          <p className="text-xs text-zinc-500">
                            {rec.mainCategory || 'Gaun Pengantin'} • {rec.subcategory || rec.category}
                            {rec.color ? ` • ${rec.color}` : ''}
                            {rec.size ? ` • Ukuran: ${rec.size}` : ''}
                          </p>
                        </div>
                        <div>{getStatusBadge(selStatus)}</div>
                      </div>

                      {/* Photo Preview */}
                      {rec.photoUrl && (
                        <div
                          onClick={() => setPreviewPhotoUrl(rec.photoUrl || null)}
                          className="mt-3 relative h-40 w-full rounded-2xl overflow-hidden bg-zinc-100 border border-zinc-200 cursor-pointer group"
                        >
                          <img
                            src={rec.photoUrl}
                            alt={rec.itemName}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold">
                            <EyeIcon className="w-4 h-4 mr-1" /> Perbesar Foto
                          </div>
                        </div>
                      )}

                      {/* Body Measurements Display */}
                      <div className="mt-3 bg-zinc-50 p-3 rounded-2xl border border-zinc-200/80 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black uppercase tracking-wider text-zinc-500 flex items-center gap-1">
                            <RulerIcon className="w-3.5 h-3.5 text-pink-600" /> Ukuran Tubuh Fitting (cm/kg):
                          </span>
                          <button
                            onClick={() => handleOpenMeasurementModal(rec)}
                            className="text-[10px] font-bold text-pink-600 hover:underline"
                          >
                            + Update Ukuran
                          </button>
                        </div>

                        {hasMeasurements ? (
                          <div className="grid grid-cols-3 gap-2 text-xs">
                            {m.chest && (
                              <div className="bg-white p-1.5 rounded-lg border border-zinc-100">
                                <span className="text-[9px] text-zinc-400 block font-semibold">Dada</span>
                                <span className="font-extrabold text-zinc-800">{m.chest} cm</span>
                              </div>
                            )}
                            {m.waist && (
                              <div className="bg-white p-1.5 rounded-lg border border-zinc-100">
                                <span className="text-[9px] text-zinc-400 block font-semibold">Pinggang</span>
                                <span className="font-extrabold text-zinc-800">{m.waist} cm</span>
                              </div>
                            )}
                            {m.hips && (
                              <div className="bg-white p-1.5 rounded-lg border border-zinc-100">
                                <span className="text-[9px] text-zinc-400 block font-semibold">Pinggul</span>
                                <span className="font-extrabold text-zinc-800">{m.hips} cm</span>
                              </div>
                            )}
                            {m.shoulder && (
                              <div className="bg-white p-1.5 rounded-lg border border-zinc-100">
                                <span className="text-[9px] text-zinc-400 block font-semibold">Bahu</span>
                                <span className="font-extrabold text-zinc-800">{m.shoulder} cm</span>
                              </div>
                            )}
                            {m.sleeveLength && (
                              <div className="bg-white p-1.5 rounded-lg border border-zinc-100">
                                <span className="text-[9px] text-zinc-400 block font-semibold">Lengan</span>
                                <span className="font-extrabold text-zinc-800">{m.sleeveLength} cm</span>
                              </div>
                            )}
                            {m.shirtLength && (
                              <div className="bg-white p-1.5 rounded-lg border border-zinc-100">
                                <span className="text-[9px] text-zinc-400 block font-semibold">P. Baju</span>
                                <span className="font-extrabold text-zinc-800">{m.shirtLength} cm</span>
                              </div>
                            )}
                            {m.height && (
                              <div className="bg-white p-1.5 rounded-lg border border-zinc-100">
                                <span className="text-[9px] text-zinc-400 block font-semibold">Tinggi</span>
                                <span className="font-extrabold text-zinc-800">{m.height} cm</span>
                              </div>
                            )}
                            {m.weight && (
                              <div className="bg-white p-1.5 rounded-lg border border-zinc-100">
                                <span className="text-[9px] text-zinc-400 block font-semibold">Berat</span>
                                <span className="font-extrabold text-zinc-800">{m.weight} kg</span>
                              </div>
                            )}
                            {m.shoesSize && (
                              <div className="bg-white p-1.5 rounded-lg border border-zinc-100">
                                <span className="text-[9px] text-zinc-400 block font-semibold">Sepatu</span>
                                <span className="font-extrabold text-zinc-800">{m.shoesSize}</span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-[11px] text-zinc-400 italic py-1">
                            Belum ada rincian ukuran tubuh. Klik &quot;+ Update Ukuran&quot; untuk mengisi lingkar badan Anda.
                          </div>
                        )}

                        {m.customNotes && (
                          <div className="text-[10px] text-zinc-600 pt-1 border-t border-zinc-100">
                            <strong>Catatan Ukuran:</strong> {m.customNotes}
                          </div>
                        )}
                      </div>

                      {/* Fitting Notes from Vendor */}
                      {rec.fittingNotes && (
                        <div className="mt-3 bg-amber-50/70 p-3 rounded-2xl border border-amber-200 text-xs text-amber-900">
                          <strong className="block text-[10px] uppercase tracking-wider text-amber-800 mb-0.5">
                            Catatan Fitting & Permak:
                          </strong>
                          {rec.fittingNotes}
                        </div>
                      )}
                    </div>

                    {/* Bottom Action Footer */}
                    <div className="pt-3 border-t border-zinc-100 flex items-center justify-between">
                      <span className="text-[10px] text-zinc-400">
                        {rec.rentalPrice && rec.rentalPrice > 0
                          ? `Harga Sewa: Rp ${rec.rentalPrice.toLocaleString('id-ID')}`
                          : 'Termasuk Paket Busana'}
                      </span>
                      <button
                        onClick={() => handleOpenMeasurementModal(rec)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-zinc-900 text-white rounded-xl text-xs font-bold hover:bg-zinc-800 transition-colors shadow-xs"
                      >
                        <RulerIcon className="w-3.5 h-3.5" /> Input Ukuran Badan
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          VIEW 2: JELAJAHI KATALOG BUSANA VENDOR
      ══════════════════════════════════════════════════════════════════ */}
      {portalAttireView === 'katalog' && (
        <div className="space-y-4">
          {/* Controls: Search and Categories */}
          <div className="bg-white p-4 rounded-3xl border border-zinc-200 shadow-xs space-y-3">
            <div className="flex flex-wrap items-center gap-1.5 border-b border-zinc-100 pb-3">
              <button
                onClick={() => setCatalogCategory('Semua')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  catalogCategory === 'Semua' ? 'bg-zinc-900 text-white shadow-xs' : 'text-zinc-600 hover:bg-zinc-100'
                }`}
              >
                Semua Koleksi ({catalog.length})
              </button>
              {MAIN_CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setCatalogCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    catalogCategory === cat ? 'bg-pink-600 text-white shadow-xs' : 'text-zinc-600 hover:bg-zinc-100'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="relative">
              <SearchIcon className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari gaun pengantin, kebaya ibu, jas beskap, atau mahkota..."
                value={catalogSearch}
                onChange={e => setCatalogSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-900 font-medium focus:outline-none focus:bg-white"
              />
            </div>
          </div>

          {/* Catalog Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCatalog.map(item => (
              <div
                key={item.id}
                className="portal-card rounded-3xl overflow-hidden bg-white border border-zinc-200 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow group"
              >
                <div>
                  <div
                    onClick={() => setPreviewPhotoUrl(item.photoUrl || null)}
                    className="relative h-44 w-full bg-zinc-100 cursor-pointer overflow-hidden"
                  >
                    {item.photoUrl ? (
                      <img
                        src={item.photoUrl}
                        alt={item.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-zinc-400">
                        <ShirtIcon className="w-10 h-10 opacity-40" />
                      </div>
                    )}
                    <span className="absolute top-2 left-2 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider bg-black/70 text-white backdrop-blur-xs">
                      {item.subcategory}
                    </span>
                  </div>

                  <div className="p-4 space-y-2">
                    <h4 className="font-black text-sm text-zinc-900 leading-snug line-clamp-1">{item.name}</h4>
                    <p className="text-xs text-zinc-500">
                      {item.model ? `Model: ${item.model} • ` : ''}
                      {item.color} • Ukuran: {item.size}
                    </p>

                    <div className="pt-2 border-t border-zinc-100 flex items-baseline justify-between">
                      <span className="text-[10px] text-zinc-400 font-bold uppercase">Harga {item.priceType}:</span>
                      <span className="text-xs font-black text-pink-600">
                        Rp {item.rentalPrice.toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Choose button */}
                <div className="p-3 bg-zinc-50 border-t border-zinc-100 flex gap-2">
                  <button
                    onClick={() => handleSelectFromCatalog(item, 'Dipilih')}
                    className="flex-1 py-1.5 bg-pink-600 hover:bg-pink-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
                  >
                    + Pilih Utama
                  </button>
                  <button
                    onClick={() => handleSelectFromCatalog(item, 'Cadangan')}
                    className="px-3 py-1.5 bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-100 rounded-xl text-xs font-bold transition-colors"
                  >
                    Cadangan
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          MODAL: INPUT / UPDATE UKURAN FITTING PENGANTIN
      ══════════════════════════════════════════════════════════════════ */}
      {isMeasurementModalOpen && selectedRecordForMeasurement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-pink-600">
                  Form Ukuran Fitting Pengantin
                </span>
                <h3 className="text-base font-black text-zinc-900 mt-0.5">
                  Ukuran Tubuh: {selectedRecordForMeasurement.itemName}
                </h3>
                <p className="text-[11px] text-zinc-500">
                  Pemakai: {selectedRecordForMeasurement.personName} ({selectedRecordForMeasurement.personRole})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsMeasurementModalOpen(false)}
                className="p-2 text-zinc-400 hover:text-zinc-700 rounded-full hover:bg-zinc-100"
              >
                <XIcon className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMeasurements} className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-zinc-600 mb-1">Lingkar Dada (cm)</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="86"
                    value={inputChest}
                    onChange={e => setInputChest(e.target.value)}
                    className="w-full p-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-semibold text-zinc-800"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-zinc-600 mb-1">Lingkar Pinggang (cm)</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="70"
                    value={inputWaist}
                    onChange={e => setInputWaist(e.target.value)}
                    className="w-full p-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-semibold text-zinc-800"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-zinc-600 mb-1">Lingkar Pinggul (cm)</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="92"
                    value={inputHips}
                    onChange={e => setInputHips(e.target.value)}
                    className="w-full p-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-semibold text-zinc-800"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-zinc-600 mb-1">Lebar Bahu (cm)</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="38"
                    value={inputShoulder}
                    onChange={e => setInputShoulder(e.target.value)}
                    className="w-full p-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-semibold text-zinc-800"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-zinc-600 mb-1">Panjang Lengan (cm)</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="54"
                    value={inputSleeve}
                    onChange={e => setInputSleeve(e.target.value)}
                    className="w-full p-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-semibold text-zinc-800"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-zinc-600 mb-1">Panjang Baju/Gaun (cm)</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="140"
                    value={inputLength}
                    onChange={e => setInputLength(e.target.value)}
                    className="w-full p-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-semibold text-zinc-800"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-zinc-600 mb-1">Tinggi Badan (cm)</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="165"
                    value={inputHeight}
                    onChange={e => setInputHeight(e.target.value)}
                    className="w-full p-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-semibold text-zinc-800"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-zinc-600 mb-1">Berat Badan (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="52"
                    value={inputWeight}
                    onChange={e => setInputWeight(e.target.value)}
                    className="w-full p-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-semibold text-zinc-800"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-zinc-600 mb-1">Ukuran Sepatu (EU)</label>
                  <input
                    type="text"
                    placeholder="38"
                    value={inputShoes}
                    onChange={e => setInputShoes(e.target.value)}
                    className="w-full p-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-semibold text-zinc-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-600 mb-1">
                  Catatan Proporsi / Permintaan Khusus
                </label>
                <textarea
                  rows={2}
                  placeholder="Misal: Lengan longgar untuk wudhu, bagian dada minta furing tertutup, dll."
                  value={inputNotes}
                  onChange={e => setInputNotes(e.target.value)}
                  className="w-full p-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-medium text-zinc-800 focus:outline-none focus:bg-white resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setIsMeasurementModalOpen(false)}
                  className="px-4 py-2 border border-zinc-200 rounded-xl text-xs font-semibold text-zinc-600 hover:bg-zinc-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingMeasurement}
                  className="px-5 py-2 bg-pink-600 text-white rounded-xl text-xs font-bold hover:bg-pink-700 transition-colors shadow-xs disabled:opacity-50"
                >
                  {isSubmittingMeasurement ? 'Menyimpan...' : 'Kirim Ukuran ke Vendor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Photo Zoom Modal */}
      {previewPhotoUrl && (
        <div
          onClick={() => setPreviewPhotoUrl(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm cursor-zoom-out"
        >
          <div className="max-w-2xl w-full max-h-[85vh] rounded-3xl overflow-hidden bg-black p-2 relative shadow-2xl">
            <button
              onClick={() => setPreviewPhotoUrl(null)}
              className="absolute top-4 right-4 p-2 bg-white/20 text-white rounded-full hover:bg-white/40"
            >
              <XIcon className="w-5 h-5" />
            </button>
            <img src={previewPhotoUrl} alt="Preview Foto" className="w-full h-auto max-h-[80vh] object-contain rounded-2xl mx-auto" />
          </div>
        </div>
      )}
    </div>
  );
};

export default PortalAttireTab;
