import React, { useState, useEffect, useMemo } from 'react';
import {
  Client,
  AttireRecord,
  AttireStatus,
  AttireMainCategory,
  AttireSelectionStatus,
  AttirePriceType,
  AttireMeasurements,
  AttireCatalogItem,
  ViewType,
  NavigationAction,
} from '../../../types';
import {
  listAttireRecords,
  createAttireRecord,
  updateAttireRecord,
  deleteAttireRecord,
} from '../../../services/attireRecords';
import {
  listAttireCatalog,
  ATTIRE_CATEGORIES,
  uploadAttirePhoto,
} from '../../../services/attireCatalog';
import {
  PlusIcon,
  Trash2Icon,
  PencilIcon,
  PrinterIcon,
  ShirtIcon,
  CheckCircle2Icon,
  ClockIcon,
  AlertCircleIcon,
  RulerIcon,
  SparklesIcon,
  ExternalLinkIcon,
  SearchIcon,
  XIcon,
  CheckIcon,
  UploadCloudIcon,
  ImageIcon,
  CameraIcon,
  LinkIcon,
} from 'lucide-react';

interface ClientAttireTabProps {
  client: Client;
  showNotification: (msg: string) => void;
  handleNavigation?: (view: ViewType, action?: NavigationAction) => void;
}

const ROLES: ('Pengantin' | 'Ayah' | 'Ibu' | 'Saudara' | 'Bridesmaid' | 'Groomsmen' | 'Aksesori')[] = [
  'Pengantin',
  'Ayah',
  'Ibu',
  'Saudara',
  'Bridesmaid',
  'Groomsmen',
  'Aksesori',
];

const SELECTION_STATUSES: AttireSelectionStatus[] = ['Dipilih', 'Cadangan', 'Belum Dipilih'];
const MAIN_CATEGORIES: AttireMainCategory[] = [
  'Gaun Pengantin',
  'Busana Orang Tua',
  'Busana Saudara',
  'Aksesori',
];

export const ClientAttireTab: React.FC<ClientAttireTabProps> = ({ client, showNotification, handleNavigation }) => {
  const [records, setRecords] = useState<AttireRecord[]>([]);
  const [catalog, setCatalog] = useState<AttireCatalogItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isCatalogPickerOpen, setIsCatalogPickerOpen] = useState<boolean>(false);
  const [editingRecord, setEditingRecord] = useState<AttireRecord | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('Semua');

  // Catalog picker search & filter
  const [pickerSearch, setPickerSearch] = useState<string>('');
  const [pickerCategory, setPickerCategory] = useState<string>('Semua');
  const [pickerTargetRole, setPickerTargetRole] = useState<'Pengantin' | 'Ayah' | 'Ibu' | 'Saudara' | 'Bridesmaid' | 'Groomsmen' | 'Aksesori'>('Pengantin');
  const [pickerTargetPerson, setPickerTargetPerson] = useState<string>(client.name);
  const [pickerSelectionStatus, setPickerSelectionStatus] = useState<AttireSelectionStatus>('Dipilih');

  // Form state
  const [personName, setPersonName] = useState<string>('');
  const [personRole, setPersonRole] = useState<'Pengantin' | 'Ayah' | 'Ibu' | 'Saudara' | 'Bridesmaid' | 'Groomsmen' | 'Aksesori'>('Pengantin');
  const [mainCategory, setMainCategory] = useState<AttireMainCategory>('Gaun Pengantin');
  const [subcategory, setSubcategory] = useState<string>(ATTIRE_CATEGORIES['Gaun Pengantin'][0]);
  const [itemName, setItemName] = useState<string>('');
  const [model, setModel] = useState<string>('');
  const [color, setColor] = useState<string>('');
  const [size, setSize] = useState<string>('All Size');
  const [priceType, setPriceType] = useState<AttirePriceType>('Sewa');
  const [rentalPrice, setRentalPrice] = useState<string>('');
  const [selectionStatus, setSelectionStatus] = useState<AttireSelectionStatus>('Dipilih');
  const [status, setStatus] = useState<AttireStatus>('Dipilih');
  const [fittingNotes, setFittingNotes] = useState<string>('');
  const [photoUrl, setPhotoUrl] = useState<string>('');
  const [isUploadingPhoto, setIsUploadingPhoto] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string>('');
  const [showManualUrlInput, setShowManualUrlInput] = useState<boolean>(false);
  const [isDraggingPhoto, setIsDraggingPhoto] = useState<boolean>(false);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const handleUploadPhotoFile = async (file: File) => {
    if (!file) return;
    setIsUploadingPhoto(true);
    setUploadError('');
    try {
      const url = await uploadAttirePhoto(file);
      setPhotoUrl(url);
      showNotification('Foto busana berhasil diunggah!');
    } catch (err: any) {
      console.error('Upload photo error:', err);
      setUploadError(err.message || 'Gagal mengunggah foto busana.');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handlePhotoFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleUploadPhotoFile(file);
    }
  };

  const handleDropPhoto = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingPhoto(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleUploadPhotoFile(file);
    }
  };

  // Measurements state
  const [chest, setChest] = useState<string>('');
  const [waist, setWaist] = useState<string>('');
  const [hips, setHips] = useState<string>('');
  const [shoulder, setShoulder] = useState<string>('');
  const [sleeveLength, setSleeveLength] = useState<string>('');
  const [shirtLength, setShirtLength] = useState<string>('');
  const [armCircumference, setArmCircumference] = useState<string>('');
  const [height, setHeight] = useState<string>('');
  const [weight, setWeight] = useState<string>('');
  const [shoesSize, setShoesSize] = useState<string>('');
  const [customNotes, setCustomNotes] = useState<string>('');
  const [showMeasurementsForm, setShowMeasurementsForm] = useState<boolean>(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await listAttireRecords(client.id);
      setRecords(data);
    } catch (err) {
      console.error('Failed to load attire records', err);
      showNotification('Gagal memuat data busana & attire');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    listAttireCatalog().then(setCatalog);
    if (client?.id) {
      loadData();
    }
  }, [client?.id]);

  const handleMainCategoryChange = (cat: AttireMainCategory) => {
    setMainCategory(cat);
    const subcats = ATTIRE_CATEGORIES[cat] || [];
    if (subcats.length > 0) {
      setSubcategory(subcats[0]);
    }
  };

  const handleOpenAddModal = (defaultRole?: 'Pengantin' | 'Ayah' | 'Ibu' | 'Saudara' | 'Bridesmaid' | 'Groomsmen' | 'Aksesori') => {
    setEditingRecord(null);
    let targetCat: AttireMainCategory = 'Gaun Pengantin';
    if (defaultRole === 'Ayah' || defaultRole === 'Ibu') {
      targetCat = 'Busana Orang Tua';
    } else if (defaultRole === 'Saudara' || defaultRole === 'Bridesmaid' || defaultRole === 'Groomsmen') {
      targetCat = 'Busana Saudara';
    } else if (defaultRole === 'Aksesori') {
      targetCat = 'Aksesori';
    }

    setPersonName(defaultRole ? `${defaultRole} - ${client.name}` : client.name);
    setPersonRole(defaultRole || 'Pengantin');
    setMainCategory(targetCat);
    setSubcategory(ATTIRE_CATEGORIES[targetCat][0]);
    setItemName('');
    setModel('');
    setColor('');
    setSize('All Size');
    setPriceType('Sewa');
    setRentalPrice('');
    setSelectionStatus('Dipilih');
    setStatus('Dipilih');
    setFittingNotes('');
    setPhotoUrl('');
    setIsUploadingPhoto(false);
    setUploadError('');
    setShowManualUrlInput(false);
    setIsDraggingPhoto(false);
    setChest('');
    setWaist('');
    setHips('');
    setShoulder('');
    setSleeveLength('');
    setShirtLength('');
    setArmCircumference('');
    setHeight('');
    setWeight('');
    setShoesSize('');
    setCustomNotes('');
    setShowMeasurementsForm(false);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (rec: AttireRecord) => {
    setEditingRecord(rec);
    setPersonName(rec.personName);
    setPersonRole(rec.personRole);
    setMainCategory(rec.mainCategory || 'Gaun Pengantin');
    setSubcategory(rec.subcategory || (rec.category as string) || ATTIRE_CATEGORIES['Gaun Pengantin'][0]);
    setItemName(rec.itemName);
    setModel(rec.model || '');
    setColor(rec.color || '');
    setSize(rec.size || 'All Size');
    setPriceType(rec.priceType || 'Sewa');
    setRentalPrice(rec.rentalPrice ? rec.rentalPrice.toString() : '');
    setSelectionStatus(rec.selectionStatus || (rec.status === 'Dipilih' ? 'Dipilih' : rec.status === 'Cadangan' ? 'Cadangan' : 'Belum Dipilih'));
    setStatus(rec.status);
    setFittingNotes(rec.fittingNotes || '');
    setPhotoUrl(rec.photoUrl || '');

    const m = rec.measurements || {};
    setChest(m.chest !== undefined ? m.chest.toString() : '');
    setWaist(m.waist !== undefined ? m.waist.toString() : '');
    setHips(m.hips !== undefined ? m.hips.toString() : '');
    setShoulder(m.shoulder !== undefined ? m.shoulder.toString() : '');
    setSleeveLength(m.sleeveLength !== undefined ? m.sleeveLength.toString() : '');
    setShirtLength(m.shirtLength !== undefined ? m.shirtLength.toString() : '');
    setArmCircumference(m.armCircumference !== undefined ? m.armCircumference.toString() : '');
    setHeight(m.height !== undefined ? m.height.toString() : '');
    setWeight(m.weight !== undefined ? m.weight.toString() : '');
    setShoesSize(m.shoesSize || '');
    setCustomNotes(m.customNotes || '');

    setShowMeasurementsForm(
      Boolean(
        m.chest || m.waist || m.hips || m.shoulder || m.sleeveLength ||
        m.shirtLength || m.height || m.weight || m.shoesSize || m.customNotes
      )
    );

    setIsModalOpen(true);
  };

  const handleSelectCatalogItem = (selectedId: string) => {
    const item = catalog.find(i => i.id === selectedId);
    if (!item) return;

    setItemName(item.name);
    setMainCategory(item.mainCategory);
    setSubcategory(item.subcategory);
    setModel(item.model || '');
    setColor(item.color || '');
    setSize(item.size || 'All Size');
    setPriceType(item.priceType || 'Sewa');
    setRentalPrice(item.rentalPrice ? item.rentalPrice.toString() : '');
    setPhotoUrl(item.photoUrl || '');
    if (item.fittingNotes) {
      setFittingNotes(item.fittingNotes);
    }
    if (item.measurements) {
      const m = item.measurements;
      setChest(m.chest !== undefined ? m.chest.toString() : '');
      setWaist(m.waist !== undefined ? m.waist.toString() : '');
      setHips(m.hips !== undefined ? m.hips.toString() : '');
      setShoulder(m.shoulder !== undefined ? m.shoulder.toString() : '');
      setSleeveLength(m.sleeveLength !== undefined ? m.sleeveLength.toString() : '');
      setShirtLength(m.shirtLength !== undefined ? m.shirtLength.toString() : '');
      setHeight(m.height !== undefined ? m.height.toString() : '');
      setWeight(m.weight !== undefined ? m.weight.toString() : '');
      setShoesSize(m.shoesSize || '');
      setCustomNotes(m.customNotes || '');
      setShowMeasurementsForm(true);
    }
  };

  // Instant Picker from Catalog Modal
  const handlePickFromCatalog = async (item: AttireCatalogItem) => {
    try {
      await createAttireRecord({
        clientId: client.id,
        personName: pickerTargetPerson.trim() || client.name,
        personRole: pickerTargetRole,
        mainCategory: item.mainCategory,
        subcategory: item.subcategory,
        category: item.subcategory as any,
        itemName: item.name,
        model: item.model || '',
        color: item.color || '',
        size: item.size || 'All Size',
        priceType: item.priceType || 'Sewa',
        rentalPrice: item.rentalPrice || 0,
        selectionStatus: pickerSelectionStatus,
        status: pickerSelectionStatus,
        fittingNotes: item.fittingNotes || '',
        photoUrl: item.photoUrl || '',
        measurements: item.measurements || {},
      });
      showNotification(`Busana "${item.name}" berhasil ditambahkan untuk ${pickerTargetPerson || client.name}!`);
      setIsCatalogPickerOpen(false);
      loadData();
    } catch (e) {
      console.error('Failed to pick attire from catalog:', e);
      showNotification('Gagal menambahkan busana dari katalog');
    }
  };

  const handleQuickStatusChange = async (rec: AttireRecord, newStatus: AttireSelectionStatus) => {
    try {
      await updateAttireRecord(rec.id, { selectionStatus: newStatus, status: newStatus });
      setRecords(prev => prev.map(r => r.id === rec.id ? { ...r, selectionStatus: newStatus, status: newStatus } : r));
      showNotification(`Status busana diperbarui: ${newStatus}`);
    } catch (e) {
      console.error('Failed to update status:', e);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName.trim()) {
      showNotification('Nama / model busana wajib diisi');
      return;
    }

    const measurements: AttireMeasurements = {
      chest: chest ? Number(chest) : undefined,
      waist: waist ? Number(waist) : undefined,
      hips: hips ? Number(hips) : undefined,
      shoulder: shoulder ? Number(shoulder) : undefined,
      sleeveLength: sleeveLength ? Number(sleeveLength) : undefined,
      shirtLength: shirtLength ? Number(shirtLength) : undefined,
      armCircumference: armCircumference ? Number(armCircumference) : undefined,
      height: height ? Number(height) : undefined,
      weight: weight ? Number(weight) : undefined,
      shoesSize: shoesSize || undefined,
      customNotes: customNotes || undefined,
    };

    try {
      if (editingRecord) {
        await updateAttireRecord(editingRecord.id, {
          personName,
          personRole,
          mainCategory,
          subcategory,
          category: subcategory as any,
          itemName,
          model,
          color,
          size,
          priceType,
          rentalPrice: rentalPrice ? Number(rentalPrice) : 0,
          selectionStatus,
          status,
          fittingNotes,
          photoUrl,
          measurements,
        });
        showNotification('Catatan busana berhasil diperbarui');
      } else {
        await createAttireRecord({
          clientId: client.id,
          personName,
          personRole,
          mainCategory,
          subcategory,
          category: subcategory as any,
          itemName,
          model,
          color,
          size,
          priceType,
          rentalPrice: rentalPrice ? Number(rentalPrice) : 0,
          selectionStatus,
          status,
          fittingNotes,
          photoUrl,
          measurements,
        });
        showNotification('Catatan busana berhasil ditambahkan');
      }
      setIsModalOpen(false);
      loadData();
    } catch (err) {
      console.error('Failed to save attire record', err);
      showNotification('Gagal menyimpan data busana');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Hapus catatan busana dan ukuran ini?')) return;
    try {
      await deleteAttireRecord(id);
      showNotification('Catatan busana dihapus');
      loadData();
    } catch (err) {
      console.error('Failed to delete attire record', err);
      showNotification('Gagal menghapus data');
    }
  };

  const filteredRecords = useMemo(() => {
    if (filterCategory === 'Semua') return records;
    return records.filter(r => r.mainCategory === filterCategory || r.category === filterCategory);
  }, [records, filterCategory]);

  const filteredPickerCatalog = useMemo(() => {
    return catalog.filter(item => {
      if (pickerCategory !== 'Semua' && item.mainCategory !== pickerCategory) {
        return false;
      }
      if (pickerSearch.trim()) {
        const q = pickerSearch.toLowerCase();
        const matchName = item.name.toLowerCase().includes(q);
        const matchColor = item.color.toLowerCase().includes(q);
        const matchSubcat = item.subcategory.toLowerCase().includes(q);
        const matchModel = (item.model || '').toLowerCase().includes(q);
        if (!matchName && !matchColor && !matchSubcat && !matchModel) return false;
      }
      return true;
    });
  }, [catalog, pickerCategory, pickerSearch]);

  const getStatusBadge = (s: AttireSelectionStatus) => {
    switch (s) {
      case 'Dipilih':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2Icon className="w-3 h-3 text-emerald-600" /> Dipilih
          </span>
        );
      case 'Cadangan':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
            <ClockIcon className="w-3 h-3 text-amber-600" /> Cadangan
          </span>
        );
      case 'Belum Dipilih':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-300">
            <AlertCircleIcon className="w-3 h-3 text-slate-500" /> Belum Dipilih
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Actions & Direct Sync Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-brand-surface p-4 rounded-xl border border-brand-border">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-brand-text-primary flex items-center gap-2">
              <ShirtIcon className="w-5 h-5 text-brand-accent" />
              Pilihan Busana & Fitting ({client.name})
            </h3>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              Sinkron ke Katalog Busana
            </span>
          </div>
          <p className="text-xs text-brand-text-secondary mt-0.5">
            Daftar gaun pengantin (akad, resepsi, tambahan), busana ortu, saudara, & aksesori pilihan dengan ukuran fitting.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {handleNavigation && (
            <button
              onClick={() => handleNavigation(ViewType.ATTIRE_MANAGEMENT)}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-brand-bg border border-brand-border rounded-lg text-xs font-semibold text-brand-text-primary hover:bg-brand-surface transition-colors"
              title="Buka Menu Katalog Busana & Attire (/#/Busana%20%26%20Attire)"
            >
              <ExternalLinkIcon className="w-4 h-4 text-brand-accent" /> Buka Katalog Utama
            </button>
          )}
          <button
            onClick={() => {
              setPickerTargetPerson(client.name);
              setPickerTargetRole('Pengantin');
              setPickerSelectionStatus('Dipilih');
              setIsCatalogPickerOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg text-xs font-bold hover:opacity-90 shadow-xs"
          >
            <SparklesIcon className="w-4 h-4" /> Pilih dari Katalog Busana
          </button>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-brand-bg border border-brand-border rounded-lg text-xs font-semibold text-brand-text-primary hover:bg-brand-surface transition-colors"
          >
            <PrinterIcon className="w-4 h-4" /> Cetak Lembar Fitting
          </button>
          <button
            onClick={() => handleOpenAddModal('Pengantin')}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-brand-accent text-white rounded-lg text-xs font-semibold hover:opacity-90 transition-opacity shadow-xs"
          >
            <PlusIcon className="w-4 h-4" /> Input Busana Manual
          </button>
        </div>
      </div>

      {/* Quick Role Shortcut Buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
        {ROLES.map(role => (
          <button
            key={role}
            onClick={() => handleOpenAddModal(role)}
            className="p-2.5 bg-brand-surface border border-brand-border rounded-xl text-center hover:border-brand-accent hover:shadow-xs transition-all text-xs font-semibold text-brand-text-primary flex flex-col items-center gap-1"
          >
            <span className="w-7 h-7 rounded-lg bg-brand-accent/10 text-brand-accent flex items-center justify-center font-bold text-xs">
              {role.charAt(0)}
            </span>
            <span>{role}</span>
            <span className="text-[10px] text-brand-text-secondary font-normal">+ Tambah</span>
          </button>
        ))}
      </div>

      {/* Category filter tabs */}
      <div className="flex flex-wrap items-center gap-1.5 bg-brand-surface p-2 rounded-xl border border-brand-border text-xs">
        <button
          onClick={() => setFilterCategory('Semua')}
          className={`px-3 py-1 rounded-lg font-semibold transition-all ${
            filterCategory === 'Semua' ? 'bg-brand-accent text-white' : 'text-brand-text-secondary hover:text-brand-text-primary'
          }`}
        >
          Semua ({records.length})
        </button>
        {MAIN_CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setFilterCategory(cat)}
            className={`px-3 py-1 rounded-lg font-semibold transition-all ${
              filterCategory === cat ? 'bg-brand-accent text-white' : 'text-brand-text-secondary hover:text-brand-text-primary'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Attire Records List */}
      {loading ? (
        <div className="py-12 text-center text-sm text-brand-text-secondary">Memuat data busana & attire...</div>
      ) : filteredRecords.length === 0 ? (
        <div className="text-center py-12 bg-brand-surface border border-brand-border rounded-xl p-8">
          <ShirtIcon className="w-10 h-10 mx-auto text-brand-text-secondary opacity-40 mb-2" />
          <h4 className="text-sm font-bold text-brand-text-primary">Belum ada pilihan busana tercatat untuk {client.name}</h4>
          <p className="text-xs text-brand-text-secondary mt-1 max-w-md mx-auto">
            Buka katalog busana untuk memilih gaun akad, gaun resepsi, busana ortu, saudara, atau aksesori pernikahan.
          </p>
          <div className="mt-4 flex items-center justify-center gap-2">
            <button
              onClick={() => setIsCatalogPickerOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg text-xs font-bold shadow-xs hover:opacity-90"
            >
              <SparklesIcon className="w-4 h-4" /> Pilih dari Katalog Busana
            </button>
            <button
              onClick={() => handleOpenAddModal('Pengantin')}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-bg border border-brand-border rounded-lg text-xs font-semibold text-brand-text-primary"
            >
              <PlusIcon className="w-4 h-4" /> Input Busana Manual
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredRecords.map(rec => {
            const m = rec.measurements || {};
            const selStatus = rec.selectionStatus || (rec.status === 'Dipilih' ? 'Dipilih' : rec.status === 'Cadangan' ? 'Cadangan' : 'Belum Dipilih');

            return (
              <div key={rec.id} className="bg-brand-surface border border-brand-border rounded-xl p-4 flex flex-col justify-between shadow-xs">
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-brand-accent/10 text-brand-accent border border-brand-accent/20">
                          {rec.personRole}
                        </span>
                        <span className="text-xs font-semibold text-brand-text-secondary">{rec.personName}</span>
                      </div>
                      <h4 className="text-sm font-bold text-brand-text-primary mt-1">{rec.itemName}</h4>
                      <p className="text-xs text-brand-text-secondary">
                        {rec.mainCategory || 'Gaun Pengantin'} • {rec.subcategory || rec.category}
                        {rec.color ? ` • Warna: ${rec.color}` : ''}
                        {rec.size ? ` • Ukuran: ${rec.size}` : ''}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {getStatusBadge(selStatus)}
                      {/* Quick status switch buttons */}
                      <div className="flex gap-1 mt-1">
                        {SELECTION_STATUSES.map(st => (
                          <button
                            key={st}
                            onClick={() => handleQuickStatusChange(rec, st)}
                            className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                              selStatus === st
                                ? 'bg-gray-800 text-white'
                                : 'bg-brand-bg text-brand-text-secondary hover:text-brand-text-primary border border-brand-border'
                            }`}
                          >
                            {st === 'Dipilih' ? 'Dipilih' : st === 'Cadangan' ? 'Cadang' : 'Belum'}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {rec.photoUrl && (
                    <div className="mt-3 overflow-hidden rounded-lg border border-brand-border h-36 bg-brand-bg">
                      <img src={rec.photoUrl} alt={rec.itemName} className="w-full h-full object-cover" />
                    </div>
                  )}

                  {/* Measurements Summary */}
                  {(m.chest || m.waist || m.height || m.weight || m.shoesSize || m.customNotes) && (
                    <div className="mt-3 bg-brand-bg/60 p-2.5 rounded-lg border border-brand-border text-xs space-y-1">
                      <span className="font-bold text-[10px] uppercase tracking-wider text-brand-text-secondary flex items-center gap-1">
                        <RulerIcon className="w-3 h-3 text-brand-accent" />
                        Ukuran Tubuh Fitting (cm/kg):
                      </span>
                      <div className="grid grid-cols-3 gap-2 text-brand-text-primary mt-1">
                        {m.chest && <div>Dada: <strong className="font-semibold">{m.chest} cm</strong></div>}
                        {m.waist && <div>Pinggang: <strong className="font-semibold">{m.waist} cm</strong></div>}
                        {m.hips && <div>Pinggul: <strong className="font-semibold">{m.hips} cm</strong></div>}
                        {m.shoulder && <div>Bahu: <strong className="font-semibold">{m.shoulder} cm</strong></div>}
                        {m.sleeveLength && <div>Lengan: <strong className="font-semibold">{m.sleeveLength} cm</strong></div>}
                        {m.shirtLength && <div>P. Baju: <strong className="font-semibold">{m.shirtLength} cm</strong></div>}
                        {m.height && <div>Tinggi: <strong className="font-semibold">{m.height} cm</strong></div>}
                        {m.weight && <div>Berat: <strong className="font-semibold">{m.weight} kg</strong></div>}
                        {m.shoesSize && <div>Sepatu: <strong className="font-semibold">{m.shoesSize}</strong></div>}
                      </div>
                      {m.customNotes && (
                        <div className="pt-1 text-[11px] text-brand-text-secondary italic">Catatan Ukuran: {m.customNotes}</div>
                      )}
                    </div>
                  )}

                  {rec.rentalPrice && rec.rentalPrice > 0 ? (
                    <div className="mt-3 text-xs font-bold text-brand-accent">
                      Harga {rec.priceType || 'Sewa'}: Rp {rec.rentalPrice.toLocaleString('id-ID')}
                    </div>
                  ) : null}

                  {rec.fittingNotes && (
                    <div className="mt-2 text-xs text-brand-text-secondary bg-brand-bg p-2 rounded-lg border border-brand-border">
                      <strong className="text-brand-text-primary">Catatan Fitting:</strong> {rec.fittingNotes}
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-brand-border flex items-center justify-between">
                  <span className="text-[10px] text-brand-text-secondary">
                    Diperbarui: {new Date(rec.updatedAt).toLocaleDateString('id-ID')}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenEditModal(rec)}
                      className="p-1.5 bg-brand-bg hover:bg-brand-accent/10 hover:text-brand-accent rounded-lg border border-brand-border text-brand-text-secondary transition-colors"
                      title="Edit"
                    >
                      <PencilIcon className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(rec.id)}
                      className="p-1.5 bg-brand-bg hover:bg-red-50 hover:text-red-600 rounded-lg border border-brand-border text-brand-text-secondary transition-colors"
                      title="Hapus"
                    >
                      <Trash2Icon className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL: PILIH DARI KATALOG BUSANA */}
      {isCatalogPickerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-brand-surface border border-brand-border rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-brand-border pb-4">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-brand-accent">
                  Sinkronisasi Katalog Busana & Attire (/#/Busana%20%26%20Attire)
                </span>
                <h3 className="text-lg font-black text-brand-text-primary mt-0.5">
                  Pilih Busana untuk {client.name}
                </h3>
              </div>
              <button
                onClick={() => setIsCatalogPickerOpen(false)}
                className="p-2 text-brand-text-secondary hover:text-brand-text-primary rounded-full hover:bg-brand-bg"
              >
                <XIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Target Person & Role Config for Selection */}
            <div className="p-3 bg-brand-bg/70 rounded-2xl border border-brand-border grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-brand-text-secondary mb-1">
                  Peran / Subjek
                </label>
                <select
                  value={pickerTargetRole}
                  onChange={e => {
                    const role = e.target.value as any;
                    setPickerTargetRole(role);
                    if (role === 'Pengantin') {
                      setPickerTargetPerson(client.name);
                    } else {
                      setPickerTargetPerson(`${role} - ${client.name}`);
                    }
                  }}
                  className="w-full px-2.5 py-1.5 bg-brand-surface border border-brand-border rounded-xl text-xs font-semibold text-brand-text-primary"
                >
                  {ROLES.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-brand-text-secondary mb-1">
                  Nama Pemakai
                </label>
                <input
                  type="text"
                  value={pickerTargetPerson}
                  onChange={e => setPickerTargetPerson(e.target.value)}
                  placeholder="Nama pemakai"
                  className="w-full px-2.5 py-1.5 bg-brand-surface border border-brand-border rounded-xl text-xs font-semibold text-brand-text-primary"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-brand-text-secondary mb-1">
                  Status Pilihan
                </label>
                <select
                  value={pickerSelectionStatus}
                  onChange={e => setPickerSelectionStatus(e.target.value as AttireSelectionStatus)}
                  className="w-full px-2.5 py-1.5 bg-brand-surface border border-brand-border rounded-xl text-xs font-bold text-brand-text-primary"
                >
                  <option value="Dipilih">Dipilih (Utama)</option>
                  <option value="Cadangan">Cadangan</option>
                  <option value="Belum Dipilih">Belum Dipilih</option>
                </select>
              </div>
            </div>

            {/* Catalog Filter Controls */}
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  onClick={() => setPickerCategory('Semua')}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                    pickerCategory === 'Semua' ? 'bg-brand-accent text-white' : 'bg-brand-bg text-brand-text-secondary'
                  }`}
                >
                  Semua ({catalog.length})
                </button>
                {MAIN_CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setPickerCategory(cat)}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                      pickerCategory === cat ? 'bg-brand-accent text-white' : 'bg-brand-bg text-brand-text-secondary'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div className="relative">
                <SearchIcon className="w-4 h-4 text-brand-text-secondary absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari busana di katalog..."
                  value={pickerSearch}
                  onChange={e => setPickerSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-brand-bg border border-brand-border rounded-xl text-xs text-brand-text-primary"
                />
              </div>
            </div>

            {/* Catalog Items Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 max-h-[50vh] overflow-y-auto pr-1">
              {filteredPickerCatalog.map(item => (
                <div
                  key={item.id}
                  className="bg-brand-surface border border-brand-border rounded-2xl p-3 flex flex-col justify-between hover:border-brand-accent hover:shadow-xs transition-all"
                >
                  <div className="space-y-2">
                    <div className="relative h-32 w-full rounded-xl overflow-hidden bg-brand-bg">
                      {item.photoUrl ? (
                        <img src={item.photoUrl} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-brand-text-secondary">
                          <ShirtIcon className="w-8 h-8 opacity-40" />
                        </div>
                      )}
                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-black/70 text-white">
                        {item.subcategory}
                      </span>
                    </div>

                    <div>
                      <h4 className="font-bold text-xs text-brand-text-primary line-clamp-1">{item.name}</h4>
                      <p className="text-[11px] text-brand-text-secondary">
                        {item.model ? `${item.model} • ` : ''}{item.color} • {item.size}
                      </p>
                      <p className="text-xs font-extrabold text-brand-accent mt-0.5">
                        Rp {item.rentalPrice.toLocaleString('id-ID')} ({item.priceType})
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handlePickFromCatalog(item)}
                    className="mt-3 w-full py-1.5 bg-brand-accent text-white rounded-xl text-xs font-bold hover:opacity-90 flex items-center justify-center gap-1.5 transition-opacity"
                  >
                    <CheckIcon className="w-3.5 h-3.5" /> Pilih Busana Ini
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal Add / Edit Attire Record (Manual Form) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-brand-surface border border-brand-border rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6">
            <div className="flex items-center justify-between border-b border-brand-border pb-4 mb-4">
              <h3 className="text-lg font-bold text-brand-text-primary">
                {editingRecord ? 'Edit Pilihan Busana & Fitting' : 'Tambah Pilihan Busana & Fitting'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-brand-text-secondary hover:text-brand-text-primary font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              {/* Quick Select from Catalog */}
              <div>
                <label className="block text-xs font-bold text-brand-text-secondary mb-1">
                  Ambil dari Katalog Busana (Data otomatis tersinkronisasi)
                </label>
                <select
                  className="w-full px-3 py-2 bg-brand-bg border border-brand-border rounded-xl text-xs text-brand-text-primary font-medium focus:outline-none focus:border-brand-accent"
                  onChange={e => handleSelectCatalogItem(e.target.value)}
                >
                  <option value="">-- Pilih dari Katalog Busana --</option>
                  {catalog.map(item => (
                    <option key={item.id} value={item.id}>
                      [{item.mainCategory}] {item.name} - {item.subcategory} (Rp {item.rentalPrice.toLocaleString('id-ID')})
                    </option>
                  ))}
                </select>
              </div>

              {/* Subject & Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-brand-text-secondary mb-1">Peran / Subjek *</label>
                  <select
                    value={personRole}
                    onChange={e => setPersonRole(e.target.value as any)}
                    className="w-full px-3 py-2 bg-brand-bg border border-brand-border rounded-xl text-xs text-brand-text-primary font-medium focus:outline-none focus:border-brand-accent"
                  >
                    {ROLES.map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-brand-text-secondary mb-1">Nama Pemakai *</label>
                  <input
                    type="text"
                    value={personName}
                    onChange={e => setPersonName(e.target.value)}
                    placeholder="Contoh: Shilla (Pengantin) / Ibu Nurul"
                    className="w-full px-3 py-2 bg-brand-bg border border-brand-border rounded-xl text-xs text-brand-text-primary font-medium focus:outline-none focus:border-brand-accent"
                    required
                  />
                </div>
              </div>

              {/* Main Category & Subcategory */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-brand-text-secondary mb-1">Kategori Utama *</label>
                  <select
                    value={mainCategory}
                    onChange={e => handleMainCategoryChange(e.target.value as AttireMainCategory)}
                    className="w-full px-3 py-2 bg-brand-bg border border-brand-border rounded-xl text-xs text-brand-text-primary font-medium focus:outline-none focus:border-brand-accent"
                  >
                    {MAIN_CATEGORIES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-brand-text-secondary mb-1">Subkategori Busana *</label>
                  <select
                    value={subcategory}
                    onChange={e => setSubcategory(e.target.value)}
                    className="w-full px-3 py-2 bg-brand-bg border border-brand-border rounded-xl text-xs text-brand-text-primary font-medium focus:outline-none focus:border-brand-accent"
                  >
                    {(ATTIRE_CATEGORIES[mainCategory] || []).map(sc => (
                      <option key={sc} value={sc}>{sc}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Item Name & Model */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-brand-text-secondary mb-1">Nama Busana *</label>
                  <input
                    type="text"
                    value={itemName}
                    onChange={e => setItemName(e.target.value)}
                    placeholder="Contoh: Kebaya Akad Brokat Broken White"
                    className="w-full px-3 py-2 bg-brand-bg border border-brand-border rounded-xl text-xs text-brand-text-primary font-medium focus:outline-none focus:border-brand-accent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-brand-text-secondary mb-1">Model Busana</label>
                  <input
                    type="text"
                    value={model}
                    onChange={e => setModel(e.target.value)}
                    placeholder="Contoh: Mermaid Ekor / Beskap Sikepan"
                    className="w-full px-3 py-2 bg-brand-bg border border-brand-border rounded-xl text-xs text-brand-text-primary font-medium focus:outline-none focus:border-brand-accent"
                  />
                </div>
              </div>

              {/* Color, Size, Price */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-brand-text-secondary mb-1">Warna</label>
                  <input
                    type="text"
                    value={color}
                    onChange={e => setColor(e.target.value)}
                    placeholder="Broken White / Sage"
                    className="w-full px-3 py-2 bg-brand-bg border border-brand-border rounded-xl text-xs text-brand-text-primary font-medium focus:outline-none focus:border-brand-accent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-brand-text-secondary mb-1">Ukuran Pakaian</label>
                  <input
                    type="text"
                    value={size}
                    onChange={e => setSize(e.target.value)}
                    placeholder="All Size / M / Custom"
                    className="w-full px-3 py-2 bg-brand-bg border border-brand-border rounded-xl text-xs text-brand-text-primary font-medium focus:outline-none focus:border-brand-accent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-brand-text-secondary mb-1">Harga Sewa / Biaya (Rp)</label>
                  <input
                    type="number"
                    value={rentalPrice}
                    onChange={e => setRentalPrice(e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-2 bg-brand-bg border border-brand-border rounded-xl text-xs text-brand-text-primary font-medium focus:outline-none focus:border-brand-accent"
                  />
                </div>
              </div>

              {/* Status Pilihan & Photo URL */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-brand-text-secondary mb-1">Status Pilihan</label>
                  <select
                    value={selectionStatus}
                    onChange={e => {
                      const val = e.target.value as AttireSelectionStatus;
                      setSelectionStatus(val);
                      setStatus(val as any);
                    }}
                    className="w-full px-3 py-2 bg-brand-bg border border-brand-border rounded-xl text-xs font-bold text-brand-text-primary focus:outline-none focus:border-brand-accent"
                  >
                    {SELECTION_STATUSES.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Foto Busana: Upload File & Preview */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-1.5 text-xs font-bold text-brand-text-primary">
                    <ImageIcon className="w-4 h-4 text-brand-accent" />
                    <span>Foto Busana</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-brand-accent/10 text-brand-accent border border-brand-accent/20">
                      Upload Gambar
                    </span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowManualUrlInput(!showManualUrlInput)}
                    className="text-[11px] text-brand-text-secondary hover:text-brand-accent font-medium flex items-center gap-1 transition-colors"
                  >
                    <LinkIcon className="w-3 h-3" />
                    {showManualUrlInput ? 'Sembunyikan Opsi URL' : 'Opsi URL Manual'}
                  </button>
                </div>

                {/* Hidden File Input */}
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoFileInput}
                />

                {/* Upload Error Banner */}
                {uploadError && (
                  <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-2 text-xs text-red-500">
                    <AlertCircleIcon className="w-4 h-4 shrink-0" />
                    <span>{uploadError}</span>
                  </div>
                )}

                {/* Upload Area / Preview */}
                {photoUrl ? (
                  <div className="relative p-3.5 bg-brand-bg border border-brand-border rounded-2xl flex flex-col sm:flex-row items-center gap-4">
                    <div className="relative group w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden bg-brand-bg/80 border border-brand-border shrink-0 shadow-sm">
                      <img
                        src={photoUrl}
                        alt="Preview Busana"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1594552072238-b8a33785b261?auto=format&fit=crop&w=800&q=80';
                        }}
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          title="Ganti Foto"
                          className="p-1.5 bg-white text-gray-800 rounded-lg hover:bg-gray-100 shadow"
                        >
                          <PencilIcon className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="flex-1 w-full text-center sm:text-left space-y-2">
                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">
                          <CheckIcon className="w-3.5 h-3.5" />
                          Foto Terpasang
                        </span>
                        {isUploadingPhoto && (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-brand-accent/15 text-brand-accent animate-pulse">
                            Mengunggah...
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-brand-text-secondary line-clamp-1 break-all">
                        {photoUrl.startsWith('data:') ? 'Foto tersimpan secara lokal (Base64)' : photoUrl}
                      </p>
                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isUploadingPhoto}
                          className="px-3 py-1.5 rounded-xl bg-brand-bg border border-brand-border text-xs font-semibold text-brand-text-primary hover:bg-brand-border/40 transition-colors inline-flex items-center gap-1.5 shadow-sm"
                        >
                          <CameraIcon className="w-3.5 h-3.5 text-brand-accent" />
                          Ganti Foto
                        </button>
                        <button
                          type="button"
                          onClick={() => setPhotoUrl('')}
                          disabled={isUploadingPhoto}
                          className="px-3 py-1.5 rounded-xl bg-red-500/10 border border-red-500/30 text-xs font-semibold text-red-500 hover:bg-red-500/20 transition-colors inline-flex items-center gap-1.5"
                        >
                          <Trash2Icon className="w-3.5 h-3.5" />
                          Hapus Foto
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div
                    onDragOver={(e) => { e.preventDefault(); setIsDraggingPhoto(true); }}
                    onDragLeave={() => setIsDraggingPhoto(false)}
                    onDrop={handleDropPhoto}
                    onClick={() => !isUploadingPhoto && fileInputRef.current?.click()}
                    className={`relative border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-all ${
                      isDraggingPhoto
                        ? 'border-brand-accent bg-brand-accent/10 scale-[1.01]'
                        : 'border-brand-border bg-brand-bg/50 hover:bg-brand-bg hover:border-brand-accent/50'
                    }`}
                  >
                    {isUploadingPhoto ? (
                      <div className="py-4 space-y-2 flex flex-col items-center">
                        <div className="w-8 h-8 border-2 border-brand-accent border-t-transparent rounded-full animate-spin" />
                        <p className="text-xs font-bold text-brand-text-primary">Mengunggah & mengompres foto busana...</p>
                        <p className="text-[11px] text-brand-text-secondary">Mohon tunggu sebentar</p>
                      </div>
                    ) : (
                      <div className="space-y-2 flex flex-col items-center">
                        <div className="w-10 h-10 rounded-2xl bg-brand-accent/10 text-brand-accent flex items-center justify-center shadow-sm">
                          <UploadCloudIcon className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-brand-text-primary">
                            Klik untuk upload foto busana
                          </p>
                          <p className="text-[11px] text-brand-text-secondary mt-0.5">
                            atau seret & letakkan file foto di sini
                          </p>
                        </div>
                        <div className="flex items-center gap-2 pt-1">
                          <span className="px-2.5 py-1 rounded-lg bg-brand-bg border border-brand-border text-[11px] font-semibold text-brand-text-primary shadow-sm inline-flex items-center gap-1">
                            <CameraIcon className="w-3 h-3 text-brand-accent" />
                            Pilih Foto (JPG, PNG, WEBP)
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Optional manual URL input */}
                {showManualUrlInput && (
                  <div className="p-3 bg-brand-bg/80 rounded-xl space-y-2 border border-brand-border">
                    <label className="block text-[11px] font-bold text-brand-text-secondary">
                      Atau Tempel Tautan URL Gambar Manual:
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        placeholder="https://images.unsplash.com/..."
                        value={photoUrl}
                        onChange={e => setPhotoUrl(e.target.value)}
                        className="flex-1 px-3 py-1.5 bg-brand-bg border border-brand-border rounded-lg text-xs font-medium text-brand-text-primary focus:outline-none focus:border-brand-accent"
                      />
                      {photoUrl && (
                        <button
                          type="button"
                          onClick={() => setPhotoUrl('')}
                          className="px-2 py-1 text-xs text-red-500 hover:bg-red-500/10 rounded-lg"
                        >
                          Hapus
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Toggle Ukuran Fitting */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setShowMeasurementsForm(!showMeasurementsForm)}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-accent hover:underline"
                >
                  <RulerIcon className="w-4 h-4" />
                  {showMeasurementsForm ? 'Sembunyikan Lembar Ukuran Fitting' : '+ Isi Lembar Ukuran Tubuh Fitting (cm/kg)'}
                </button>
              </div>

              {/* Measurements Section */}
              {showMeasurementsForm && (
                <div className="border-t border-brand-border pt-4 mt-2 bg-brand-bg/60 p-3 rounded-xl border">
                  <h4 className="text-xs font-bold text-brand-text-primary uppercase tracking-wider mb-3">
                    Ukuran Tubuh Pemakai (cm / kg)
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-[11px] text-brand-text-secondary mb-1">Lingkar Dada (cm)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={chest}
                        onChange={e => setChest(e.target.value)}
                        placeholder="86"
                        className="w-full px-3 py-1.5 bg-brand-bg border border-brand-border rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-brand-text-secondary mb-1">Lingkar Pinggang (cm)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={waist}
                        onChange={e => setWaist(e.target.value)}
                        placeholder="70"
                        className="w-full px-3 py-1.5 bg-brand-bg border border-brand-border rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-brand-text-secondary mb-1">Lingkar Pinggul (cm)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={hips}
                        onChange={e => setHips(e.target.value)}
                        placeholder="92"
                        className="w-full px-3 py-1.5 bg-brand-bg border border-brand-border rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-brand-text-secondary mb-1">Lebar Bahu (cm)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={shoulder}
                        onChange={e => setShoulder(e.target.value)}
                        placeholder="38"
                        className="w-full px-3 py-1.5 bg-brand-bg border border-brand-border rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-brand-text-secondary mb-1">Panjang Lengan (cm)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={sleeveLength}
                        onChange={e => setSleeveLength(e.target.value)}
                        placeholder="54"
                        className="w-full px-3 py-1.5 bg-brand-bg border border-brand-border rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-brand-text-secondary mb-1">Panjang Baju (cm)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={shirtLength}
                        onChange={e => setShirtLength(e.target.value)}
                        placeholder="140"
                        className="w-full px-3 py-1.5 bg-brand-bg border border-brand-border rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-brand-text-secondary mb-1">Tinggi Badan (cm)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={height}
                        onChange={e => setHeight(e.target.value)}
                        placeholder="165"
                        className="w-full px-3 py-1.5 bg-brand-bg border border-brand-border rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-brand-text-secondary mb-1">Ukuran Sepatu (EU)</label>
                      <input
                        type="text"
                        value={shoesSize}
                        onChange={e => setShoesSize(e.target.value)}
                        placeholder="38"
                        className="w-full px-3 py-1.5 bg-brand-bg border border-brand-border rounded-lg text-xs"
                      />
                    </div>
                  </div>

                  <div className="mt-3">
                    <label className="block text-[11px] text-brand-text-secondary mb-1">Catatan Ukuran Khusus</label>
                    <input
                      type="text"
                      value={customNotes}
                      onChange={e => setCustomNotes(e.target.value)}
                      placeholder="Misal: Lingkar leher, panjang ekor, kelonggaran wudhu"
                      className="w-full px-3 py-1.5 bg-brand-bg border border-brand-border rounded-lg text-xs"
                    />
                  </div>
                </div>
              )}

              {/* Fitting Notes */}
              <div>
                <label className="block text-xs font-bold text-brand-text-secondary mb-1">Catatan Fitting & Permak</label>
                <textarea
                  value={fittingNotes}
                  onChange={e => setFittingNotes(e.target.value)}
                  placeholder="Catatan hasil fitting, alterasi pinggang, jadwal fitting ke-2..."
                  rows={3}
                  className="w-full px-3 py-2 bg-brand-bg border border-brand-border rounded-xl text-xs text-brand-text-primary font-medium focus:outline-none focus:border-brand-accent resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-brand-border">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-brand-bg border border-brand-border rounded-xl text-xs font-semibold text-brand-text-secondary hover:text-brand-text-primary"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-brand-accent text-white rounded-xl text-xs font-semibold hover:opacity-90 shadow-xs"
                >
                  Simpan Catatan Busana
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
