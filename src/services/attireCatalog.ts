import supabase from '../lib/supabaseClient';
import {
  AttireCatalogItem,
  AttireMainCategory,
  AttirePriceType,
  AttireSelectionStatus,
} from '../types';
import { compressImage } from './storage';

const TABLE = 'attire_catalog';
const LOCAL_STORAGE_KEY = 'filda_mua_attire_catalog';

export const ATTIRE_CATEGORIES: Record<AttireMainCategory, string[]> = {
  'Gaun Pengantin': [
    'Pilihan gaun akad',
    'Pilihan gaun resepsi',
    'Gaun tambahan',
  ],
  'Busana Orang Tua': [
    'Baju ibu pengantin',
    'Baju ayah pengantin',
  ],
  'Busana Saudara': [
    'Baju kakak/adik perempuan',
    'Baju kakak/adik laki-laki',
    'Bridesmaid',
    'Groomsmen',
  ],
  'Aksesori': [
    'Hijab',
    'Mahkota',
    'Hairpiece',
    'Veil',
    'Aksesori tambahan',
  ],
};

export const INITIAL_CATALOG_SEED: AttireCatalogItem[] = [
  // ─── 1. GAUN PENGANTIN ───
  {
    id: 'cat_gaun_akad_1',
    name: 'Kebaya Akad Brokat Prancis Broken White',
    mainCategory: 'Gaun Pengantin',
    subcategory: 'Pilihan gaun akad',
    category: 'Gaun Pengantin Akad',
    model: 'Kebaya Modern Ekor Payet Mutiara',
    color: 'Broken White / Putih Tulang',
    size: 'All Size (Fit to S-L)',
    priceType: 'Sewa',
    rentalPrice: 3500000,
    purchasePrice: 9000000,
    selectionStatus: 'Dipilih',
    photoUrl: 'https://images.unsplash.com/photo-1594552072238-b8a33785b261?auto=format&fit=crop&w=800&q=80',
    fittingNotes: 'Fitting tanggal 12 November. Pinggang perlu dikecilkan 1.5 cm, kancing punggung siap.',
    measurements: {
      chest: 86,
      waist: 68,
      hips: 92,
      shoulder: 38,
      sleeveLength: 54,
      shirtLength: 140,
      height: 162,
      weight: 51,
      shoesSize: '38',
      customNotes: 'Panjang ekor gaun 1.5 meter, belahan belakang tertutup furing'
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'cat_gaun_resepsi_1',
    name: 'Ballgown Royal Glitz Champagne Gold',
    mainCategory: 'Gaun Pengantin',
    subcategory: 'Pilihan gaun resepsi',
    category: 'Gaun Pengantin Resepsi',
    model: 'Ballgown Off-Shoulder Kristal Swarovski',
    color: 'Champagne Gold Sparkle',
    size: 'M',
    priceType: 'Sewa Perdana',
    rentalPrice: 5500000,
    purchasePrice: 14500000,
    selectionStatus: 'Dipilih',
    photoUrl: 'https://images.unsplash.com/photo-1549416878-b9ca35c2d47b?auto=format&fit=crop&w=800&q=80',
    fittingNotes: 'Petticoat ring 6 sudah dipasang, cup bra diposisikan pas di dada.',
    measurements: {
      chest: 88,
      waist: 70,
      hips: 94,
      shoulder: 39,
      shirtLength: 145,
      height: 165,
      weight: 53,
      shoesSize: '39',
      customNotes: 'Dilengkapi petticoat 6 ring & sarung tangan satin'
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'cat_gaun_resepsi_2',
    name: 'Mermaid Silk Dress Rose Gold Shimmer',
    mainCategory: 'Gaun Pengantin',
    subcategory: 'Pilihan gaun resepsi',
    category: 'Gaun Pengantin Resepsi',
    model: 'Mermaid Silhouette Long Cape',
    color: 'Rose Gold',
    size: 'S',
    priceType: 'Sewa',
    rentalPrice: 4200000,
    purchasePrice: 11000000,
    selectionStatus: 'Cadangan',
    photoUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80',
    fittingNotes: 'Pilihan cadangan jika acara resepsi outdoor malam.',
    measurements: {
      chest: 84,
      waist: 66,
      hips: 90,
      shoulder: 37,
      shirtLength: 138,
      height: 160,
      weight: 48,
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'cat_gaun_tambahan_1',
    name: 'Gaun After-Party Cocktail Silver Metallic',
    mainCategory: 'Gaun Pengantin',
    subcategory: 'Gaun tambahan',
    category: 'Gaun Tambahan',
    model: 'A-Line Midi Cocktail Dress',
    color: 'Silver Shimmer',
    size: 'M',
    priceType: 'Sewa',
    rentalPrice: 1800000,
    purchasePrice: 4500000,
    selectionStatus: 'Belum Dipilih',
    photoUrl: 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&w=800&q=80',
    fittingNotes: 'Gaun santai untuk sesi lempar bunga dan after party.',
    measurements: {
      chest: 88,
      waist: 70,
      shirtLength: 110,
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },

  // ─── 2. BUSANA ORANG TUA ───
  {
    id: 'cat_ortu_ibu_1',
    name: 'Kebaya Ibu Besan Modern Sage Green Silk',
    mainCategory: 'Busana Orang Tua',
    subcategory: 'Baju ibu pengantin',
    category: 'Busana Ibu',
    model: 'Kebaya Panjang Kurung Tabur Payet',
    color: 'Sage Green Muted',
    size: 'XL',
    priceType: 'Sewa',
    rentalPrice: 1200000,
    purchasePrice: 3200000,
    selectionStatus: 'Dipilih',
    photoUrl: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80',
    targetPerson: 'Ibu Pengantin Wanita & Besan',
    fittingNotes: 'Kain bawahan songket senada sudah disiapkan. Lengan longgar nyaman wudhu.',
    measurements: {
      chest: 104,
      waist: 92,
      hips: 110,
      shoulder: 43,
      sleeveLength: 56,
      shirtLength: 95,
      height: 155,
      weight: 68,
      customNotes: 'Model kurung santun berfuring katun sejuk'
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'cat_ortu_ayah_1',
    name: 'Set Beskap Ayah Pengantin Sunda Bordir Emas',
    mainCategory: 'Busana Orang Tua',
    subcategory: 'Baju ayah pengantin',
    category: 'Busana Ayah',
    model: 'Beskap Sikepan Sunda Bordir Benang Emas',
    color: 'Hitam Emas / Black Gold',
    size: 'L',
    priceType: 'Sewa',
    rentalPrice: 950000,
    purchasePrice: 2500000,
    selectionStatus: 'Dipilih',
    photoUrl: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=800&q=80',
    targetPerson: 'Ayah Pengantin Pria & Wanita',
    fittingNotes: 'Lengkap dengan blangkon ukuran 58 & kain bendo senada.',
    measurements: {
      chest: 102,
      shoulder: 45,
      sleeveLength: 58,
      shirtLength: 75,
      height: 168,
      weight: 72,
      customNotes: 'Celana panjang hitam & kain sinjang lereng batik'
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },

  // ─── 3. BUSANA SAUDARA ───
  {
    id: 'cat_saudara_perempuan_1',
    name: 'Dress Brokat Saudara Kandung Dusty Lilac',
    mainCategory: 'Busana Saudara',
    subcategory: 'Baju kakak/adik perempuan',
    category: 'Busana Saudara',
    model: 'Dress A-Line Drapery Chiffon',
    color: 'Dusty Lilac',
    size: 'M',
    priceType: 'Sewa',
    rentalPrice: 750000,
    selectionStatus: 'Dipilih',
    photoUrl: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?auto=format&fit=crop&w=800&q=80',
    targetPerson: 'Kakak Perempuan Pengantin',
    fittingNotes: 'Bagian dada pas, rok jatuh anggun.',
    measurements: {
      chest: 88,
      waist: 72,
      hips: 94,
      shirtLength: 135,
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'cat_saudara_laki_1',
    name: 'Jas Semi-Formal Saudara Kandung Slim Fit',
    mainCategory: 'Busana Saudara',
    subcategory: 'Baju kakak/adik laki-laki',
    category: 'Busana Saudara',
    model: 'Single-Breasted Suit 2-Button',
    color: 'Charcoal Grey',
    size: 'M',
    priceType: 'Sewa',
    rentalPrice: 650000,
    selectionStatus: 'Belum Dipilih',
    photoUrl: 'https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?auto=format&fit=crop&w=800&q=80',
    targetPerson: 'Adik Laki-laki Pengantin',
    fittingNotes: 'Panjang lengan pas dengan manset kemeja putih.',
    measurements: {
      chest: 96,
      shoulder: 43,
      sleeveLength: 60,
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'cat_bridesmaid_1',
    name: 'Uniform Dress Bridesmaid Silk Satin Sage Green',
    mainCategory: 'Busana Saudara',
    subcategory: 'Bridesmaid',
    category: 'Bridesmaid',
    model: 'Maxi Slip Dress with Organza Outer',
    color: 'Sage Green',
    size: 'All Size (Set 6 Orang)',
    priceType: 'Sewa',
    rentalPrice: 450000,
    selectionStatus: 'Dipilih',
    photoUrl: 'https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=800&q=80',
    targetPerson: 'Tim Bridesmaid (6 Orang)',
    fittingNotes: 'Sudah diserahkan kain seragam & outer organza.',
    measurements: {
      customNotes: 'Pita belakang fleksibel menyesuaikan lingkar dada S sampai XL'
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'cat_groomsmen_1',
    name: 'Set Rompi & Dasi Groomsmen Midnight Navy',
    mainCategory: 'Busana Saudara',
    subcategory: 'Groomsmen',
    category: 'Groomsmen',
    model: 'Vest & Bow Tie Satin Silk',
    color: 'Midnight Navy',
    size: 'L',
    priceType: 'Sewa',
    rentalPrice: 350000,
    selectionStatus: 'Cadangan',
    photoUrl: 'https://images.unsplash.com/photo-1593030761757-71fae45fa0e7?auto=format&fit=crop&w=800&q=80',
    targetPerson: 'Tim Groomsmen (4 Orang)',
    fittingNotes: 'Tali pengencang punggung vest berfungsi baik.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },

  // ─── 4. AKSESORI ───
  {
    id: 'cat_aksesori_mahkota_1',
    name: 'Mahkota Tiara Royal Swarovski Crystal',
    mainCategory: 'Aksesori',
    subcategory: 'Mahkota',
    category: 'Aksesori',
    model: 'Tiara Princess High Arch',
    color: 'Silver Crystal',
    size: 'All Size',
    priceType: 'Sewa',
    rentalPrice: 650000,
    purchasePrice: 2000000,
    selectionStatus: 'Dipilih',
    photoUrl: 'https://images.unsplash.com/photo-1535295972055-1c762f4483e5?auto=format&fit=crop&w=800&q=80',
    fittingNotes: 'Sirkam sudah dicek kokoh, tidak sakit di rambut/hijab.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'cat_aksesori_veil_1',
    name: 'Veil Slayer Mutiara Tabur 3 Meter Cathedral',
    mainCategory: 'Aksesori',
    subcategory: 'Veil',
    category: 'Aksesori',
    model: 'Cathedral Veil Renda Spanyol & Mutiara',
    color: 'Broken White',
    size: 'Panjang 300 cm',
    priceType: 'Sewa',
    rentalPrice: 500000,
    purchasePrice: 1500000,
    selectionStatus: 'Dipilih',
    photoUrl: 'https://images.unsplash.com/photo-1545232979-8bf68ee9b1af?auto=format&fit=crop&w=800&q=80',
    fittingNotes: 'Dilengkapi klip sirkam kokoh di sanggul/tudung.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'cat_aksesori_hijab_1',
    name: 'Set Hijab Pengantin Paris Silk & Shimmer Voal',
    mainCategory: 'Aksesori',
    subcategory: 'Hijab',
    category: 'Aksesori',
    model: 'Segiempat Hijab Do Pengantin Tegak Paripurna',
    color: 'Off-White & Champagne',
    size: '120 x 120 cm',
    priceType: 'Pembelian',
    rentalPrice: 250000,
    purchasePrice: 250000,
    selectionStatus: 'Dipilih',
    photoUrl: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=800&q=80',
    fittingNotes: 'Bahan tegak di dahi, tidak terawang, anti kusut.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'cat_aksesori_hairpiece_1',
    name: 'Hairpiece Bunga Tembaga & Fresh Pearl Rose Gold',
    mainCategory: 'Aksesori',
    subcategory: 'Hairpiece',
    category: 'Aksesori',
    model: 'Floral Wire Comb Fleksibel',
    color: 'Rose Gold',
    size: '20 cm',
    priceType: 'Sewa',
    rentalPrice: 350000,
    selectionStatus: 'Cadangan',
    photoUrl: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=800&q=80',
    fittingNotes: 'Bisa ditekuk mengikuti lekuk sanggul modern.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'cat_aksesori_tambahan_1',
    name: 'Set Siger Sunda Kencana Sepuh Emas 9 Kembang Goyang',
    mainCategory: 'Aksesori',
    subcategory: 'Aksesori tambahan',
    category: 'Aksesori',
    model: 'Siger Tradisional Jawa Barat Lengkap',
    color: 'Gold Sepuh Emas Asli',
    size: 'Standar Pengantin',
    priceType: 'Sewa',
    rentalPrice: 900000,
    selectionStatus: 'Dipilih',
    photoUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=800&q=80',
    fittingNotes: 'Termasuk 9 kembang goyang, 2 klat bahu, mentul, & ronce melati fresh.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

function getLocalCatalog(): AttireCatalogItem[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) {
      saveLocalCatalog(INITIAL_CATALOG_SEED);
      return INITIAL_CATALOG_SEED;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      saveLocalCatalog(INITIAL_CATALOG_SEED);
      return INITIAL_CATALOG_SEED;
    }
    return parsed;
  } catch {
    return INITIAL_CATALOG_SEED;
  }
}

function saveLocalCatalog(catalog: AttireCatalogItem[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(catalog));
  } catch (e) {
    console.error('Failed to save attire catalog to localStorage', e);
  }
}

function inferMainCategory(subcat: string, legacyCat?: string): AttireMainCategory {
  if (
    subcat?.includes('akad') ||
    subcat?.includes('resepsi') ||
    subcat?.includes('Gaun tambahan') ||
    legacyCat?.includes('Gaun')
  ) {
    return 'Gaun Pengantin';
  }
  if (
    subcat?.includes('ibu') ||
    subcat?.includes('ayah') ||
    legacyCat?.includes('Ayah') ||
    legacyCat?.includes('Ibu')
  ) {
    return 'Busana Orang Tua';
  }
  if (
    subcat?.includes('perempuan') ||
    subcat?.includes('laki-laki') ||
    subcat?.includes('Bridesmaid') ||
    subcat?.includes('Groomsmen') ||
    legacyCat?.includes('Saudara') ||
    legacyCat?.includes('Bridesmaid') ||
    legacyCat?.includes('Groomsmen')
  ) {
    return 'Busana Saudara';
  }
  if (
    subcat?.includes('Hijab') ||
    subcat?.includes('Mahkota') ||
    subcat?.includes('Hairpiece') ||
    subcat?.includes('Veil') ||
    subcat?.includes('Aksesori') ||
    legacyCat?.includes('Aksesori')
  ) {
    return 'Aksesori';
  }
  return 'Gaun Pengantin';
}

export function normalizeAttireCatalogItem(row: any): AttireCatalogItem {
  const subcategory =
    row.subcategory ||
    row.sub_category ||
    row.category ||
    'Pilihan gaun akad';
  const mainCategory =
    row.mainCategory ||
    row.main_category ||
    inferMainCategory(subcategory, row.category);

  return {
    id: row.id || `cat_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    name: row.name || 'Busana Pengantin',
    mainCategory,
    subcategory,
    category: row.category || subcategory,
    model: row.model || '',
    color: row.color || '',
    size: row.size || 'All Size',
    priceType: (row.price_type || row.priceType || 'Sewa') as AttirePriceType,
    rentalPrice: Number(row.rental_price ?? row.rentalPrice ?? row.price ?? 0),
    purchasePrice: row.purchase_price ? Number(row.purchase_price) : row.purchasePrice ? Number(row.purchasePrice) : undefined,
    selectionStatus: (row.selection_status || row.selectionStatus || row.status || 'Belum Dipilih') as AttireSelectionStatus,
    fittingNotes: row.fitting_notes || row.fittingNotes || '',
    photoUrl: row.photo_url || row.photoUrl || '',
    additionalPhotos: Array.isArray(row.additional_photos) ? row.additional_photos : Array.isArray(row.additionalPhotos) ? row.additionalPhotos : [],
    measurements: typeof row.measurements === 'string' ? JSON.parse(row.measurements) : (row.measurements || {}),
    targetPerson: row.target_person || row.targetPerson || '',
    createdAt: row.created_at || row.createdAt || new Date().toISOString(),
    updatedAt: row.updated_at || row.updatedAt || new Date().toISOString(),
  };
}

export async function listAttireCatalog(): Promise<AttireCatalogItem[]> {
  try {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return getLocalCatalog();
    }
    if (!data || data.length === 0) {
      return getLocalCatalog();
    }
    return data.map(normalizeAttireCatalogItem);
  } catch {
    return getLocalCatalog();
  }
}

export async function createAttireCatalogItem(
  item: Omit<AttireCatalogItem, 'id' | 'createdAt' | 'updatedAt'>
): Promise<AttireCatalogItem> {
  const newId = `cat_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const now = new Date().toISOString();
  const payload: AttireCatalogItem = {
    ...item,
    id: newId,
    createdAt: now,
    updatedAt: now,
  };

  const dbRow = {
    id: payload.id,
    name: payload.name,
    main_category: payload.mainCategory,
    subcategory: payload.subcategory,
    sub_category: payload.subcategory,
    category: payload.category || payload.subcategory,
    model: payload.model || '',
    color: payload.color || '',
    size: payload.size || 'All Size',
    price_type: payload.priceType || 'Sewa',
    rental_price: payload.rentalPrice || 0,
    purchase_price: payload.purchasePrice,
    selection_status: payload.selectionStatus || 'Belum Dipilih',
    fitting_notes: payload.fittingNotes || '',
    photo_url: payload.photoUrl || '',
    additional_photos: payload.additionalPhotos || [],
    measurements: payload.measurements || {},
    target_person: payload.targetPerson || '',
    created_at: now,
    updated_at: now,
  };

  try {
    const { data, error } = await supabase
      .from(TABLE)
      .insert([dbRow])
      .select('*')
      .single();

    if (error) {
      const all = getLocalCatalog();
      all.unshift(payload);
      saveLocalCatalog(all);
      return payload;
    }
    const normalized = normalizeAttireCatalogItem(data);
    const merged = { ...payload, ...normalized };
    const all = getLocalCatalog();
    all.unshift(merged);
    saveLocalCatalog(all);
    return merged;
  } catch {
    const all = getLocalCatalog();
    all.unshift(payload);
    saveLocalCatalog(all);
    return payload;
  }
}

export async function updateAttireCatalogItem(
  id: string,
  patch: Partial<AttireCatalogItem>
): Promise<AttireCatalogItem> {
  const now = new Date().toISOString();
  const dbPatch: any = { updated_at: now };
  if (patch.name !== undefined) dbPatch.name = patch.name;
  if (patch.mainCategory !== undefined) dbPatch.main_category = patch.mainCategory;
  if (patch.subcategory !== undefined) {
    dbPatch.subcategory = patch.subcategory;
    dbPatch.sub_category = patch.subcategory;
  }
  if (patch.category !== undefined) dbPatch.category = patch.category;
  if (patch.model !== undefined) dbPatch.model = patch.model;
  if (patch.color !== undefined) dbPatch.color = patch.color;
  if (patch.size !== undefined) dbPatch.size = patch.size;
  if (patch.priceType !== undefined) dbPatch.price_type = patch.priceType;
  if (patch.rentalPrice !== undefined) dbPatch.rental_price = patch.rentalPrice;
  if (patch.purchasePrice !== undefined) dbPatch.purchase_price = patch.purchasePrice;
  if (patch.selectionStatus !== undefined) dbPatch.selection_status = patch.selectionStatus;
  if (patch.fittingNotes !== undefined) dbPatch.fitting_notes = patch.fittingNotes;
  if (patch.photoUrl !== undefined) dbPatch.photo_url = patch.photoUrl;
  if (patch.additionalPhotos !== undefined) dbPatch.additional_photos = patch.additionalPhotos;
  if (patch.measurements !== undefined) dbPatch.measurements = patch.measurements;
  if (patch.targetPerson !== undefined) dbPatch.target_person = patch.targetPerson;

  // Always update locally
  const all = getLocalCatalog();
  const idx = all.findIndex(r => r.id === id);
  let updatedItem: AttireCatalogItem;
  if (idx !== -1) {
    updatedItem = { ...all[idx], ...patch, updatedAt: now };
    all[idx] = updatedItem;
    saveLocalCatalog(all);
  } else {
    updatedItem = { id, updatedAt: now, ...patch } as AttireCatalogItem;
  }

  try {
    await supabase.from(TABLE).update(dbPatch).eq('id', id);
  } catch {
    // Ignore error, local copy is saved
  }

  return updatedItem;
}

export async function updateAttireSelectionStatus(
  id: string,
  selectionStatus: AttireSelectionStatus
): Promise<void> {
  await updateAttireCatalogItem(id, { selectionStatus });
}

export async function deleteAttireCatalogItem(id: string): Promise<void> {
  try {
    await supabase.from(TABLE).delete().eq('id', id);
  } catch {
    // Ignore error
  }

  const all = getLocalCatalog().filter(r => r.id !== id);
  saveLocalCatalog(all);
}

export function resetAttireCatalogToDefault(): AttireCatalogItem[] {
  saveLocalCatalog(INITIAL_CATALOG_SEED);
  return INITIAL_CATALOG_SEED;
}

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

export async function uploadAttirePhoto(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('File harus berupa gambar (JPG, PNG, WEBP, atau format foto lainnya)');
  }

  let processedFile = file;
  try {
    // Kompres gambar agar efisien & hemat bandwidth
    processedFile = await compressImage(file, 1600, 0.78, 300 * 1024);
    const ext = processedFile.name.split('.').pop()?.toLowerCase() || 'jpg';
    const filePath = `attire/${new Date().getFullYear()}/${new Date().getMonth() + 1}/${crypto.randomUUID()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('gallery-images')
      .upload(filePath, processedFile, { upsert: true, cacheControl: '31536000' });

    if (!uploadError) {
      const { data: publicUrl } = supabase.storage
        .from('gallery-images')
        .getPublicUrl(filePath);

      if (publicUrl?.publicUrl) {
        return publicUrl.publicUrl;
      }
    } else {
      console.warn('[attireCatalog] Supabase storage upload notice, using base64 preview fallback:', uploadError);
    }
  } catch (err) {
    console.warn('[attireCatalog] Upload exception, fallback to base64:', err);
  }

  // Fallback to base64 data URL so it works seamlessly offline and without bucket errors
  return await fileToBase64(processedFile);
}
