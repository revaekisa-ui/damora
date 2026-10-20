import React, { useState, useEffect, useMemo } from 'react';
import {
  ShirtIcon,
  PlusIcon,
  Trash2Icon,
  PencilIcon,
  XIcon,
  SearchIcon,
  FilterIcon,
  CheckCircle2Icon,
  ClockIcon,
  AlertCircleIcon,
  SparklesIcon,
  RulerIcon,
  TagIcon,
  PrinterIcon,
  RefreshCwIcon,
  CopyIcon,
  EyeIcon,
  GridIcon,
  ListIcon,
  ExternalLinkIcon,
  HeartIcon,
  UserIcon,
  UsersIcon,
  CheckIcon,
  UploadCloudIcon,
  ImageIcon,
  CameraIcon,
  LinkIcon,
} from 'lucide-react';
import {
  AttireCatalogItem,
  AttireMainCategory,
  AttirePriceType,
  AttireSelectionStatus,
  AttireMeasurements,
  Client,
  Project,
  ViewType,
  NavigationAction,
  AttireRecord,
} from '../../types';
import {
  listAttireCatalog,
  createAttireCatalogItem,
  updateAttireCatalogItem,
  deleteAttireCatalogItem,
  resetAttireCatalogToDefault,
  ATTIRE_CATEGORIES,
  uploadAttirePhoto,
} from '../../services/attireCatalog';
import {
  createAttireRecord,
  listAllAttireRecords,
} from '../../services/attireRecords';

export interface AttireManagementPageProps {
  clients?: Client[];
  projects?: Project[];
  handleNavigation?: (view: ViewType, action?: NavigationAction) => void;
  initialAction?: NavigationAction | null;
  setInitialAction?: React.Dispatch<React.SetStateAction<NavigationAction | null>>;
  showNotification?: (message: string) => void;
}

const PRESET_PHOTOS: { category: AttireMainCategory; label: string; url: string }[] = [
  {
    category: 'Gaun Pengantin',
    label: 'Gaun Akad Broken White',
    url: 'https://images.unsplash.com/photo-1594552072238-b8a33785b261?auto=format&fit=crop&w=800&q=80',
  },
  {
    category: 'Gaun Pengantin',
    label: 'Ballgown Resepsi Glamour',
    url: 'https://images.unsplash.com/photo-1549416878-b9ca35c2d47b?auto=format&fit=crop&w=800&q=80',
  },
  {
    category: 'Gaun Pengantin',
    label: 'Mermaid Silk Rose Gold',
    url: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80',
  },
  {
    category: 'Gaun Pengantin',
    label: 'Gaun Tambahan Cocktail Silver',
    url: 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&w=800&q=80',
  },
  {
    category: 'Busana Orang Tua',
    label: 'Kebaya Ibu Sage Green',
    url: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80',
  },
  {
    category: 'Busana Orang Tua',
    label: 'Beskap Ayah Bordir Emas',
    url: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=800&q=80',
  },
  {
    category: 'Busana Saudara',
    label: 'Dress Saudara Lilac Chiffon',
    url: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?auto=format&fit=crop&w=800&q=80',
  },
  {
    category: 'Busana Saudara',
    label: 'Jas Formal Charcoal Grey',
    url: 'https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?auto=format&fit=crop&w=800&q=80',
  },
  {
    category: 'Busana Saudara',
    label: 'Bridesmaid Sage Green',
    url: 'https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=800&q=80',
  },
  {
    category: 'Busana Saudara',
    label: 'Groomsmen Vest & Bow Tie',
    url: 'https://images.unsplash.com/photo-1593030761757-71fae45fa0e7?auto=format&fit=crop&w=800&q=80',
  },
  {
    category: 'Aksesori',
    label: 'Mahkota Tiara Swarovski',
    url: 'https://images.unsplash.com/photo-1535295972055-1c762f4483e5?auto=format&fit=crop&w=800&q=80',
  },
  {
    category: 'Aksesori',
    label: 'Veil Cathedral Renda 3m',
    url: 'https://images.unsplash.com/photo-1545232979-8bf68ee9b1af?auto=format&fit=crop&w=800&q=80',
  },
  {
    category: 'Aksesori',
    label: 'Hijab Shimmer Voal',
    url: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=800&q=80',
  },
  {
    category: 'Aksesori',
    label: 'Hairpiece Rose Gold Pearl',
    url: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=800&q=80',
  },
  {
    category: 'Aksesori',
    label: 'Siger Sunda Kencana Emas',
    url: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=800&q=80',
  },
];

const MAIN_CATEGORIES: AttireMainCategory[] = [
  'Gaun Pengantin',
  'Busana Orang Tua',
  'Busana Saudara',
  'Aksesori',
];

const STATUS_OPTIONS: AttireSelectionStatus[] = ['Dipilih', 'Cadangan', 'Belum Dipilih'];
const PRICE_TYPES: AttirePriceType[] = ['Sewa', 'Pembelian', 'Sewa Perdana'];
const ROLES: ('Pengantin' | 'Ayah' | 'Ibu' | 'Saudara' | 'Bridesmaid' | 'Groomsmen' | 'Aksesori')[] = [
  'Pengantin',
  'Ayah',
  'Ibu',
  'Saudara',
  'Bridesmaid',
  'Groomsmen',
  'Aksesori',
];

export const AttireManagementPage: React.FC<AttireManagementPageProps> = ({
  clients = [],
  projects = [],
  handleNavigation,
  initialAction,
  setInitialAction,
  showNotification,
}) => {
  const [catalog, setCatalog] = useState<AttireCatalogItem[]>([]);
  const [clientRecords, setClientRecords] = useState<AttireRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters state
  const [selectedMainCategory, setSelectedMainCategory] = useState<string>('Semua');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('Semua');
  const [selectedStatus, setSelectedStatus] = useState<string>('Semua');
  const [selectedPriceType, setSelectedPriceType] = useState<string>('Semua');
  const [selectedClientFilter, setSelectedClientFilter] = useState<string>('Semua');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Modal State
  const [isFormModalOpen, setIsFormModalOpen] = useState<boolean>(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState<boolean>(false);
  const [detailItem, setDetailItem] = useState<AttireCatalogItem | null>(null);
  const [assignItem, setAssignItem] = useState<AttireCatalogItem | null>(null);
  const [editingItem, setEditingItem] = useState<AttireCatalogItem | null>(null);

  // Assign to Client Form state
  const [assignClientId, setAssignClientId] = useState<string>('');
  const [assignRole, setAssignRole] = useState<'Pengantin' | 'Ayah' | 'Ibu' | 'Saudara' | 'Bridesmaid' | 'Groomsmen' | 'Aksesori'>('Pengantin');
  const [assignPersonName, setAssignPersonName] = useState<string>('');
  const [assignSelectionStatus, setAssignSelectionStatus] = useState<AttireSelectionStatus>('Dipilih');
  const [assignFittingNotes, setAssignFittingNotes] = useState<string>('');

  // Form Fields
  const [name, setName] = useState<string>('');
  const [mainCategory, setMainCategory] = useState<AttireMainCategory>('Gaun Pengantin');
  const [subcategory, setSubcategory] = useState<string>(ATTIRE_CATEGORIES['Gaun Pengantin'][0]);
  const [model, setModel] = useState<string>('');
  const [color, setColor] = useState<string>('');
  const [size, setSize] = useState<string>('All Size');
  const [priceType, setPriceType] = useState<AttirePriceType>('Sewa');
  const [rentalPrice, setRentalPrice] = useState<string>('');
  const [purchasePrice, setPurchasePrice] = useState<string>('');
  const [selectionStatus, setSelectionStatus] = useState<AttireSelectionStatus>('Belum Dipilih');
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
      if (showNotification) {
        showNotification('Foto busana berhasil diunggah!');
      }
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
  const [targetPerson, setTargetPerson] = useState<string>('');
  const [fittingNotes, setFittingNotes] = useState<string>('');

  // Measurement Fields
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
    setLoading(true);
    try {
      const [catalogData, recordsData] = await Promise.all([
        listAttireCatalog(),
        listAllAttireRecords(),
      ]);
      setCatalog(catalogData);
      setClientRecords(recordsData);
    } catch (e) {
      console.error('Failed to load attire data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Handle deep linking or initial action
  useEffect(() => {
    if (initialAction?.id) {
      const clientExists = clients.some(c => c.id === initialAction.id);
      if (clientExists) {
        setSelectedClientFilter(initialAction.id);
      }
      if (setInitialAction) {
        setInitialAction(null);
      }
    }
  }, [initialAction, clients, setInitialAction]);

  // Sync subcategory options when main category changes in Form
  const currentSubcategories = useMemo(() => {
    return ATTIRE_CATEGORIES[mainCategory] || [];
  }, [mainCategory]);

  const handleMainCategoryChangeInForm = (cat: AttireMainCategory) => {
    setMainCategory(cat);
    const subcats = ATTIRE_CATEGORIES[cat] || [];
    if (subcats.length > 0) {
      setSubcategory(subcats[0]);
    }
  };

  // Subcategory options for filter bar
  const filterSubcategories = useMemo(() => {
    if (selectedMainCategory === 'Semua') {
      return [];
    }
    return ATTIRE_CATEGORIES[selectedMainCategory as AttireMainCategory] || [];
  }, [selectedMainCategory]);

  const handleSelectFilterCategory = (cat: string) => {
    setSelectedMainCategory(cat);
    setSelectedSubcategory('Semua');
  };

  // Selected client object if filter active
  const selectedClient = useMemo(() => {
    if (selectedClientFilter === 'Semua') return null;
    return clients.find(c => c.id === selectedClientFilter) || null;
  }, [clients, selectedClientFilter]);

  // Map client records to catalog items for easy lookup
  const clientAttireMap = useMemo(() => {
    const map = new Map<string, { client: Client; record: AttireRecord }[]>();
    for (const rec of clientRecords) {
      const matchedClient = clients.find(c => c.id === rec.clientId);
      if (!matchedClient) continue;
      const key = `${rec.itemName.toLowerCase().trim()}_${(rec.mainCategory || '').toLowerCase().trim()}`;
      const existing = map.get(key) || [];
      existing.push({ client: matchedClient, record: rec });
      map.set(key, existing);
    }
    return map;
  }, [clientRecords, clients]);

  // Summary counts
  const stats = useMemo(() => {
    const total = catalog.length;
    const gaunCount = catalog.filter(c => c.mainCategory === 'Gaun Pengantin').length;
    const ortuCount = catalog.filter(c => c.mainCategory === 'Busana Orang Tua').length;
    const saudaraCount = catalog.filter(c => c.mainCategory === 'Busana Saudara').length;
    const aksesoriCount = catalog.filter(c => c.mainCategory === 'Aksesori').length;

    const dipilihCount = catalog.filter(c => c.selectionStatus === 'Dipilih').length;
    const cadanganCount = catalog.filter(c => c.selectionStatus === 'Cadangan').length;
    const belumDipilihCount = catalog.filter(c => c.selectionStatus === 'Belum Dipilih').length;

    return {
      total,
      gaunCount,
      ortuCount,
      saudaraCount,
      aksesoriCount,
      dipilihCount,
      cadanganCount,
      belumDipilihCount,
    };
  }, [catalog]);

  // Filtered catalog
  const filteredCatalog = useMemo(() => {
    return catalog.filter(item => {
      // Main category filter
      if (selectedMainCategory !== 'Semua' && item.mainCategory !== selectedMainCategory) {
        return false;
      }
      // Subcategory filter
      if (selectedSubcategory !== 'Semua' && item.subcategory !== selectedSubcategory) {
        return false;
      }
      // Status filter
      if (selectedStatus !== 'Semua' && item.selectionStatus !== selectedStatus) {
        return false;
      }
      // Price Type filter
      if (selectedPriceType !== 'Semua' && item.priceType !== selectedPriceType) {
        return false;
      }
      // Client filter
      if (selectedClientFilter !== 'Semua') {
        const clientSpecificRecords = clientRecords.filter(r => r.clientId === selectedClientFilter);
        const hasRecordForClient = clientSpecificRecords.some(
          r => r.itemName.toLowerCase() === item.name.toLowerCase()
        );
        const matchesTargetPerson = item.targetPerson?.toLowerCase().includes(
          (selectedClient?.name || '').toLowerCase()
        );
        if (!hasRecordForClient && !matchesTargetPerson) {
          return false;
        }
      }
      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = item.name.toLowerCase().includes(q);
        const matchesColor = item.color.toLowerCase().includes(q);
        const matchesModel = (item.model || '').toLowerCase().includes(q);
        const matchesSubcat = item.subcategory.toLowerCase().includes(q);
        const matchesPerson = (item.targetPerson || '').toLowerCase().includes(q);
        const matchesNotes = (item.fittingNotes || '').toLowerCase().includes(q);
        if (!matchesName && !matchesColor && !matchesModel && !matchesSubcat && !matchesPerson && !matchesNotes) {
          return false;
        }
      }
      return true;
    });
  }, [catalog, selectedMainCategory, selectedSubcategory, selectedStatus, selectedPriceType, selectedClientFilter, searchQuery, clientRecords, selectedClient]);

  const resetForm = () => {
    setEditingItem(null);
    setName('');
    setMainCategory('Gaun Pengantin');
    setSubcategory(ATTIRE_CATEGORIES['Gaun Pengantin'][0]);
    setModel('');
    setColor('');
    setSize('All Size');
    setPriceType('Sewa');
    setRentalPrice('');
    setPurchasePrice('');
    setSelectionStatus('Belum Dipilih');
    setPhotoUrl('');
    setIsUploadingPhoto(false);
    setUploadError('');
    setShowManualUrlInput(false);
    setIsDraggingPhoto(false);
    setTargetPerson('');
    setFittingNotes('');
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
  };

  const handleOpenAddModal = (presetCategory?: AttireMainCategory) => {
    resetForm();
    if (presetCategory) {
      setMainCategory(presetCategory);
      setSubcategory(ATTIRE_CATEGORIES[presetCategory][0]);
    }
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (item: AttireCatalogItem) => {
    setEditingItem(item);
    setName(item.name);
    setMainCategory(item.mainCategory);
    setSubcategory(item.subcategory);
    setModel(item.model || '');
    setColor(item.color || '');
    setSize(item.size || 'All Size');
    setPriceType(item.priceType || 'Sewa');
    setRentalPrice(item.rentalPrice ? item.rentalPrice.toString() : '');
    setPurchasePrice(item.purchasePrice ? item.purchasePrice.toString() : '');
    setSelectionStatus(item.selectionStatus || 'Belum Dipilih');
    setPhotoUrl(item.photoUrl || '');
    setTargetPerson(item.targetPerson || '');
    setFittingNotes(item.fittingNotes || '');

    const m = item.measurements || {};
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

    setIsFormModalOpen(true);
  };

  // Open Assign to Client Modal
  const handleOpenAssignModal = (item: AttireCatalogItem) => {
    setAssignItem(item);
    const initialClient = clients[0];
    setAssignClientId(initialClient ? initialClient.id : '');
    setAssignRole('Pengantin');
    setAssignPersonName(initialClient ? initialClient.name : 'Pengantin');
    setAssignSelectionStatus('Dipilih');
    setAssignFittingNotes(item.fittingNotes || '');
    setIsAssignModalOpen(true);
  };

  // Save assignment to Client Details
  const handleSaveAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignItem || !assignClientId) {
      if (showNotification) showNotification('Pilih pengantin terlebih dahulu');
      return;
    }

    const targetClient = clients.find(c => c.id === assignClientId);
    if (!targetClient) return;

    try {
      await createAttireRecord({
        clientId: assignClientId,
        personName: assignPersonName.trim() || targetClient.name,
        personRole: assignRole,
        mainCategory: assignItem.mainCategory,
        subcategory: assignItem.subcategory,
        category: assignItem.subcategory as any,
        itemName: assignItem.name,
        model: assignItem.model || '',
        color: assignItem.color || '',
        size: assignItem.size || 'All Size',
        priceType: assignItem.priceType || 'Sewa',
        rentalPrice: assignItem.rentalPrice || 0,
        selectionStatus: assignSelectionStatus,
        status: assignSelectionStatus,
        fittingNotes: assignFittingNotes.trim() || assignItem.fittingNotes || '',
        photoUrl: assignItem.photoUrl || '',
        measurements: assignItem.measurements || {},
      });

      // Also update catalog item's target person and status
      await updateAttireCatalogItem(assignItem.id, {
        targetPerson: `${assignPersonName} (${targetClient.name})`,
        selectionStatus: assignSelectionStatus,
      });

      if (showNotification) {
        showNotification(
          `Busana "${assignItem.name}" berhasil disinkronkan ke Detail Pengantin ${targetClient.name}!`
        );
      }

      setIsAssignModalOpen(false);
      loadData();
    } catch (err) {
      console.error('Failed to assign attire to client:', err);
      if (showNotification) showNotification('Gagal menugaskan busana ke pengantin');
    }
  };

  // Direct Navigate to Client Detail Modal (attire tab)
  const handleNavigateToClientAttire = (clientId: string) => {
    if (handleNavigation) {
      handleNavigation(ViewType.CLIENTS, {
        type: 'VIEW_CLIENT_DETAILS',
        id: clientId,
        tab: 'attire',
      });
    }
  };

  const handleDuplicate = async (item: AttireCatalogItem) => {
    const duplicatedName = `${item.name} (Salinan)`;
    try {
      await createAttireCatalogItem({
        ...item,
        name: duplicatedName,
        selectionStatus: 'Belum Dipilih',
      });
      loadData();
      if (showNotification) showNotification(`Busana "${item.name}" berhasil disalin`);
    } catch (e) {
      console.error('Failed to duplicate item:', e);
    }
  };

  const handleQuickStatusChange = async (item: AttireCatalogItem, newStatus: AttireSelectionStatus) => {
    try {
      await updateAttireCatalogItem(item.id, { selectionStatus: newStatus });
      setCatalog(prev => prev.map(c => c.id === item.id ? { ...c, selectionStatus: newStatus } : c));
      if (detailItem && detailItem.id === item.id) {
        setDetailItem({ ...detailItem, selectionStatus: newStatus });
      }
      if (showNotification) showNotification(`Status "${item.name}" diubah ke: ${newStatus}`);
    } catch (e) {
      console.error('Failed to change status:', e);
    }
  };

  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

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

    const payload = {
      name: name.trim(),
      mainCategory,
      subcategory,
      category: subcategory,
      model: model.trim(),
      color: color.trim(),
      size: size.trim(),
      priceType,
      rentalPrice: rentalPrice ? Number(rentalPrice) : 0,
      purchasePrice: purchasePrice ? Number(purchasePrice) : undefined,
      selectionStatus,
      photoUrl: photoUrl.trim(),
      targetPerson: targetPerson.trim(),
      fittingNotes: fittingNotes.trim(),
      measurements,
    };

    try {
      if (editingItem) {
        await updateAttireCatalogItem(editingItem.id, payload);
        if (showNotification) showNotification('Perubahan busana berhasil disimpan');
      } else {
        await createAttireCatalogItem(payload);
        if (showNotification) showNotification('Busana baru berhasil ditambahkan');
      }
      setIsFormModalOpen(false);
      resetForm();
      loadData();
    } catch (e) {
      console.error('Failed to save item:', e);
    }
  };

  const handleDeleteItem = async (id: string, itemName: string) => {
    if (window.confirm(`Hapus busana "${itemName}" dari katalog?`)) {
      try {
        await deleteAttireCatalogItem(id);
        setCatalog(prev => prev.filter(c => c.id !== id));
        if (detailItem && detailItem.id === id) {
          setIsDetailModalOpen(false);
        }
        if (showNotification) showNotification('Busana dihapus dari katalog');
      } catch (e) {
        console.error('Failed to delete item:', e);
      }
    }
  };

  const handleResetCatalog = () => {
    if (window.confirm('Muat ulang seluruh contoh data katalog busana resmi (Gaun Pengantin, Ortu, Saudara, & Aksesori)?')) {
      const seeded = resetAttireCatalogToDefault();
      setCatalog(seeded);
      if (showNotification) showNotification('Contoh data katalog busana berhasil dimuat');
    }
  };

  const getStatusBadge = (status: AttireSelectionStatus) => {
    switch (status) {
      case 'Dipilih':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2Icon className="w-3 h-3 text-emerald-600" /> Dipilih
          </span>
        );
      case 'Cadangan':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
            <ClockIcon className="w-3 h-3 text-amber-600" /> Cadangan
          </span>
        );
      case 'Belum Dipilih':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-300">
            <AlertCircleIcon className="w-3 h-3 text-slate-500" /> Belum Dipilih
          </span>
        );
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center font-bold">
              <ShirtIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                  Katalog Busana & Attire
                </h1>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-blue-50 text-[#5D87FF] border border-blue-200">
                  /#/Busana & Attire
                </span>
              </div>
              <p className="text-xs sm:text-sm text-gray-500">
                Pilihan gaun akad/resepsi, busana orang tua, saudara/bridesmaid, & aksesori terintegrasi langsung dengan <strong>Detail Pengantin</strong>.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {selectedClient && (
            <button
              onClick={() => handleNavigateToClientAttire(selectedClient.id)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-purple-50 text-purple-700 border border-purple-200 rounded-xl text-xs font-bold hover:bg-purple-100 transition-colors shadow-xs"
            >
              <ExternalLinkIcon className="w-4 h-4 text-purple-600" /> Buka Detail Pengantin ({selectedClient.name})
            </button>
          )}
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 transition-colors shadow-xs"
            title="Cetak lembar katalog busana"
          >
            <PrinterIcon className="w-4 h-4 text-gray-500" /> Cetak Katalog
          </button>
          <button
            onClick={handleResetCatalog}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 transition-colors shadow-xs"
            title="Muat contoh busana & aksesori lengkap"
          >
            <RefreshCwIcon className="w-4 h-4 text-gray-500" /> Contoh Data
          </button>
          <button
            onClick={() => handleOpenAddModal()}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#5D87FF] text-white rounded-xl text-xs font-bold hover:bg-[#4871e3] transition-all shadow-xs active:scale-95"
          >
            <PlusIcon className="w-4 h-4" /> Tambah Busana Baru
          </button>
        </div>
      </div>

      {/* Synchronized Client Banner if Filtered */}
      {selectedClient && (
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold shadow-xs">
              👰
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-purple-600">
                Mode Sinkronisasi Pengantin Aktif
              </div>
              <h3 className="text-sm font-black text-gray-900">
                Menampilkan busana untuk: {selectedClient.name}
              </h3>
              <p className="text-xs text-gray-500">
                Item yang dipilih atau ditugaskan langsung terhubung ke Detail Pengantin tab Busana & Attire.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleNavigateToClientAttire(selectedClient.id)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 text-white rounded-xl text-xs font-bold hover:bg-purple-700 transition-colors shadow-xs"
            >
              <ExternalLinkIcon className="w-3.5 h-3.5" /> Buka di Detail Pengantin
            </button>
            <button
              onClick={() => setSelectedClientFilter('Semua')}
              className="px-3 py-1.5 bg-white border border-gray-200 text-gray-700 rounded-xl text-xs font-semibold hover:bg-gray-50"
            >
              Lihat Semua
            </button>
          </div>
        </div>
      )}

      {/* 4 Category Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Gaun Pengantin */}
        <div
          onClick={() => handleSelectFilterCategory('Gaun Pengantin')}
          className={`cursor-pointer p-4 rounded-2xl border transition-all ${
            selectedMainCategory === 'Gaun Pengantin'
              ? 'bg-pink-50/70 border-pink-300 ring-2 ring-pink-400/20'
              : 'bg-white border-gray-100 hover:border-pink-200 hover:shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-pink-700 uppercase tracking-wider">Gaun Pengantin</span>
            <span className="text-lg">👰</span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-gray-900">{stats.gaunCount}</span>
            <span className="text-[11px] text-pink-600 font-semibold">Akad, Resepsi, Tambahan</span>
          </div>
          <div className="mt-2 text-[10px] text-gray-500 flex items-center gap-1.5">
            <span>Ukuran pengantin & fitting</span>
          </div>
        </div>

        {/* Busana Orang Tua */}
        <div
          onClick={() => handleSelectFilterCategory('Busana Orang Tua')}
          className={`cursor-pointer p-4 rounded-2xl border transition-all ${
            selectedMainCategory === 'Busana Orang Tua'
              ? 'bg-amber-50/70 border-amber-300 ring-2 ring-amber-400/20'
              : 'bg-white border-gray-100 hover:border-amber-200 hover:shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">Busana Orang Tua</span>
            <span className="text-lg">👥</span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-gray-900">{stats.ortuCount}</span>
            <span className="text-[11px] text-amber-600 font-semibold">Baju Ibu & Ayah</span>
          </div>
          <div className="mt-2 text-[10px] text-gray-500 flex items-center gap-1.5">
            <span>Model, warna, ukuran ortu</span>
          </div>
        </div>

        {/* Busana Saudara */}
        <div
          onClick={() => handleSelectFilterCategory('Busana Saudara')}
          className={`cursor-pointer p-4 rounded-2xl border transition-all ${
            selectedMainCategory === 'Busana Saudara'
              ? 'bg-indigo-50/70 border-indigo-300 ring-2 ring-indigo-400/20'
              : 'bg-white border-gray-100 hover:border-indigo-200 hover:shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider">Busana Saudara</span>
            <span className="text-lg">💐</span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-gray-900">{stats.saudaraCount}</span>
            <span className="text-[11px] text-indigo-600 font-semibold">Bridesmaid & Groomsmen</span>
          </div>
          <div className="mt-2 text-[10px] text-gray-500 flex items-center gap-1.5">
            <span>Adik/Kakak P/L & ukuran per orang</span>
          </div>
        </div>

        {/* Aksesori */}
        <div
          onClick={() => handleSelectFilterCategory('Aksesori')}
          className={`cursor-pointer p-4 rounded-2xl border transition-all ${
            selectedMainCategory === 'Aksesori'
              ? 'bg-purple-50/70 border-purple-300 ring-2 ring-purple-400/20'
              : 'bg-white border-gray-100 hover:border-purple-200 hover:shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-purple-700 uppercase tracking-wider">Aksesori</span>
            <span className="text-lg">✨</span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-gray-900">{stats.aksesoriCount}</span>
            <span className="text-[11px] text-purple-600 font-semibold">Hijab, Mahkota, Veil</span>
          </div>
          <div className="mt-2 text-[10px] text-gray-500 flex items-center gap-1.5">
            <span>Hairpiece & aksesori tambahan</span>
          </div>
        </div>
      </div>

      {/* Main Filter & Navigation Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs space-y-4">
        {/* Main Category Tabs */}
        <div className="flex flex-wrap items-center gap-2 border-b border-gray-100 pb-3">
          <button
            onClick={() => handleSelectFilterCategory('Semua')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              selectedMainCategory === 'Semua'
                ? 'bg-gray-900 text-white shadow-xs'
                : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
            }`}
          >
            Semua Kategori ({stats.total})
          </button>
          {MAIN_CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => handleSelectFilterCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                selectedMainCategory === cat
                  ? 'bg-[#5D87FF] text-white shadow-xs'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Subcategory Pills */}
        {filterSubcategories.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 bg-gray-50/80 p-2.5 rounded-xl border border-gray-100">
            <span className="text-[11px] font-bold text-gray-400 mr-1 uppercase">Subkategori:</span>
            <button
              onClick={() => setSelectedSubcategory('Semua')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                selectedSubcategory === 'Semua'
                  ? 'bg-white text-gray-900 shadow-xs font-bold'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Semua
            </button>
            {filterSubcategories.map(sub => (
              <button
                key={sub}
                onClick={() => setSelectedSubcategory(sub)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  selectedSubcategory === sub
                    ? 'bg-white text-[#5D87FF] shadow-xs font-bold border border-blue-100'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {sub}
              </button>
            ))}
          </div>
        )}

        {/* Detailed Controls: Client Selector, Search, Status, Price Type, View toggle */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          {/* Synchronized Client Dropdown Filter */}
          <div className="lg:col-span-2">
            <div className="relative">
              <UsersIcon className="w-4 h-4 text-purple-600 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                value={selectedClientFilter}
                onChange={e => setSelectedClientFilter(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-purple-50/60 border border-purple-200 rounded-xl text-xs font-bold text-purple-900 focus:outline-none focus:bg-white focus:border-purple-400"
              >
                <option value="Semua">👰 Hubungkan / Filter Pengantin (Semua)</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>
                    Pengantin: {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Search Input */}
          <div className="relative lg:col-span-2">
            <SearchIcon className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Cari nama busana, model, warna..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-900 focus:outline-none focus:bg-white focus:border-[#5D87FF]"
            />
          </div>

          {/* Status Selection Filter */}
          <div>
            <select
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-700 focus:outline-none focus:bg-white focus:border-[#5D87FF]"
            >
              <option value="Semua">Semua Status Pilihan</option>
              {STATUS_OPTIONS.map(opt => (
                <option key={opt} value={opt}>Status: {opt}</option>
              ))}
            </select>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center justify-end gap-1.5">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-xl transition-all ${
                viewMode === 'grid' ? 'bg-[#5D87FF] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              title="Grid Card View"
            >
              <GridIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 rounded-xl transition-all ${
                viewMode === 'table' ? 'bg-[#5D87FF] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              title="Tabel View"
            >
              <ListIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Status quick counts summary row */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs text-gray-500 border-t border-gray-100">
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-semibold text-gray-700">Ditemukan: {filteredCatalog.length} item</span>
            <span>•</span>
            <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
              Dipilih: {stats.dipilihCount}
            </span>
            <span>•</span>
            <span className="inline-flex items-center gap-1 text-amber-700 font-semibold">
              <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
              Cadangan: {stats.cadanganCount}
            </span>
            <span>•</span>
            <span className="inline-flex items-center gap-1 text-slate-600 font-semibold">
              <span className="w-2 h-2 rounded-full bg-slate-400 inline-block" />
              Belum Dipilih: {stats.belumDipilihCount}
            </span>
          </div>

          {/* Quick link indicator */}
          <div className="text-[11px] text-gray-400 flex items-center gap-1">
            <span>Tersinkronisasi dengan {clients.length} data pengantin</span>
          </div>
        </div>
      </div>

      {/* Main Content: Grid or Table */}
      {loading ? (
        <div className="py-20 text-center text-sm text-gray-500 bg-white rounded-2xl border border-gray-100">
          <div className="animate-spin w-8 h-8 border-3 border-[#5D87FF] border-t-transparent rounded-full mx-auto mb-3" />
          Memuat katalog busana & attire...
        </div>
      ) : filteredCatalog.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-300 p-8">
          <ShirtIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-gray-800">Tidak ada item busana yang cocok</h3>
          <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto">
            Coba ubah kata kunci pencarian, ganti filter pengantin, atau tambahkan busana baru ke katalog.
          </p>
          <div className="mt-4 flex items-center justify-center gap-2">
            <button
              onClick={() => {
                setSelectedMainCategory('Semua');
                setSelectedSubcategory('Semua');
                setSelectedStatus('Semua');
                setSelectedPriceType('Semua');
                setSelectedClientFilter('Semua');
                setSearchQuery('');
              }}
              className="px-3.5 py-1.5 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-50"
            >
              Reset Filter
            </button>
            <button
              onClick={() => handleOpenAddModal()}
              className="px-4 py-1.5 bg-[#5D87FF] text-white rounded-xl text-xs font-bold hover:bg-[#4871e3]"
            >
              Tambah Busana
            </button>
          </div>
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID VIEW */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredCatalog.map(item => {
            const m = item.measurements || {};
            const hasMeasurements = Boolean(
              m.chest || m.waist || m.hips || m.shoulder || m.sleeveLength ||
              m.shirtLength || m.height || m.weight || m.shoesSize
            );

            // Check if item is linked to any client
            const itemKey = `${item.name.toLowerCase().trim()}_${(item.mainCategory || '').toLowerCase().trim()}`;
            const linkedClientEntries = clientAttireMap.get(itemKey) || [];

            return (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-gray-100 shadow-xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group"
              >
                <div>
                  {/* Photo & Badges */}
                  <div className="relative h-48 w-full bg-gray-100 overflow-hidden">
                    {item.photoUrl ? (
                      <img
                        src={item.photoUrl}
                        alt={item.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-200 text-gray-400">
                        <ShirtIcon className="w-10 h-10 stroke-1 opacity-50 mb-1" />
                        <span className="text-[11px] font-medium">Foto Belum Tersedia</span>
                      </div>
                    )}

                    {/* Category pill on photo top-left */}
                    <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 items-start">
                      <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-black/70 text-white backdrop-blur-xs">
                        {item.mainCategory}
                      </span>
                    </div>

                    {/* Status badge on photo top-right */}
                    <div className="absolute top-2.5 right-2.5">
                      {getStatusBadge(item.selectionStatus)}
                    </div>

                    {/* Price Type on bottom-left of photo */}
                    <div className="absolute bottom-2.5 left-2.5">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-white/95 text-gray-800 shadow-xs">
                        {item.priceType}
                      </span>
                    </div>
                  </div>

                  {/* Body Info */}
                  <div className="p-4 space-y-2.5">
                    {/* Subcategory */}
                    <div className="text-[11px] font-bold text-[#5D87FF] uppercase tracking-wide">
                      {item.subcategory}
                    </div>

                    {/* Item Name */}
                    <h3 className="font-bold text-gray-900 text-sm leading-snug line-clamp-2">
                      {item.name}
                    </h3>

                    {/* Model & Target Person */}
                    <div className="text-xs text-gray-500 space-y-0.5">
                      {item.model && (
                        <p className="line-clamp-1">
                          <span className="font-semibold text-gray-700">Model:</span> {item.model}
                        </p>
                      )}
                      {item.targetPerson && (
                        <p className="line-clamp-1 text-purple-700 font-medium">
                          <span className="font-semibold text-gray-700">Pemakai:</span> {item.targetPerson}
                        </p>
                      )}
                    </div>

                    {/* Synchronized Client indicator pill */}
                    {linkedClientEntries.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1 pt-0.5">
                        {linkedClientEntries.map(({ client: c }) => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => handleNavigateToClientAttire(c.id)}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 transition-colors"
                            title="Buka di Detail Pengantin"
                          >
                            <UserIcon className="w-3 h-3 text-purple-600" />
                            {c.name}
                            <ExternalLinkIcon className="w-2.5 h-2.5 ml-0.5 opacity-60" />
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Color & Size tags */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      {item.color && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 rounded-md text-[11px] font-semibold text-gray-700">
                          <span className="w-2 h-2 rounded-full bg-pink-400" />
                          {item.color}
                        </span>
                      )}
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200/60 rounded-md text-[11px] font-bold">
                        Ukuran: {item.size}
                      </span>
                    </div>

                    {/* Measurement specs indicator */}
                    {hasMeasurements && (
                      <div className="bg-gray-50 p-2 rounded-xl border border-gray-100 text-[11px] text-gray-600 flex items-center justify-between">
                        <span className="flex items-center gap-1 text-gray-700 font-semibold">
                          <RulerIcon className="w-3.5 h-3.5 text-[#5D87FF]" />
                          Ukuran Fitting:
                        </span>
                        <span className="font-medium">
                          {m.chest ? `Dada ${m.chest}cm` : ''} {m.waist ? `• Pinggang ${m.waist}cm` : ''}
                        </span>
                      </div>
                    )}

                    {/* Fitting Notes Preview */}
                    {item.fittingNotes && (
                      <p className="text-[11px] text-gray-500 bg-amber-50/70 border border-amber-100 p-2 rounded-xl line-clamp-2">
                        <strong className="text-amber-800">Catatan Fitting:</strong> {item.fittingNotes}
                      </p>
                    )}

                    {/* Price */}
                    <div className="pt-2 border-t border-gray-100 flex items-baseline justify-between">
                      <div>
                        <span className="text-[10px] text-gray-400 block font-semibold uppercase">
                          Harga {item.priceType}:
                        </span>
                        <span className="text-sm font-extrabold text-[#5D87FF]">
                          Rp {item.rentalPrice ? item.rentalPrice.toLocaleString('id-ID') : '0'}
                        </span>
                      </div>
                      {item.purchasePrice && item.purchasePrice > 0 && (
                        <div className="text-right">
                          <span className="text-[10px] text-gray-400 block font-semibold uppercase">
                            Beli:
                          </span>
                          <span className="text-xs font-bold text-gray-600">
                            Rp {item.purchasePrice.toLocaleString('id-ID')}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer Controls: Quick status selector & Actions */}
                <div className="p-3 bg-gray-50/80 border-t border-gray-100 space-y-2">
                  {/* Button Pilih untuk Pengantin */}
                  <button
                    onClick={() => handleOpenAssignModal(item)}
                    className="w-full py-1.5 px-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl text-xs font-bold hover:opacity-95 transition-opacity flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    <HeartIcon className="w-3.5 h-3.5" /> Pilih untuk Pengantin
                  </button>

                  {/* Quick Status Selector */}
                  <div className="flex items-center justify-between gap-1 pt-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase">Status:</span>
                    <div className="flex items-center gap-1">
                      {STATUS_OPTIONS.map(st => (
                        <button
                          key={st}
                          onClick={() => handleQuickStatusChange(item, st)}
                          className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all ${
                            item.selectionStatus === st
                              ? st === 'Dipilih'
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : st === 'Cadangan'
                                ? 'bg-amber-500 text-white shadow-xs'
                                : 'bg-slate-700 text-white shadow-xs'
                              : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          {st === 'Dipilih' ? 'Dipilih' : st === 'Cadangan' ? 'Cadang' : 'Belum'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Actions toolbar */}
                  <div className="flex items-center justify-between pt-1 border-t border-gray-200/60">
                    <button
                      onClick={() => {
                        setDetailItem(item);
                        setIsDetailModalOpen(true);
                      }}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-gray-700 hover:text-[#5D87FF] transition-colors"
                    >
                      <EyeIcon className="w-3.5 h-3.5" /> Detail
                    </button>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleDuplicate(item)}
                        className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-white rounded-lg transition-colors"
                        title="Duplikat item"
                      >
                        <CopyIcon className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleOpenEditModal(item)}
                        className="p-1.5 text-gray-500 hover:text-[#5D87FF] hover:bg-white rounded-lg transition-colors"
                        title="Edit busana"
                      >
                        <PencilIcon className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteItem(item.id, item.name)}
                        className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-white rounded-lg transition-colors"
                        title="Hapus busana"
                      >
                        <Trash2Icon className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-500 border-b border-gray-100 font-bold uppercase text-[10px]">
              <tr>
                <th className="p-3.5">Foto</th>
                <th className="p-3.5">Nama & Model</th>
                <th className="p-3.5">Kategori & Subkategori</th>
                <th className="p-3.5">Warna & Ukuran</th>
                <th className="p-3.5">Harga Sewa / Beli</th>
                <th className="p-3.5">Status Pilihan</th>
                <th className="p-3.5">Sinkron Pengantin</th>
                <th className="p-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredCatalog.map(item => {
                const itemKey = `${item.name.toLowerCase().trim()}_${(item.mainCategory || '').toLowerCase().trim()}`;
                const linkedClientEntries = clientAttireMap.get(itemKey) || [];

                return (
                  <tr key={item.id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="p-3.5">
                      {item.photoUrl ? (
                        <img
                          src={item.photoUrl}
                          alt={item.name}
                          className="w-12 h-12 rounded-xl object-cover border border-gray-200"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400">
                          <ShirtIcon className="w-5 h-5" />
                        </div>
                      )}
                    </td>
                    <td className="p-3.5">
                      <div className="font-bold text-gray-900">{item.name}</div>
                      {item.model && <div className="text-[11px] text-gray-500">Model: {item.model}</div>}
                    </td>
                    <td className="p-3.5">
                      <span className="font-bold text-gray-800 block">{item.mainCategory}</span>
                      <span className="text-[11px] text-[#5D87FF]">{item.subcategory}</span>
                    </td>
                    <td className="p-3.5">
                      <div className="font-semibold text-gray-800">{item.color || '-'}</div>
                      <div className="text-[11px] text-gray-500">Ukuran: {item.size}</div>
                    </td>
                    <td className="p-3.5">
                      <div className="font-extrabold text-[#5D87FF]">
                        Rp {item.rentalPrice.toLocaleString('id-ID')} ({item.priceType})
                      </div>
                      {item.purchasePrice ? (
                        <div className="text-[10px] text-gray-500">
                          Beli: Rp {item.purchasePrice.toLocaleString('id-ID')}
                        </div>
                      ) : null}
                    </td>
                    <td className="p-3.5">
                      <select
                        value={item.selectionStatus}
                        onChange={e => handleQuickStatusChange(item, e.target.value as AttireSelectionStatus)}
                        className={`text-xs font-bold rounded-lg px-2 py-1 border focus:outline-none ${
                          item.selectionStatus === 'Dipilih'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                            : item.selectionStatus === 'Cadangan'
                            ? 'bg-amber-50 text-amber-800 border-amber-300'
                            : 'bg-gray-50 text-gray-700 border-gray-300'
                        }`}
                      >
                        {STATUS_OPTIONS.map(st => (
                          <option key={st} value={st}>{st}</option>
                        ))}
                      </select>
                    </td>
                    <td className="p-3.5">
                      {linkedClientEntries.length > 0 ? (
                        <div className="flex flex-col gap-1">
                          {linkedClientEntries.map(({ client: c }) => (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => handleNavigateToClientAttire(c.id)}
                              className="inline-flex items-center gap-1 text-[11px] text-purple-700 font-bold hover:underline"
                            >
                              👰 {c.name}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <button
                          onClick={() => handleOpenAssignModal(item)}
                          className="px-2 py-1 bg-purple-50 text-purple-700 rounded-lg text-[10px] font-bold hover:bg-purple-100"
                        >
                          + Hubungkan
                        </button>
                      )}
                    </td>
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenAssignModal(item)}
                          className="p-1.5 text-purple-600 hover:bg-purple-50 rounded-lg"
                          title="Pilih untuk Pengantin"
                        >
                          <HeartIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setDetailItem(item);
                            setIsDetailModalOpen(true);
                          }}
                          className="p-1.5 text-gray-500 hover:text-[#5D87FF] rounded-lg"
                          title="Lihat Detail"
                        >
                          <EyeIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEditModal(item)}
                          className="p-1.5 text-gray-500 hover:text-gray-900 rounded-lg"
                          title="Edit"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item.id, item.name)}
                          className="p-1.5 text-gray-500 hover:text-red-600 rounded-lg"
                          title="Hapus"
                        >
                          <Trash2Icon className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL: ASSIGN / PILIH UNTUK PENGANTIN */}
      {isAssignModalOpen && assignItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600">
                  Sinkronisasi ke Detail Pengantin
                </span>
                <h3 className="text-base font-black text-gray-900 mt-0.5">
                  Pilih Busana untuk Pengantin
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAssignModalOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-100"
              >
                <XIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Item Preview */}
            <div className="p-3 bg-purple-50/60 rounded-2xl border border-purple-100 flex items-center gap-3">
              {assignItem.photoUrl ? (
                <img src={assignItem.photoUrl} alt={assignItem.name} className="w-14 h-14 rounded-xl object-cover" />
              ) : (
                <div className="w-14 h-14 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600">
                  <ShirtIcon className="w-6 h-6" />
                </div>
              )}
              <div>
                <span className="text-[10px] font-bold uppercase text-purple-600">{assignItem.subcategory}</span>
                <h4 className="text-xs font-bold text-gray-900 leading-snug">{assignItem.name}</h4>
                <p className="text-[11px] text-gray-600">
                  {assignItem.color} • {assignItem.size} • Rp {assignItem.rentalPrice.toLocaleString('id-ID')}
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveAssignment} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Pilih Pengantin *
                </label>
                <select
                  value={assignClientId}
                  onChange={e => {
                    const cId = e.target.value;
                    setAssignClientId(cId);
                    const selected = clients.find(c => c.id === cId);
                    if (selected) {
                      setAssignPersonName(selected.name);
                    }
                  }}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:outline-none focus:bg-white focus:border-purple-500"
                  required
                >
                  <option value="">-- Pilih Pengantin --</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Peran / Subjek
                  </label>
                  <select
                    value={assignRole}
                    onChange={e => {
                      const role = e.target.value as any;
                      setAssignRole(role);
                      const currentClient = clients.find(c => c.id === assignClientId);
                      if (currentClient) {
                        setAssignPersonName(role === 'Pengantin' ? currentClient.name : `${role} - ${currentClient.name}`);
                      }
                    }}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 focus:outline-none focus:bg-white"
                  >
                    {ROLES.map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Status Pilihan
                  </label>
                  <select
                    value={assignSelectionStatus}
                    onChange={e => setAssignSelectionStatus(e.target.value as AttireSelectionStatus)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:outline-none focus:bg-white"
                  >
                    <option value="Dipilih">Dipilih (Utama)</option>
                    <option value="Cadangan">Cadangan</option>
                    <option value="Belum Dipilih">Belum Dipilih</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Nama Pemakai
                </label>
                <input
                  type="text"
                  value={assignPersonName}
                  onChange={e => setAssignPersonName(e.target.value)}
                  placeholder="Nama pemakai busana"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-900 focus:outline-none focus:bg-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Catatan Fitting untuk Pengantin Ini
                </label>
                <textarea
                  rows={2}
                  value={assignFittingNotes}
                  onChange={e => setAssignFittingNotes(e.target.value)}
                  placeholder="Catatan penyesuaian untuk pengantin ini..."
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-900 focus:outline-none focus:bg-white resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsAssignModalOpen(false)}
                  className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl text-xs font-bold hover:opacity-90 shadow-xs"
                >
                  Simpan & Sinkronkan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DETAIL MODAL / FITTING SHEET */}
      {isDetailModalOpen && detailItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#5D87FF]">
                  {detailItem.mainCategory} • {detailItem.subcategory}
                </span>
                <h2 className="text-xl font-black text-gray-900 mt-0.5">{detailItem.name}</h2>
              </div>
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-100"
              >
                <XIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Photo & Quick Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {detailItem.photoUrl ? (
                <div className="rounded-2xl overflow-hidden border border-gray-100 h-64 bg-gray-50">
                  <img
                    src={detailItem.photoUrl}
                    alt={detailItem.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="rounded-2xl bg-gray-100 flex items-center justify-center text-gray-400 h-64">
                  <ShirtIcon className="w-12 h-12 opacity-40" />
                </div>
              )}

              <div className="space-y-3 flex flex-col justify-between">
                <div className="space-y-2">
                  <div>
                    <span className="text-[10px] text-gray-400 font-bold uppercase">Status Pemilihan</span>
                    <div className="mt-1 flex items-center gap-2">
                      {getStatusBadge(detailItem.selectionStatus)}
                      <div className="flex gap-1">
                        {STATUS_OPTIONS.map(st => (
                          <button
                            key={st}
                            onClick={() => handleQuickStatusChange(detailItem, st)}
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                              detailItem.selectionStatus === st
                                ? 'bg-gray-900 text-white'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                          >
                            {st}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] text-gray-400 font-bold uppercase">Model & Warna</span>
                    <p className="text-xs font-bold text-gray-800">
                      {detailItem.model || 'Standar'} • {detailItem.color || 'Tidak ditentukan'}
                    </p>
                  </div>

                  <div>
                    <span className="text-[10px] text-gray-400 font-bold uppercase">Ukuran Umum</span>
                    <p className="text-xs font-bold text-[#5D87FF]">{detailItem.size}</p>
                  </div>

                  {detailItem.targetPerson && (
                    <div>
                      <span className="text-[10px] text-gray-400 font-bold uppercase">Subjek / Pemakai</span>
                      <p className="text-xs font-bold text-purple-700">{detailItem.targetPerson}</p>
                    </div>
                  )}

                  <div>
                    <span className="text-[10px] text-gray-400 font-bold uppercase">Harga {detailItem.priceType}</span>
                    <p className="text-lg font-black text-[#5D87FF]">
                      Rp {detailItem.rentalPrice.toLocaleString('id-ID')}
                    </p>
                    {detailItem.purchasePrice ? (
                      <p className="text-xs text-gray-500">
                        Harga Pembelian: Rp {detailItem.purchasePrice.toLocaleString('id-ID')}
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => {
                      setIsDetailModalOpen(false);
                      handleOpenAssignModal(detailItem);
                    }}
                    className="w-full py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl text-xs font-bold hover:opacity-90 flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    <HeartIcon className="w-3.5 h-3.5" /> Pilih untuk Pengantin
                  </button>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setIsDetailModalOpen(false);
                        handleOpenEditModal(detailItem);
                      }}
                      className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-xs font-bold text-gray-700 flex items-center justify-center gap-1.5"
                    >
                      <PencilIcon className="w-3.5 h-3.5" /> Edit Data
                    </button>
                    <button
                      onClick={() => window.print()}
                      className="py-2 px-3 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-50"
                    >
                      <PrinterIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Detailed Measurements Sheet */}
            {detailItem.measurements && (
              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-3">
                <div className="flex items-center gap-2">
                  <RulerIcon className="w-4 h-4 text-[#5D87FF]" />
                  <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                    Lembar Ukuran Fitting Tubuh (cm / kg)
                  </h4>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  {detailItem.measurements.chest && (
                    <div className="bg-white p-2.5 rounded-xl border border-gray-200">
                      <span className="text-[10px] text-gray-400 block font-semibold">Lingkar Dada</span>
                      <span className="font-extrabold text-gray-800">{detailItem.measurements.chest} cm</span>
                    </div>
                  )}
                  {detailItem.measurements.waist && (
                    <div className="bg-white p-2.5 rounded-xl border border-gray-200">
                      <span className="text-[10px] text-gray-400 block font-semibold">Lingkar Pinggang</span>
                      <span className="font-extrabold text-gray-800">{detailItem.measurements.waist} cm</span>
                    </div>
                  )}
                  {detailItem.measurements.hips && (
                    <div className="bg-white p-2.5 rounded-xl border border-gray-200">
                      <span className="text-[10px] text-gray-400 block font-semibold">Lingkar Pinggul</span>
                      <span className="font-extrabold text-gray-800">{detailItem.measurements.hips} cm</span>
                    </div>
                  )}
                  {detailItem.measurements.shoulder && (
                    <div className="bg-white p-2.5 rounded-xl border border-gray-200">
                      <span className="text-[10px] text-gray-400 block font-semibold">Lebar Bahu</span>
                      <span className="font-extrabold text-gray-800">{detailItem.measurements.shoulder} cm</span>
                    </div>
                  )}
                  {detailItem.measurements.sleeveLength && (
                    <div className="bg-white p-2.5 rounded-xl border border-gray-200">
                      <span className="text-[10px] text-gray-400 block font-semibold">Panjang Lengan</span>
                      <span className="font-extrabold text-gray-800">{detailItem.measurements.sleeveLength} cm</span>
                    </div>
                  )}
                  {detailItem.measurements.shirtLength && (
                    <div className="bg-white p-2.5 rounded-xl border border-gray-200">
                      <span className="text-[10px] text-gray-400 block font-semibold">Panjang Baju/Gaun</span>
                      <span className="font-extrabold text-gray-800">{detailItem.measurements.shirtLength} cm</span>
                    </div>
                  )}
                  {detailItem.measurements.height && (
                    <div className="bg-white p-2.5 rounded-xl border border-gray-200">
                      <span className="text-[10px] text-gray-400 block font-semibold">Tinggi Badan</span>
                      <span className="font-extrabold text-gray-800">{detailItem.measurements.height} cm</span>
                    </div>
                  )}
                  {detailItem.measurements.weight && (
                    <div className="bg-white p-2.5 rounded-xl border border-gray-200">
                      <span className="text-[10px] text-gray-400 block font-semibold">Berat Badan</span>
                      <span className="font-extrabold text-gray-800">{detailItem.measurements.weight} kg</span>
                    </div>
                  )}
                  {detailItem.measurements.shoesSize && (
                    <div className="bg-white p-2.5 rounded-xl border border-gray-200">
                      <span className="text-[10px] text-gray-400 block font-semibold">Ukuran Sepatu</span>
                      <span className="font-extrabold text-gray-800">{detailItem.measurements.shoesSize}</span>
                    </div>
                  )}
                </div>

                {detailItem.measurements.customNotes && (
                  <div className="text-xs text-gray-600 bg-white p-2.5 rounded-xl border border-gray-200">
                    <strong className="text-gray-800">Catatan Khusus Proporsi:</strong> {detailItem.measurements.customNotes}
                  </div>
                )}
              </div>
            )}

            {/* Fitting Notes */}
            <div className="bg-amber-50/70 p-4 rounded-2xl border border-amber-200 space-y-1">
              <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider">
                Catatan Fitting & Penyesuaian Busana
              </h4>
              <p className="text-xs text-amber-800 leading-relaxed">
                {detailItem.fittingNotes || 'Belum ada catatan fitting untuk busana ini.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ADD / EDIT MODAL */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div>
                <h3 className="text-lg font-black text-gray-900">
                  {editingItem ? 'Edit Katalog Busana' : 'Tambah Busana Baru ke Katalog'}
                </h3>
                <p className="text-xs text-gray-500">
                  Lengkapi kategori, model, ukuran fitting, harga, dan status pilihan.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsFormModalOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-100"
              >
                <XIcon className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="space-y-4">
              {/* Category & Subcategory */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Kategori Utama *
                  </label>
                  <select
                    value={mainCategory}
                    onChange={e => handleMainCategoryChangeInForm(e.target.value as AttireMainCategory)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-900 focus:outline-none focus:bg-white focus:border-[#5D87FF]"
                    required
                  >
                    {MAIN_CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Subkategori Busana *
                  </label>
                  <select
                    value={subcategory}
                    onChange={e => setSubcategory(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-900 focus:outline-none focus:bg-white focus:border-[#5D87FF]"
                    required
                  >
                    {currentSubcategories.map(sub => (
                      <option key={sub} value={sub}>{sub}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Name & Model */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Nama Busana *
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Kebaya Akad Brokat Prancis"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-900 focus:outline-none focus:bg-white focus:border-[#5D87FF]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Model Busana
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Mermaid Silhouette / Ballgown / Beskap Solo"
                    value={model}
                    onChange={e => setModel(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-900 focus:outline-none focus:bg-white focus:border-[#5D87FF]"
                  />
                </div>
              </div>

              {/* Color, Size, Target Person */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Warna Busana
                  </label>
                  <input
                    type="text"
                    placeholder="Broken White / Sage / Gold"
                    value={color}
                    onChange={e => setColor(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-900 focus:outline-none focus:bg-white focus:border-[#5D87FF]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Ukuran Busana
                  </label>
                  <input
                    type="text"
                    placeholder="All Size / S / M / L / XL"
                    value={size}
                    onChange={e => setSize(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-900 focus:outline-none focus:bg-white focus:border-[#5D87FF]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Subjek / Pemakai
                  </label>
                  <input
                    type="text"
                    placeholder="Pengantin / Ibu / Ayah / Bridesmaid"
                    value={targetPerson}
                    onChange={e => setTargetPerson(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-900 focus:outline-none focus:bg-white focus:border-[#5D87FF]"
                  />
                </div>
              </div>

              {/* Foto Busana: Upload File & Preview */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-xs font-bold text-gray-800">
                    <ImageIcon className="w-4 h-4 text-[#5D87FF]" />
                    <span>Foto Katalog Busana</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-[#5D87FF] border border-blue-200">
                      Upload Gambar
                    </span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowManualUrlInput(!showManualUrlInput)}
                    className="text-[11px] text-gray-500 hover:text-[#5D87FF] font-medium flex items-center gap-1 transition-colors"
                  >
                    <LinkIcon className="w-3 h-3" />
                    {showManualUrlInput ? 'Sembunyikan Opsi URL' : 'Opsi URL / Preset'}
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
                  <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 flex items-center gap-2 text-xs text-red-700">
                    <AlertCircleIcon className="w-4 h-4 text-red-500 shrink-0" />
                    <span>{uploadError}</span>
                  </div>
                )}

                {/* Upload Area / Preview */}
                {photoUrl ? (
                  <div className="relative p-3.5 bg-gray-50 border border-gray-200 rounded-2xl flex flex-col sm:flex-row items-center gap-4">
                    <div className="relative group w-28 h-28 sm:w-32 sm:h-32 rounded-xl overflow-hidden bg-gray-200 border border-gray-300 shrink-0 shadow-sm">
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
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckIcon className="w-3.5 h-3.5 text-emerald-600" />
                          Foto Busana Terpasang
                        </span>
                        {isUploadingPhoto && (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-[#5D87FF] animate-pulse">
                            <RefreshCwIcon className="w-3 h-3 animate-spin" />
                            Mengunggah...
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-gray-500 line-clamp-1 break-all">
                        {photoUrl.startsWith('data:') ? 'Foto tersimpan secara lokal & siap disimpan' : photoUrl}
                      </p>
                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isUploadingPhoto}
                          className="px-3 py-1.5 rounded-xl bg-white border border-gray-300 text-xs font-semibold text-gray-700 hover:bg-gray-100 transition-colors inline-flex items-center gap-1.5 shadow-sm"
                        >
                          <CameraIcon className="w-3.5 h-3.5 text-[#5D87FF]" />
                          Ganti Foto
                        </button>
                        <button
                          type="button"
                          onClick={() => setPhotoUrl('')}
                          disabled={isUploadingPhoto}
                          className="px-3 py-1.5 rounded-xl bg-red-50 border border-red-200 text-xs font-semibold text-red-600 hover:bg-red-100 transition-colors inline-flex items-center gap-1.5"
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
                    className={`relative border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                      isDraggingPhoto
                        ? 'border-[#5D87FF] bg-blue-50/70 scale-[1.01]'
                        : 'border-gray-300 bg-gray-50/70 hover:bg-gray-100/70 hover:border-gray-400'
                    }`}
                  >
                    {isUploadingPhoto ? (
                      <div className="py-4 space-y-2 flex flex-col items-center">
                        <RefreshCwIcon className="w-8 h-8 text-[#5D87FF] animate-spin" />
                        <p className="text-xs font-bold text-gray-700">Mengunggah & mengompres foto busana...</p>
                        <p className="text-[11px] text-gray-400">Mohon tunggu sebentar</p>
                      </div>
                    ) : (
                      <div className="space-y-2 flex flex-col items-center">
                        <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#5D87FF] flex items-center justify-center shadow-sm">
                          <UploadCloudIcon className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-gray-800">
                            Klik untuk upload foto busana dari perangkat
                          </p>
                          <p className="text-[11px] text-gray-500 mt-0.5">
                            atau seret & letakkan gambar ke area ini
                          </p>
                        </div>
                        <div className="flex items-center gap-2 pt-1">
                          <span className="px-3 py-1.5 rounded-xl bg-white border border-gray-200 text-xs font-semibold text-gray-700 shadow-sm inline-flex items-center gap-1.5 hover:bg-gray-50">
                            <CameraIcon className="w-3.5 h-3.5 text-[#5D87FF]" />
                            Pilih Foto (JPG, PNG, WEBP)
                          </span>
                        </div>
                        <p className="text-[10px] text-gray-400">
                          Foto otomatis dikompresi agar hemat memori & cepat dimuat
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Optional manual URL input & presets */}
                {showManualUrlInput && (
                  <div className="p-3 bg-gray-100/80 rounded-xl space-y-2 border border-gray-200">
                    <label className="block text-[11px] font-bold text-gray-700">
                      Atau Tempel Tautan URL Gambar Manual:
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        placeholder="https://images.unsplash.com/..."
                        value={photoUrl}
                        onChange={e => setPhotoUrl(e.target.value)}
                        className="flex-1 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-900 focus:outline-none focus:border-[#5D87FF]"
                      />
                      {photoUrl && (
                        <button
                          type="button"
                          onClick={() => setPhotoUrl('')}
                          className="px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          Hapus
                        </button>
                      )}
                    </div>
                    {/* Presets */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="text-[10px] text-gray-400 font-bold uppercase">Pilih Preset Cepat:</span>
                      {PRESET_PHOTOS.filter(p => p.category === mainCategory).slice(0, 4).map(preset => (
                        <button
                          key={preset.url}
                          type="button"
                          onClick={() => setPhotoUrl(preset.url)}
                          className="px-2 py-0.5 rounded text-[10px] font-semibold bg-white hover:bg-gray-200 text-gray-700 border border-gray-200 transition-colors"
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Price Type, Price, and Status */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Tipe Harga
                  </label>
                  <select
                    value={priceType}
                    onChange={e => setPriceType(e.target.value as AttirePriceType)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-900 focus:outline-none focus:bg-white focus:border-[#5D87FF]"
                  >
                    {PRICE_TYPES.map(pt => (
                      <option key={pt} value={pt}>{pt}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Harga Sewa / Biaya (Rp) *
                  </label>
                  <input
                    type="number"
                    placeholder="0"
                    value={rentalPrice}
                    onChange={e => setRentalPrice(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-900 focus:outline-none focus:bg-white focus:border-[#5D87FF]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Status Pilihan *
                  </label>
                  <select
                    value={selectionStatus}
                    onChange={e => setSelectionStatus(e.target.value as AttireSelectionStatus)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:outline-none focus:bg-white focus:border-[#5D87FF]"
                  >
                    {STATUS_OPTIONS.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Toggle Detail Ukuran Fitting */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setShowMeasurementsForm(!showMeasurementsForm)}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#5D87FF] hover:underline"
                >
                  <RulerIcon className="w-4 h-4" />
                  {showMeasurementsForm ? 'Sembunyikan Lembar Ukuran Fitting' : '+ Isi Detail Ukuran Fitting Tubuh (cm/kg)'}
                </button>
              </div>

              {/* Ukuran Fitting Form */}
              {showMeasurementsForm && (
                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-3">
                  <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                    Ukuran Tubuh Detail (cm / kg)
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-[11px] text-gray-500 mb-1">Lingkar Dada (cm)</label>
                      <input
                        type="number"
                        step="0.1"
                        placeholder="86"
                        value={chest}
                        onChange={e => setChest(e.target.value)}
                        className="w-full p-2 bg-white border border-gray-200 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-gray-500 mb-1">Lingkar Pinggang (cm)</label>
                      <input
                        type="number"
                        step="0.1"
                        placeholder="70"
                        value={waist}
                        onChange={e => setWaist(e.target.value)}
                        className="w-full p-2 bg-white border border-gray-200 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-gray-500 mb-1">Lingkar Pinggul (cm)</label>
                      <input
                        type="number"
                        step="0.1"
                        placeholder="92"
                        value={hips}
                        onChange={e => setHips(e.target.value)}
                        className="w-full p-2 bg-white border border-gray-200 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-gray-500 mb-1">Lebar Bahu (cm)</label>
                      <input
                        type="number"
                        step="0.1"
                        placeholder="38"
                        value={shoulder}
                        onChange={e => setShoulder(e.target.value)}
                        className="w-full p-2 bg-white border border-gray-200 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-gray-500 mb-1">Panjang Lengan (cm)</label>
                      <input
                        type="number"
                        step="0.1"
                        placeholder="54"
                        value={sleeveLength}
                        onChange={e => setSleeveLength(e.target.value)}
                        className="w-full p-2 bg-white border border-gray-200 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-gray-500 mb-1">Panjang Baju/Gaun (cm)</label>
                      <input
                        type="number"
                        step="0.1"
                        placeholder="140"
                        value={shirtLength}
                        onChange={e => setShirtLength(e.target.value)}
                        className="w-full p-2 bg-white border border-gray-200 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-gray-500 mb-1">Tinggi Badan (cm)</label>
                      <input
                        type="number"
                        step="0.1"
                        placeholder="165"
                        value={height}
                        onChange={e => setHeight(e.target.value)}
                        className="w-full p-2 bg-white border border-gray-200 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-gray-500 mb-1">Ukuran Sepatu (EU)</label>
                      <input
                        type="text"
                        placeholder="38"
                        value={shoesSize}
                        onChange={e => setShoesSize(e.target.value)}
                        className="w-full p-2 bg-white border border-gray-200 rounded-lg text-xs"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] text-gray-500 mb-1">Catatan Proporsi Tubuh Khusus</label>
                    <input
                      type="text"
                      placeholder="Misal: Lengan longgar wudhu, belahan tertutup, petticoat ring 6"
                      value={customNotes}
                      onChange={e => setCustomNotes(e.target.value)}
                      className="w-full p-2 bg-white border border-gray-200 rounded-lg text-xs"
                    />
                  </div>
                </div>
              )}

              {/* Catatan Fitting */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Catatan Fitting & Penyesuaian
                </label>
                <textarea
                  rows={3}
                  placeholder="Catatan hasil fitting, bagian yang dipermak, jadwal fitting berikutnya..."
                  value={fittingNotes}
                  onChange={e => setFittingNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-900 focus:outline-none focus:bg-white focus:border-[#5D87FF] resize-none"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#5D87FF] text-white rounded-xl text-xs font-bold hover:bg-[#4871e3] transition-all shadow-sm"
                >
                  Simpan ke Katalog
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttireManagementPage;
