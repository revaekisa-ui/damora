import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { Package, AddOn, Profile, Client, Project, Transaction, Lead, Notification, Card, ClientStatus, PaymentStatus, TransactionType, LeadStatus, ContactChannel, ClientType, BookingStatus, ViewType, PromoCode, REGIONS, WorkflowItem, PackageTermItem } from '../../../types';
import Modal from '../../../shared/ui/Modal';
import { CheckIcon, CameraIcon, WhatsappIcon, cleanPhoneNumber } from '../../../constants';
import { listPackages } from '../../../services/packages';
import { listAddOns } from '../../../services/addOns';
import { getProfile } from '../../../services/profile';
import { createClient } from '../../../services/clients';
import { createProject } from '../../../services/projects';
import { createLead as createLeadRow, updateLead as updateLeadRow } from '../../../services/leads';
import { uploadDpProof } from '../../../services/storage';
import { createTransaction } from '../../../services/transactions';
import RupiahInput from '../../../shared/form/RupiahInput';
import { Download, FileText, MapPin, CheckCircle2, ListOrdered, Sparkles, ShieldCheck, Plus, Trash2 } from 'lucide-react';

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
};

const toBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
});

const UploadIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="17 8 12 3 7 8" />
        <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
);

const ChevronDownIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
);

interface PublicPackagesProps {
    userProfile: Profile;
    showNotification: (message: string) => void;
    setClients: React.Dispatch<React.SetStateAction<Client[]>>;
    setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
    setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
    setCards: React.Dispatch<React.SetStateAction<Card[]>>;
    setLeads: React.Dispatch<React.SetStateAction<Lead[]>>;
    addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'isRead'>) => void;
    cards: Card[];
    projects: Project[];
    promoCodes: PromoCode[];
    setPromoCodes: React.Dispatch<React.SetStateAction<PromoCode[]>>;
    leads?: Lead[];
}


const AddOnItem: React.FC<{ addOn: AddOn }> = ({ addOn }) => {
    return (
        <div className="border-b border-brand-border last:border-b-0 p-4 flex justify-between items-center">
            <p className="font-semibold text-brand-text-light">{addOn.name}</p>
            <p className="text-sm font-bold text-brand-accent">{formatCurrency(addOn.price)}</p>
        </div>
    );
};

const initialForm = {
    clientName: '', email: '', phone: '', instagram: '', date: '', location: '', transportCost: '', selectedAddOnIds: [] as string[], promoCode: '', dp: '', durationSelection: '' as string, unitPrice: undefined as number | undefined
};



const PublicPackages: React.FC<PublicPackagesProps> = ({ userProfile: initialUserProfile, showNotification, setClients, setProjects, setTransactions, setCards, setLeads, addNotification, cards = [], projects = [], promoCodes = [], setPromoCodes, leads = [] }) => {
    const [packages, setPackages] = useState<Package[]>([]);
    const [addOns, setAddOns] = useState<AddOn[]>([]);
    const [userProfile, setUserProfile] = useState<Profile>(initialUserProfile);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedRegion, setSelectedRegion] = useState<string | null>(null);

    // Extract region and lead identifiers from URL (?region=... & lid=... or leadId=...)
    useEffect(() => {
        try {
            const hash = window.location.hash;
            const hashQuery = hash.includes('?') ? hash.substring(hash.indexOf('?') + 1) : '';
            const params = new URLSearchParams(hashQuery || window.location.search);
            const reg = params.get('region');
            if (reg && reg.trim() !== '') {
                setSelectedRegion(reg.toLowerCase().trim());
            }
        } catch (e) {
            console.warn('Failed to parse region from URL:', e);
        }
    }, []);

    const urlLeadId = useMemo(() => {
        try {
            const hash = window.location.hash;
            const hashQuery = hash.includes('?') ? hash.substring(hash.indexOf('?') + 1) : '';
            const params = new URLSearchParams(hashQuery || window.location.search);
            return params.get('lid') || params.get('leadId') || params.get('leadName') || null;
        } catch {
            return null;
        }
    }, []);

    const { publicPageConfig } = userProfile;

    // Update userProfile when initialUserProfile changes
    useEffect(() => {
        if (initialUserProfile) {
            setUserProfile(initialUserProfile);
        }
    }, [initialUserProfile]);

    // Load data from Supabase
    const loadData = useCallback(async () => {
        try {
            setIsLoading(true);

            // Load packages
            const packagesData = await listPackages();
            setPackages(packagesData);

            // Load add-ons
            const addOnsData = await listAddOns();
            setAddOns(addOnsData);

            // Load profile if not provided
            if (!initialUserProfile) {
                const profileData = await getProfile();
                if (profileData) {
                    setUserProfile(profileData);
                }
            }

            setError(null);
        } catch (err) {
            console.error('Error loading data:', err);
            setError('Gagal memuat data. Silakan coba lagi nanti.');
        } finally {
            setIsLoading(false);
        }
    }, [initialUserProfile]);

    useEffect(() => {
        loadData();
    }, [loadData]);
    const template = publicPageConfig?.template ?? 'modern';

    // Strict region filtering for packages
    const visiblePackages = useMemo(() => {
        if (!Array.isArray(packages)) return [];
        if (!selectedRegion) return packages;
        return packages.filter(p => {
            const pkgRegion = p.region ? String(p.region).toLowerCase().trim() : '';
            return pkgRegion === selectedRegion.toLowerCase().trim();
        });
    }, [packages, selectedRegion]);

    // Strict region filtering for add-ons
    const visibleAddOns = useMemo(() => {
        if (!Array.isArray(addOns)) return [];
        if (!selectedRegion) return addOns;
        return addOns.filter(a => {
            const addonRegion = a.region ? String(a.region).toLowerCase().trim() : '';
            return addonRegion === selectedRegion.toLowerCase().trim();
        });
    }, [addOns, selectedRegion]);

    const [bookingModal, setBookingModal] = useState<{ isOpen: boolean; pkg: Package | null }>({ isOpen: false, pkg: null });
    const [optionalPackages, setOptionalPackages] = useState<{ id: string; name: string; price: number; selectedDuration?: string }[]>([]);
    const [formData, setFormData] = useState(initialForm);
    const [paymentProof, setPaymentProof] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [promoFeedback, setPromoFeedback] = useState({ type: '', message: '' });
    const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
    const [isWorkflowOpen, setIsWorkflowOpen] = useState(false);
    const [isTermsOpen, setIsTermsOpen] = useState(false);
    const [openWorkflowId, setOpenWorkflowId] = useState<string | null>(null);

    // Note: We avoid early returns before all hooks to keep hook order stable across renders.

    // Group visiblePackages by category
    const packagesByCategory = useMemo(() => {
        const grouped: Record<string, Package[]> = {};

        if (!Array.isArray(visiblePackages)) {
            console.error('visiblePackages is not an array:', visiblePackages);
            return {};
        }

        for (const pkg of visiblePackages) {
            if (!pkg) continue;

            const category = pkg.category || 'Lainnya';
            if (!grouped[category]) {
                grouped[category] = [];
            }
            grouped[category].push(pkg);
        }

        const orderedGrouped: Record<string, Package[]> = {};

        if (userProfile?.packageCategories?.length) {
            userProfile.packageCategories.forEach((category: string) => {
                if (grouped[category]) {
                    orderedGrouped[category] = grouped[category];
                    delete grouped[category];
                }
            });
        }

        // Add remaining categories
        Object.keys(grouped).forEach(category => {
            orderedGrouped[category] = grouped[category];
        });

        return orderedGrouped;
    }, [visiblePackages, userProfile?.packageCategories]);

    const mostPopularPackageId = useMemo(() => {
        if (projects.length === 0) return null;
        const packageCounts = projects.reduce((acc, p) => {
            if (p.packageId) {
                acc[p.packageId] = (acc[p.packageId] || 0) + 1;
            }
            return acc;
        }, {} as Record<string, number>);

        if (Object.keys(packageCounts).length === 0) return null;

        return Object.keys(packageCounts).sort((a, b) => packageCounts[b] - packageCounts[a])[0];
    }, [projects]);


    const categoryDescriptions: Record<string, string> = {
        'Pernikahan': "Layanan profesional untuk mendukung kelancaran hari bahagia Anda. Yuk konsultasikan kebutuhan Anda sekarang.",
        'Lamaran / Engagement': "Momen spesial komitmen Anda akan kami layani dengan sepenuh hati.",
        'Ulang Tahun': "Rayakan pertambahan usia dengan layanan terbaik yang menyenangkan.",
        'Corporate / Event': "Dukungan profesional untuk kesuksesan Acara Pernikahan perusahaan dan gathering Anda.",
        'Wisuda': "Rayakan pencapaian akademik Anda dengan layanan spesial dari kami.",
        'Keluarga': "Menciptakan momen berharga dan layanan terbaik untuk kebahagiaan keluarga Anda."
    };

    const activeWorkflows = useMemo<WorkflowItem[]>(() => {
        if (userProfile?.publicPageConfig?.workflows && userProfile.publicPageConfig.workflows.length > 0) {
            return userProfile.publicPageConfig.workflows;
        }
        const list: WorkflowItem[] = [];
        if (userProfile?.publicPageConfig?.weddingWorkflow?.title) {
            list.push({
                id: 'wf-wedding',
                title: userProfile.publicPageConfig.weddingWorkflow.title,
                timeline: userProfile.publicPageConfig.weddingWorkflow.timeline || []
            });
        }
        if (userProfile?.publicPageConfig?.smallEventWorkflow?.title) {
            list.push({
                id: 'wf-small-event',
                title: userProfile.publicPageConfig.smallEventWorkflow.title,
                timeline: userProfile.publicPageConfig.smallEventWorkflow.timeline || []
            });
        }
        return list.length > 0 ? list : [
            {
                id: 'wf-wedding',
                title: 'Wedding Timeline',
                timeline: [
                    'Konsep Acara Pernikahan / Awal → H-90',
                    'Pemilihan Vendor / Detail → H-60',
                    'Persiapan Final (Technical Meeting) → H-14',
                    'Pelaksanaan Acara Pernikahan → Hari H',
                    'Penyelesaian / Review Akhir → H+7',
                    'Serah Terima Dokumentasi / Laporan → H+30'
                ]
            },
            {
                id: 'wf-small-event',
                title: 'Event / Acara Pernikahan Kecil Timeline',
                timeline: [
                    'Konsep / Kesepakatan Awal → H-30',
                    'Persiapan Final → H-7',
                    'Pelaksanaan Acara Pernikahan → Hari H',
                    'Penyelesaian Layanan / Laporan → H+14'
                ]
            }
        ];
    }, [userProfile?.publicPageConfig]);

    const activePackageTerms = useMemo<PackageTermItem[]>(() => {
        if (userProfile?.publicPageConfig?.packageTerms && userProfile.publicPageConfig.packageTerms.length > 0) {
            return userProfile.publicPageConfig.packageTerms;
        }
        return [
            {
                id: 'pt-booking',
                title: 'Ketentuan Pemesanan & Pembayaran DP',
                items: [
                    'Booking paket dinyatakan sah setelah pembayaran Down Payment (DP) minimal 30%.',
                    'Tanggal acara hanya akan di-lock setelah bukti transfer DP diverifikasi.',
                    'Pelunasan total biaya paket dilakukan selambat-lambatnya H-7 sebelum hari pelaksanaan acara.',
                    'Pembayaran hanya sah melalui rekening resmi vendor yang tertera di dokumen tagihan.'
                ]
            },
            {
                id: 'pt-reschedule',
                title: 'Perubahan Jadwal & Penyesuaian Paket',
                items: [
                    'Permintaan penyesuaian jadwal (reschedule) wajib disampaikan minimal H-30 sebelum hari acara.',
                    'Perubahan tanggal tunduk pada ketersediaan jadwal tim vendor pada tanggal yang baru.',
                    'Upgrade paket atau penambahan add-on dapat dilakukan kapan saja sebelum hari H.'
                ]
            },
            {
                id: 'pt-execution',
                title: 'Pelaksanaan & Penyerahan Hasil Layanan',
                items: [
                    'Tim vendor akan tiba di lokasi acara selambat-lambatnya 2 jam sebelum rundown dimulai.',
                    'Preview hasil layanan (teaser / highlight foto & video) dikirimkan maksimal H+7 acara.',
                    'Seluruh hasil final (full album / Google Drive / video edit) diserahkan maksimal H+30 acara.'
                ]
            },
            {
                id: 'pt-cancellation',
                title: 'Pembatalan & Force Majeure',
                items: [
                    'Pembatalan sepihak dari pihak klien menyebabkan DP hangus dan tidak dapat dikembalikan.',
                    'Keadaan force majeure (bencana alam, huru-hara, regulasi darurat) diselesaikan secara musyawarah mufakat.'
                ]
            }
        ];
    }, [userProfile?.publicPageConfig?.packageTerms]);

    const formattedTerms = useMemo(() => {
        if (!userProfile.termsAndConditions || userProfile.termsAndConditions.trim() === '') return null;
        return userProfile.termsAndConditions.split('\n').map((line, index) => {
            if (line.trim() === '') return <div key={index} className="h-4"></div>;
            const emojiRegex = /^(📜|📅|💰|📦|⏱|➕)\s/;
            if (emojiRegex.test(line)) {
                return <h3 key={index} className="text-lg font-semibold text-gradient mt-4 mb-2">{line}</h3>;
            }
            if (line.trim().startsWith('- ')) {
                return <p key={index} className="ml-4 text-brand-text-primary">{line.trim().substring(2)}</p>;
            }
            return <p key={index} className="text-brand-text-primary">{line}</p>;
        });
    }, [userProfile.termsAndConditions]);

    const whatsappUrl = useMemo(() => {
        if (!bookingModal.pkg || !isSubmitted) return '';
        const message = `Halo, saya ${formData.clientName}, baru saja melakukan booking untuk Package "${bookingModal.pkg.name}". Mohon untuk diproses. Terima kasih.`;
        return `https://wa.me/${cleanPhoneNumber(userProfile.phone)}?text=${encodeURIComponent(message)}`;
    }, [isSubmitted, formData.clientName, bookingModal.pkg, userProfile.phone]);

    const { totalBeforeDiscount, discountAmount, totalProject, discountText } = useMemo(() => {
        if (!bookingModal.pkg) return { totalBeforeDiscount: 0, discountAmount: 0, totalProject: 0, discountText: '' };
        // Determine package price based on selected duration option (flexible labels)
        let packagePrice = bookingModal.pkg.price;
        const opts = bookingModal.pkg.durationOptions;
        if (opts && opts.length > 0) {
            const selected = opts.find(o => o.label === formData.durationSelection) || opts.find(o => o.default) || opts[0];
            packagePrice = selected?.price ?? bookingModal.pkg.price;
        }
        const addOnsPrice = visibleAddOns
            .filter(addon => formData.selectedAddOnIds.includes(addon.id))
            .reduce((sum, addon) => sum + addon.price, 0);

        const optionalPackagesPrice = optionalPackages.reduce((sum, opt) => {
            return sum + (opt.price || 0);
        }, 0);

        const transportFee = Number(formData.transportCost) || 0;
        const totalBeforeDiscount = packagePrice + addOnsPrice + optionalPackagesPrice;
        let discountAmount = 0;
        let discountText = '';

        const enteredPromoCode = formData.promoCode.toUpperCase().trim();
        if (enteredPromoCode) {
            const promoCode = promoCodes.find(p => p.code === enteredPromoCode && p.isActive);
            if (promoCode) {
                const isExpired = promoCode.expiryDate && new Date(promoCode.expiryDate) < new Date();
                const isMaxedOut = promoCode.maxUsage != null && promoCode.usageCount >= promoCode.maxUsage;

                if (!isExpired && !isMaxedOut) {
                    if (promoCode.discountType === 'percentage') {
                        discountAmount = (totalBeforeDiscount * promoCode.discountValue) / 100;
                        discountText = `${promoCode.discountValue}%`;
                    } else {
                        discountAmount = promoCode.discountValue;
                        discountText = formatCurrency(promoCode.discountValue);
                    }
                    setPromoFeedback({ type: 'success', message: `Kode promo diterapkan! Diskon ${discountText}.` });
                } else {
                    setPromoFeedback({ type: 'error', message: 'Kode promo tidak valid atau sudah habis.' });
                }
            } else {
                setPromoFeedback({ type: 'error', message: 'Kode promo tidak ditemukan.' });
            }
        } else {
            setPromoFeedback({ type: '', message: '' });
        }

        const totalProject = totalBeforeDiscount - discountAmount + transportFee;
        return { totalBeforeDiscount, discountAmount, totalProject, discountText };
    }, [formData.selectedAddOnIds, formData.promoCode, formData.transportCost, formData.durationSelection, bookingModal.pkg, addOns, promoCodes, optionalPackages, packages]);

    const handleOpenBookingModal = (pkg: Package) => {
        setBookingModal({ isOpen: true, pkg });
        setIsSubmitted(false);
        // Set default duration selection if durationOptions exist
        const defaultOpt = (pkg.durationOptions && pkg.durationOptions.length > 0)
            ? (pkg.durationOptions.find(o => o.default) || pkg.durationOptions[0])
            : undefined;
        setFormData({ ...initialForm, durationSelection: defaultOpt?.label || '', unitPrice: defaultOpt ? Number(defaultOpt.price) : pkg.price });
        setPaymentProof(null);
        setPromoFeedback({ type: '', message: '' });
    };

    const handleCloseBookingModal = () => {
        setBookingModal({ isOpen: false, pkg: null });
    };

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        if (type === 'checkbox') {
            const { id, checked } = e.target as HTMLInputElement;
            setFormData(prev => ({ ...prev, selectedAddOnIds: checked ? [...prev.selectedAddOnIds, id] : prev.selectedAddOnIds.filter(addOnId => addOnId !== id) }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (file.size > 10 * 1024 * 1024) { // 10MB limit
                alert('Ukuran file tidak boleh melebihi 10MB.');
                e.target.value = '';
                return;
            }
            setPaymentProof(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!bookingModal.pkg) return;
        setIsSubmitting(true);

        const dpAmount = Number(formData.dp) || 0;
        const destinationCard = cards.find(c => c.id !== 'CARD_CASH') || cards[0];
        if (dpAmount > 0 && !destinationCard) {
            alert('Sistem pembayaran tidak dikonfigurasi. Hubungi vendor.');
            setIsSubmitting(false);
            return;
        }

        let promoCodeAppliedId: string | undefined;
        if (discountAmount > 0 && formData.promoCode) {
            const promoCode = promoCodes.find(p => p.code === formData.promoCode.toUpperCase().trim());
            if (promoCode) promoCodeAppliedId = promoCode.id;
        }

        let dpProofUrl = '';
        if (paymentProof) {
            try {
                // Upload ke Supabase Storage, gunakan URL publik
                dpProofUrl = await uploadDpProof(paymentProof);
            } catch (error) {
                console.error('Error uploading DP proof:', error);
                alert('Gagal mengunggah bukti transfer. Silakan coba lagi.');
                setIsSubmitting(false);
                return;
            }
        }

        const selectedAddOns = visibleAddOns.filter(addon => formData.selectedAddOnIds.includes(addon.id));
        const remainingPayment = totalProject - dpAmount;
        const transportFee = Number(formData.transportCost) || 0;

        // Persist to Supabase
        const createdClient = await createClient({
            name: formData.clientName,
            email: formData.email,
            phone: formData.phone,
            whatsapp: formData.phone || undefined,
            instagram: formData.instagram || undefined,
            since: new Date().toISOString().split('T')[0],
            status: ClientStatus.ACTIVE,
            clientType: ClientType.DIRECT,
            lastContact: new Date().toISOString(),
            portalAccessId: crypto.randomUUID(),
        });

        const createdProject = await createProject({
            projectName: `${formData.clientName} (${bookingModal.pkg.name})`,
            clientName: createdClient.name,
            clientId: createdClient.id,
            projectType: bookingModal.pkg.category,
            packageName: bookingModal.pkg.name,
            date: formData.date,
            location: formData.location || 'Akan dikonfirmasi',
            status: 'Dikonfirmasi',
            bookingStatus: BookingStatus.BARU,
            totalCost: totalProject,
            amountPaid: dpAmount,
            paymentStatus: dpAmount >= totalProject ? PaymentStatus.LUNAS : (dpAmount > 0 ? PaymentStatus.DP_TERBAYAR : PaymentStatus.BELUM_BAYAR),
            notes: `Booking dari halaman Package.${formData.durationSelection ? ` Durasi dipilih: ${formData.durationSelection}.` : ''}`,
            durationSelection: formData.durationSelection || undefined,
            unitPrice: formData.unitPrice !== undefined ? Number(formData.unitPrice) : undefined,
            promoCodeId: promoCodeAppliedId,
            discountAmount: discountAmount > 0 ? discountAmount : undefined,
            transportCost: transportFee > 0 ? transportFee : undefined,
            completedDigitalItems: [],
            dpProofUrl: dpProofUrl || undefined,
            addOns: selectedAddOns.map(a => ({ id: a.id, name: a.name, price: a.price })),
        });

        const createdLead = await createLeadRow({
            name: createdClient.name,
            contactChannel: ContactChannel.WEBSITE,
            location: createdProject.location,
            status: LeadStatus.CONVERTED,
            date: new Date().toISOString(),
            notes: `Dikonversi dari halaman Package. Acara Pernikahan: ${createdProject.projectName}. Pengantin ID: ${createdClient.id}`,
            whatsapp: createdClient.phone,
        } as any);

        setClients(prev => [createdClient, ...prev]);
        // Pastikan muncul di halaman Booking
        const createdProjectWithBooking: Project = { ...createdProject, bookingStatus: BookingStatus.BARU } as Project;
        setProjects(prev => [createdProjectWithBooking, ...prev]);
        setLeads(prev => [createdLead, ...prev]);

        if (promoCodeAppliedId) {
            setPromoCodes(prev => prev.map(p => p.id === promoCodeAppliedId ? { ...p, usageCount: p.usageCount + 1 } : p));
        }

        if (dpAmount > 0) {
            const today = new Date().toISOString().split('T')[0];
            try {
                const createdTx = await createTransaction({
                    date: today,
                    description: `DP Acara Pernikahan ${createdProject.projectName}`,
                    amount: dpAmount,
                    type: TransactionType.INCOME,
                    projectId: createdProject.id,
                    category: 'DP Acara Pernikahan',
                    method: 'Transfer Bank',
                    cardId: destinationCard.id,
                } as any);
                setTransactions(prev => {
                    const exists = prev.some(t => t.id === createdTx.id);
                    const list = exists ? prev.map(t => t.id === createdTx.id ? createdTx : t) : [createdTx, ...prev];
                    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                });
                setCards(prev => prev.map(c => c.id === destinationCard.id ? { ...c, balance: c.balance + dpAmount } : c));
            } catch (err) {
                console.error('Gagal mencatat transaksi DP ke Supabase:', err);
                // fallback: tetap update lokal
                const localTx: Transaction = {
                    id: `TRN-DP-${createdProject.id}`,
                    date: today,
                    description: `DP Acara Pernikahan ${createdProject.projectName}`,
                    amount: dpAmount,
                    type: TransactionType.INCOME,
                    projectId: createdProject.id,
                    category: 'DP Acara Pernikahan',
                    method: 'Transfer Bank',
                    cardId: destinationCard.id,
                };
                setTransactions(prev => {
                    const exists = prev.some(t => t.id === localTx.id);
                    const list = exists ? prev.map(t => t.id === localTx.id ? localTx : t) : [localTx, ...prev];
                    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                });
                setCards(prev => prev.map(c => c.id === destinationCard.id ? { ...c, balance: c.balance + dpAmount } : c));
            }
        }

        addNotification({
            title: 'Booking Baru Diterima!',
            message: `Booking dari ${createdClient.name} untuk Package "${bookingModal.pkg.name}" menunggu konfirmasi.`,
            icon: 'lead',
            link: { view: ViewType.BOOKING }
        });

        setIsSubmitting(false);
        setIsSubmitted(true);
    };

    const suggestedDp = totalProject * 0.3;

    return (
        isLoading ? (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-accent mx-auto mb-4"></div>
                    <p className="text-brand-text-secondary">Memuat data Package...</p>
                </div>
            </div>
        ) : error ? (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center p-6 max-w-md mx-auto bg-brand-surface rounded-lg shadow-md">
                    <div className="text-red-500 mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-medium text-brand-text-light mb-2">Terjadi Kesalahan</h3>
                    <p className="text-brand-text-secondary mb-4">{error}</p>
                    <button
                        onClick={() => loadData()}
                        className="px-4 py-2 bg-brand-accent text-white rounded-lg hover:bg-brand-accent-hover transition-colors cursor-pointer"
                    >
                        Coba Lagi
                    </button>
                </div>
            </div>
        ) : (
            <div className={`template-wrapper template-${template} min-h-screen`}>
                <style>{`
                .template-wrapper { background-color: var(--public-bg); color: var(--public-text-primary); }

                /* Cover image: rounded top corners matching card */
                .template-wrapper .package-card-cover {
                    border-radius: 1rem 1rem 0 0;
                    overflow: hidden;
                }

                /* Booking button override — must beat app/index.css !important rules */
                .template-wrapper button.package-booking-button.button-primary,
                .template-wrapper .package-booking-button,
                button.package-booking-button {
                    font-size: 1.25rem !important;
                    font-weight: 800 !important;
                    min-height: 54px !important;
                    max-height: none !important;
                    height: auto !important;
                    line-height: 1.35 !important;
                    padding: 0.875rem 1.5rem !important;
                    width: 100% !important;
                    border-radius: 0.875rem !important;
                    display: inline-flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                    text-align: center !important;
                    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.12) !important;
                }

                @media (max-width: 768px) {
                    .template-wrapper .package-card-cover { height: 160px !important; }
                    .template-wrapper .package-card-title { font-size: 1.05rem !important; line-height: 1.35 !important; }
                    .template-wrapper .package-desc-text { font-size: 0.9rem !important; line-height: 1.5 !important; }
                    .template-wrapper .package-duration-heading { font-size: 0.75rem !important; }
                    .template-wrapper .package-duration-option { min-height: 42px !important; padding: 0.5rem !important; }
                    .template-wrapper .package-duration-label { font-size: 0.6875rem !important; line-height: 1.25 !important; }
                    .template-wrapper .package-duration-price { font-size: 0.8125rem !important; line-height: 1.2 !important; }

                    /* Mobile booking button — ukuran teks lebih besar dan padding kiri kanan disesuaikan */
                    .template-wrapper button.package-booking-button.button-primary,
                    .template-wrapper .package-booking-button,
                    button.package-booking-button,
                    .package-booking-button {
                        font-size: 1.25rem !important;
                        font-weight: 800 !important;
                        min-height: 54px !important;
                        max-height: none !important;
                        height: auto !important;
                        line-height: 1.35 !important;
                        padding: 0.875rem 1.25rem !important;
                        width: 100% !important;
                        border-radius: 0.875rem !important;
                        letter-spacing: 0.01em !important;
                        display: flex !important;
                        align-items: center !important;
                        justify-content: center !important;
                        text-align: center !important;
                        box-shadow: 0 4px 14px rgba(0, 0, 0, 0.15) !important;
                    }
                }
            `}</style>
                <div className="w-full max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
                    <header className="text-center mb-16 widget-animate">
                        {/* Hero Image */}
                        <div className="w-full h-56 sm:h-72 md:h-96 mb-8 rounded-3xl overflow-hidden shadow-2xl border border-brand-border/60">
                            <img src={userProfile.publicPageConfig?.backgroundImages?.portalPengantin || "/assets/images/backgrounds/portal-pengantin-3.jpg"} alt="Hero" className="w-full h-full object-cover" />
                        </div>
                        {userProfile.logoBase64 ? (
                            <img src={userProfile.logoBase64} alt="Company Logo" className="h-16 md:h-20 mx-auto mb-4 object-contain" />
                        ) : (
                            <h1 className="text-3xl md:text-5xl font-extrabold text-gradient">{userProfile.companyName}</h1>
                        )}
                        {publicPageConfig?.title && (
                            <h2 className="text-2xl md:text-4xl font-bold text-brand-text-light mt-4">{publicPageConfig.title}</h2>
                        )}
                        {publicPageConfig?.introduction && (
                            <p className="text-base md:text-lg text-brand-text-secondary mt-4 max-w-3xl mx-auto leading-relaxed">{publicPageConfig.introduction}</p>
                        )}
                    </header>

                    {publicPageConfig?.galleryImages && publicPageConfig.galleryImages.length > 0 && (
                        <section className="mb-8 md:mb-10 widget-animate -mx-4" style={{ animationDelay: '100ms' }}>
                            <div className="text-center mb-4">
                                <h3 className="text-2xl font-bold text-brand-text-light">Pricelist</h3>
                                <p className="text-sm text-brand-text-secondary mt-1">Pricelist Weddfin</p>
                            </div>
                            <div className="space-y-2 sm:space-y-3">
                                {publicPageConfig?.galleryImages?.map((imgSrc, index) => (
                                    <div key={index} className="group">
                                        <img
                                            src={imgSrc}
                                            alt={`Gallery image ${index + 1}`}
                                            loading="lazy"
                                            className="w-full h-auto object-cover rounded-none shadow-none"
                                        />
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    <section className="mb-12 md:mb-16 grid md:grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 widget-animate" style={{ animationDelay: '200ms' }}>
                        {/* ── Workflow & Timeline Layanan ── */}
                        <div
                            className="bg-brand-surface rounded-2xl shadow-lg border border-brand-border p-3 md:p-4 sm:p-6 cursor-pointer hover:border-brand-accent/50 transition-all"
                            onClick={() => {
                                const nextState = !isWorkflowOpen;
                                setIsWorkflowOpen(nextState);
                                setIsTermsOpen(false);
                                if (nextState && !openWorkflowId && activeWorkflows.length > 0) {
                                    setOpenWorkflowId(activeWorkflows[0].id);
                                }
                            }}
                        >
                            <div className="flex justify-between items-center text-left">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-xl bg-brand-accent/15 flex items-center justify-center text-brand-accent">
                                        <ListOrdered className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg md:text-xl font-bold text-gradient">
                                            Workflow & Timeline Layanan
                                        </h3>
                                        <p className="text-xs text-brand-text-secondary">
                                            {activeWorkflows.length} Alur Kerja Tersedia
                                        </p>
                                    </div>
                                </div>
                                <ChevronDownIcon className={`w-6 h-6 transition-transform text-brand-text-secondary ${isWorkflowOpen ? 'rotate-180' : ''}`} />
                            </div>

                            <div className={`transition-all duration-500 ease-in-out grid ${isWorkflowOpen ? 'grid-rows-[1fr] mt-4 opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                                <div className="overflow-hidden">
                                    <div className="space-y-3">
                                        {activeWorkflows.map((wf, wfIdx) => {
                                            const isExpanded = openWorkflowId === wf.id || (openWorkflowId === null && wfIdx === 0);
                                            return (
                                                <div key={wf.id || wfIdx} className="border border-brand-border rounded-xl overflow-hidden bg-brand-bg/40">
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setOpenWorkflowId(isExpanded ? '' : wf.id);
                                                        }}
                                                        className="w-full flex justify-between items-center text-left p-3 hover:bg-brand-bg/80 transition-colors"
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <span className="w-5 h-5 rounded-md bg-brand-accent/20 text-brand-accent flex items-center justify-center text-xs font-bold">
                                                                {wfIdx + 1}
                                                            </span>
                                                            <h4 className="font-semibold text-brand-text-light text-sm">
                                                                {wf.title}
                                                            </h4>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-[10px] bg-brand-surface text-brand-text-secondary px-2 py-0.5 rounded-full border border-brand-border">
                                                                {wf.timeline.length} Tahapan
                                                            </span>
                                                            <ChevronDownIcon className={`w-4 h-4 transition-transform text-brand-text-secondary ${isExpanded ? 'rotate-180' : ''}`} />
                                                        </div>
                                                    </button>
                                                    <div className={`transition-all duration-300 ease-in-out grid ${isExpanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
                                                        <div className="overflow-hidden">
                                                            <div className="p-3 pt-1 space-y-2 border-t border-brand-border/60">
                                                                {wf.timeline.map((item, itemIdx) => (
                                                                    <div key={itemIdx} className="flex items-start gap-2.5 text-xs sm:text-sm text-brand-text-secondary">
                                                                        <span className="w-4 h-4 rounded-full bg-brand-accent/15 text-brand-accent flex items-center justify-center text-[10px] font-bold mt-0.5 shrink-0">
                                                                            {itemIdx + 1}
                                                                        </span>
                                                                        <span className="leading-snug">{item}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ── Syarat & Ketentuan Paket ── */}
                        <div
                            className="bg-brand-surface rounded-2xl shadow-lg border border-brand-border p-3 md:p-4 sm:p-6 cursor-pointer hover:border-brand-accent/50 transition-all"
                            onClick={() => {
                                setIsTermsOpen(!isTermsOpen);
                                setIsWorkflowOpen(false);
                            }}
                        >
                            <div className="flex justify-between items-center text-left">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-xl bg-brand-accent/15 flex items-center justify-center text-brand-accent">
                                        <ShieldCheck className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg md:text-xl font-bold text-gradient">
                                            Syarat & Ketentuan Paket
                                        </h3>
                                        <p className="text-xs text-brand-text-secondary">
                                            {activePackageTerms.length} Bagian Ketentuan Booking
                                        </p>
                                    </div>
                                </div>
                                <ChevronDownIcon className={`w-6 h-6 transition-transform text-brand-text-secondary ${isTermsOpen ? 'rotate-180' : ''}`} />
                            </div>

                            <div className={`transition-all duration-500 ease-in-out grid ${isTermsOpen ? 'grid-rows-[1fr] mt-4 opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                                <div className="overflow-hidden">
                                    <div className="max-h-96 overflow-y-auto pr-1 space-y-3">
                                        {activePackageTerms && activePackageTerms.length > 0 ? (
                                            activePackageTerms.map((section, sIdx) => (
                                                <div key={section.id || sIdx} className="border border-brand-border/80 bg-brand-bg/40 rounded-xl p-3.5 space-y-2.5">
                                                    <h4 className="font-semibold text-brand-text-light text-sm flex items-center gap-2">
                                                        <span className="w-5 h-5 rounded-md bg-brand-accent/20 text-brand-accent flex items-center justify-center text-xs font-bold">
                                                            {sIdx + 1}
                                                        </span>
                                                        <span>{section.title}</span>
                                                    </h4>
                                                    <ul className="space-y-1.5 pl-7 text-xs sm:text-sm text-brand-text-secondary">
                                                        {section.items.map((item, itemIdx) => (
                                                            <li key={itemIdx} className="flex items-start gap-2">
                                                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                                                                <span className="leading-snug">{item}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            ))
                                        ) : formattedTerms ? (
                                            <div>{formattedTerms}</div>
                                        ) : (
                                            <p className="text-brand-text-secondary text-center py-8">
                                                Syarat dan ketentuan paket belum diatur oleh vendor.
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Region Selector Bar */}
                    <div className="mb-12 flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-brand-surface rounded-2xl border border-brand-border shadow-xs">
                        <div className="flex items-center gap-3 text-sm text-brand-text-secondary font-medium">
                            <MapPin className="w-5 h-5 text-brand-accent shrink-0" />
                            <span>
                                Wilayah Katalog: <strong className="text-brand-text-light">{selectedRegion ? (REGIONS.find(r => r.value.toLowerCase() === selectedRegion.toLowerCase())?.label || selectedRegion.toUpperCase()) : 'Semua Wilayah'}</strong>
                            </span>
                        </div>
                        <div className="flex flex-nowrap items-center gap-2 overflow-x-auto whitespace-nowrap w-full sm:w-auto pb-1">
                            <button
                                type="button"
                                onClick={() => setSelectedRegion(null)}
                                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer shrink-0 ${
                                    !selectedRegion
                                        ? 'bg-brand-accent text-white shadow-sm'
                                        : 'bg-brand-bg text-brand-text-secondary hover:text-brand-text-light border border-brand-border'
                                }`}
                            >
                                Semua
                            </button>
                            {REGIONS.map(r => (
                                <button
                                    key={r.value}
                                    type="button"
                                    onClick={() => setSelectedRegion(r.value.toLowerCase())}
                                    className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer shrink-0 ${
                                        selectedRegion?.toLowerCase() === r.value.toLowerCase()
                                            ? 'bg-brand-accent text-white shadow-sm'
                                            : 'bg-brand-bg text-brand-text-secondary hover:text-brand-text-light border border-brand-border'
                                    }`}
                                >
                                    {r.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="grid lg:grid-cols-3 gap-8 md:gap-10 items-start">
                        <section className="lg:col-span-2 space-y-16">
                            {Object.keys(packagesByCategory).length === 0 && (
                                <div className="text-center py-20 bg-brand-surface rounded-3xl border border-brand-border p-8 shadow-sm">
                                    <MapPin className="w-12 h-12 mx-auto text-brand-text-secondary mb-3 opacity-40" />
                                    <h4 className="text-lg font-bold text-brand-text-light">Belum Ada Paket untuk Wilayah Ini</h4>
                                    <p className="text-sm text-brand-text-secondary mt-1 max-w-md mx-auto">
                                        Saat ini belum ada paket yang terdaftar khusus untuk wilayah {selectedRegion ? (REGIONS.find(r => r.value.toLowerCase() === selectedRegion.toLowerCase())?.label || selectedRegion) : ''}.
                                    </p>
                                    <button
                                        type="button"
                                        onClick={() => setSelectedRegion(null)}
                                        className="mt-6 px-5 py-2.5 rounded-xl bg-brand-accent text-white text-xs font-bold shadow-sm cursor-pointer hover:bg-brand-accent-hover transition-colors"
                                    >
                                        Tampilkan Semua Wilayah
                                    </button>
                                </div>
                            )}
                            {Object.entries(packagesByCategory as Record<string, Package[]>).map(([category, pkgs]) => (
                                <div key={category} className="space-y-8">
                                    <div>
                                        <h3 className="text-2xl md:text-3xl font-extrabold text-brand-text-light">{category}</h3>
                                        <p className="text-brand-text-secondary mt-2 max-w-2xl text-sm md:text-base leading-relaxed">
                                            {categoryDescriptions[category] || `Berbagai pilihan Package untuk kebutuhan ${category.toLowerCase()} Anda.`}
                                        </p>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                                        {pkgs.map((pkg, index) => (
                                            <div key={pkg.id} className="relative bg-brand-surface rounded-3xl shadow-lg border border-brand-border flex flex-col overflow-hidden transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl widget-animate" style={{ animationDelay: `${200 + index * 100}ms` }}>
                                                {pkg.id === mostPopularPackageId && (
                                                    <div className="absolute top-4 right-4 bg-yellow-400 text-yellow-900 text-xs font-bold px-3.5 py-1.5 rounded-full shadow-md z-10">Paling Populer</div>
                                                )}
                                                {pkg.coverImage ? (
                                                    <div className="package-card-cover w-full h-48 sm:h-56 overflow-hidden bg-brand-bg">
                                                        <img
                                                            src={pkg.coverImage}
                                                            alt={pkg.name}
                                                            loading="lazy"
                                                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                                                            onError={(e) => {
                                                                const target = e.target as HTMLImageElement;
                                                                target.style.display = 'none';
                                                            }}
                                                        />
                                                    </div>
                                                ) : (
                                                    <div className="package-card-cover w-full h-48 sm:h-56 bg-brand-bg/60 flex items-center justify-center">
                                                        <CameraIcon className="w-12 h-12 text-brand-text-secondary/50" />
                                                    </div>
                                                )}
                                                <div className="p-6 md:p-8 flex flex-col flex-grow space-y-4">
                                                    <h4 className="package-card-title text-lg md:text-xl font-bold text-brand-text-light">{pkg.name}</h4>
                                                    {pkg.durationOptions?.length ? (
                                                        <div className="space-y-2">
                                                            <p className="package-duration-heading text-xs font-semibold text-brand-text-secondary">Pilihan Durasi</p>
                                                            <div className="flex flex-nowrap gap-2 overflow-x-auto pb-1">
                                                                {pkg.durationOptions.map(option => (
                                                                    <div key={option.label} className="package-duration-option flex items-center justify-between gap-3 rounded-xl border border-brand-border bg-brand-bg/50 px-3 py-2 text-xs shrink-0">
                                                                        <span className="package-duration-label font-medium text-brand-text-secondary truncate">{option.label}{option.default ? ' · Default' : ''}</span>
                                                                        <span className="package-duration-price shrink-0 font-bold text-brand-text-light">{formatCurrency(option.price)}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <p className="text-2xl md:text-3xl font-extrabold text-brand-text-light">{formatCurrency(pkg.price)}</p>
                                                    )}
                                                    <div className="package-desc-text space-y-2 text-xs md:text-sm text-brand-text-secondary flex-grow pt-2">
                                                        {pkg.photographers && (
                                                            <div className="flex items-center gap-2"><CheckIcon className="w-4 h-4 text-brand-accent shrink-0" /><span>{pkg.photographers}</span></div>
                                                        )}
                                                        {pkg.videographers && (
                                                            <div className="flex items-center gap-2"><CheckIcon className="w-4 h-4 text-brand-accent shrink-0" /><span>{pkg.videographers}</span></div>
                                                        )}
                                                        {pkg.digitalItems.length > 0 && pkg.digitalItems.map((item, i) => (
                                                            <div key={`d-${i}`} className="flex items-center gap-2"><CheckIcon className="w-4 h-4 text-brand-accent shrink-0" /><span>{item}</span></div>
                                                        ))}
                                                        {pkg.physicalItems.length > 0 && pkg.physicalItems.map((item, i) => (
                                                            <div key={`p-${i}`} className="flex items-center gap-2"><CheckIcon className="w-4 h-4 text-brand-accent shrink-0" /><span>{item.name}</span></div>
                                                        ))}
                                                    </div>
                                                    <div className="pt-4 border-t border-brand-border mt-auto">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleOpenBookingModal(pkg)}
                                                            className="package-booking-button button-primary w-full text-center"
                                                        >
                                                            Booking Package Ini
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </section>

                        {visibleAddOns.length > 0 && (
                            <aside className="lg:col-span-1 lg:sticky lg:top-8 widget-animate" style={{ animationDelay: '500ms' }}>
                                <div className="bg-brand-surface rounded-2xl shadow-lg border border-brand-border">
                                    <h3 className="text-lg md:text-xl font-bold text-brand-text-light p-4 md:p-6">
                                        Tambahan Opsional {selectedRegion ? `(${selectedRegion.toUpperCase()})` : ''}
                                    </h3>
                                    <div className="border-t border-brand-border">
                                        {visibleAddOns.map(addOn => (
                                            <AddOnItem key={addOn.id} addOn={addOn} />
                                        ))}
                                    </div>
                                </div>
                            </aside>
                        )}
                    </div>

                    {userProfile?.phone && (
                        <section className="py-16 mt-16 border-t border-brand-border widget-animate" style={{ animationDelay: '550ms' }}>
                            <div className="max-w-2xl mx-auto text-center">
                                <h3 className="text-2xl font-bold text-gradient mb-2">Butuh Bantuan?</h3>
                                <p className="text-brand-text-secondary mb-6">
                                    Jika ada pertanyaan atau butuh bantuan dalam pengisian formulir, jangan ragu untuk menghubungi admin kami melalui WhatsApp.
                                </p>
                                <a
                                    href={`https://wa.me/${cleanPhoneNumber(userProfile.phone)}?text=${encodeURIComponent('Halo Admin, saya butuh bantuan.')}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="button-secondary inline-flex items-center gap-2"
                                >
                                    <WhatsappIcon className="w-5 h-5" />
                                    Hubungi Admin ({userProfile.phone})
                                </a>
                            </div>
                        </section>
                    )}

                    <section className="py-12 bg-gray-50">
                        <div className="max-w-4xl mx-auto px-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div>
                                    <h3 className="text-lg font-bold text-brand-text-light mb-4">Social Media</h3>
                                    <div className="flex space-x-4 mb-6">
                                        <a href="#" className="text-gray-600 hover:text-brand-accent transition-colors">
                                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                                <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                                            </svg>
                                        </a>
                                        <a href="#" className="text-gray-600 hover:text-brand-accent transition-colors">
                                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                                <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
                                            </svg>
                                        </a>
                                        <a href="#" className="text-gray-600 hover:text-brand-accent transition-colors">
                                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                                <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                                            </svg>
                                        </a>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex items-start">
                                            <svg className="w-5 h-5 text-gray-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                            </svg>
                                            <a href={`mailto:${userProfile.email}`} className="text-gray-700 hover:text-brand-accent transition-colors">{userProfile.email}</a>
                                        </div>
                                        <div className="flex items-start">
                                            <svg className="w-5 h-5 text-gray-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                            </svg>
                                            <a href={`tel:${userProfile.phone}`} className="text-gray-700 hover:text-brand-accent transition-colors">{userProfile.phone}</a>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-lg font-bold text-brand-text-light mb-4">Alamat</h3>
                                    <div className="space-y-4">
                                        <div className="flex">
                                            <svg className="w-5 h-5 text-gray-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                            <div>
                                                <p className="font-medium text-gray-800">Alamat Utama</p>
                                                <p className="text-gray-700 whitespace-pre-line">{userProfile.address || 'Alamat belum diatur'}</p>
                                                {userProfile.phone && (
                                                    <a href={`tel:${userProfile.phone}`} className="text-gray-700 hover:text-brand-accent transition-colors block mt-1">
                                                        <span className="font-medium">Telp:</span> {userProfile.phone}
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex">
                                            <svg className="w-5 h-5 text-gray-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                            <div>
                                                <p className="font-medium text-gray-800">Kontak Tambahan</p>
                                                {userProfile.website && (
                                                    <a href={userProfile.website.startsWith('http') ? userProfile.website : `https://${userProfile.website}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-gray-700 hover:text-brand-accent transition-colors block">
                                                        {userProfile.website}
                                                    </a>
                                                )}
                                                {userProfile.phone && (
                                                    <a href={`tel:${userProfile.phone}`}
                                                        className="text-gray-700 hover:text-brand-accent transition-colors block">
                                                        {userProfile.phone}
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    <footer className="text-center py-8 border-t border-brand-border">
                        <p className="text-xs text-brand-text-secondary">&copy; {new Date().getFullYear()} {userProfile.companyName}.</p>
                    </footer>

                    {/* Pricelist PDF Download Button */}
                    {(() => {
                        const regionPricelists = userProfile.publicPageConfig?.regionPricelists || [];
                        const targetPricelist = selectedRegion
                            ? regionPricelists.find(p => p.region.toLowerCase() === selectedRegion.toLowerCase())
                            : regionPricelists.find(p => p.region.toLowerCase() === 'semua') || (regionPricelists.length > 0 ? regionPricelists[0] : null);

                        if (!targetPricelist && !userProfile.publicPageConfig?.pricelistPdfUrl) return null;

                        const pdfUrl = targetPricelist?.pdfUrl || userProfile.publicPageConfig?.pricelistPdfUrl;
                        if (!pdfUrl) return null;

                        return (
                            <div className="fixed bottom-6 right-6 z-40">
                                <button
                                    onClick={() => {
                                        const link = document.createElement('a');
                                        link.href = pdfUrl;
                                        link.download = targetPricelist?.fileName || 'pricelist.pdf';
                                        document.body.appendChild(link);
                                        link.click();
                                        document.body.removeChild(link);
                                    }}
                                    className="flex items-center gap-2 px-4 py-3 bg-brand-accent hover:bg-brand-accent-hover text-white rounded-full shadow-lg transition-all duration-300 hover:scale-105"
                                    title={`Download Pricelist ${targetPricelist?.title || ''}`}
                                >
                                    <Download className="w-5 h-5" />
                                    <span className="font-semibold text-sm">{targetPricelist?.buttonLabel || 'Download Pricelist'}</span>
                                </button>
                            </div>
                        );
                    })()}
                </div>

                <Modal isOpen={bookingModal.isOpen} onClose={handleCloseBookingModal} title={`Booking: ${bookingModal.pkg?.name}`} size="7xl">
                    {isSubmitted ? (
                        <div className="text-center p-8">
                            <h3 className="text-2xl font-bold text-gradient">Terima Kasih!</h3>
                            <p className="mt-4 text-public-text-primary">Formulir booking Anda telah kami terima. Tim kami akan segera menghubungi Anda untuk konfirmasi.</p>
                            <a
                                href={whatsappUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-6 button-primary w-full max-w-xs mx-auto"
                            >
                                Konfirmasi ke Admin via WhatsApp
                            </a>
                            <button onClick={handleCloseBookingModal} className="mt-4 button-secondary w-full max-w-xs mx-auto">Tutup</button>
                        </div>
                    ) : (
                    <form onSubmit={handleSubmit} className="space-y-8 p-2 sm:p-4 form-compact form-compact--ios-scale">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                            {/* Column 1: Client Info & Main Package */}
                            <div className="space-y-6 bg-brand-surface/60 p-6 rounded-3xl border border-brand-border/80 shadow-sm">
                                <div className="space-y-1">
                                    <h4 className="text-base font-bold text-brand-text-light flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-brand-accent"></span>
                                        Informasi Anda & Acara Pernikahan
                                    </h4>
                                    <p className="text-xs text-brand-text-secondary">Lengkapi data diri dan detail acara Anda.</p>
                                </div>
                                <div className="space-y-4">
                                    <div className="input-group"><input type="text" id="clientName" name="clientName" value={formData.clientName} onChange={handleFormChange} className="input-field" placeholder=" " required /><label htmlFor="clientName" className="input-label">Nama Pengantin</label></div>
                                    <div className="input-group"><input type="email" id="email" name="email" value={formData.email} onChange={handleFormChange} className="input-field" placeholder=" " /><label htmlFor="email" className="input-label">Email (Opsional)</label></div>
                                    <div className="input-group"><input type="tel" id="phone" name="phone" value={formData.phone} onChange={handleFormChange} className="input-field" placeholder=" " required /><label htmlFor="phone" className="input-label">Nomor WhatsApp</label></div>
                                    <div className="input-group"><input type="text" id="instagram" name="instagram" value={formData.instagram} onChange={handleFormChange} className="input-field" placeholder=" " /><label htmlFor="instagram" className="input-label">Instagram (Opsional)</label></div>
                                    <div className="input-group">
                                        <input type="date" id="date" name="date" value={formData.date} onChange={handleFormChange} className="input-field" placeholder=" " />
                                        <label htmlFor="date" className="input-label">Tanggal Acara Pernikahan (Opsional)</label>
                                        {!formData.date && <p className="text-[10px] text-brand-text-secondary mt-1">Kosongkan jika tanggal acara belum ditentukan.</p>}
                                        {formData.date && (
                                            <button type="button" onClick={() => setFormData(prev => ({ ...prev, date: '' }))} className="mt-1 text-xs font-semibold text-brand-accent hover:underline">
                                                Kosongkan tanggal
                                            </button>
                                        )}
                                    </div>
                                    <div className="input-group"><input type="text" id="location" name="location" value={formData.location} onChange={handleFormChange} className="input-field" placeholder=" " /><label htmlFor="location" className="input-label">Alamat Acara Pernikahan</label></div>
                                </div>

                                <div className="pt-4 border-t border-brand-border space-y-4">
                                    <div className="space-y-1">
                                        <h4 className="text-base font-bold text-brand-text-light flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-brand-accent"></span>
                                            Pilihan Package & Durasi
                                        </h4>
                                        <p className="text-xs text-brand-text-secondary">Detail paket utama yang dipilih.</p>
                                    </div>

                                    {bookingModal.pkg && (() => {
                                        const pkg = bookingModal.pkg;
                                        const hasDurationOpts = pkg.durationOptions && pkg.durationOptions.length > 0;
                                        const selectedOpt = hasDurationOpts
                                            ? (pkg.durationOptions!.find(o => o.label === formData.durationSelection) || pkg.durationOptions!.find(o => o.default) || pkg.durationOptions![0])
                                            : null;
                                        const photographers = selectedOpt?.photographers || pkg.photographers;
                                        const videographers = selectedOpt?.videographers || pkg.videographers;
                                        const processingTime = selectedOpt?.processingTime || pkg.processingTime;
                                        const digitalItems = (selectedOpt?.digitalItems?.filter(Boolean).length ? selectedOpt.digitalItems : pkg.digitalItems)?.filter(Boolean) || [];
                                        const physicalItems = (selectedOpt?.physicalItems?.filter((p: { name?: string }) => p?.name).length ? selectedOpt.physicalItems : pkg.physicalItems)?.filter((p: { name?: string }) => p?.name) || [];
                                        const hasAnyDetail = photographers || videographers || processingTime || digitalItems.length > 0 || physicalItems.length > 0;
                                        return (
                                            <div className="p-4 border border-brand-border bg-brand-bg/50 rounded-2xl space-y-2.5">
                                                <p className="text-xs font-bold text-brand-accent flex items-center justify-between">
                                                    <span>{pkg.name}</span>
                                                    {selectedOpt && hasDurationOpts && <span className="font-normal text-brand-text-secondary">({selectedOpt.label})</span>}
                                                </p>
                                                {hasAnyDetail ? (
                                                    <ul className="text-xs text-brand-text-secondary space-y-1.5 pl-2">
                                                        {photographers && <li className="flex items-center gap-2"><CheckIcon className="w-3.5 h-3.5 text-brand-accent shrink-0" /><span>{photographers}</span></li>}
                                                        {videographers && <li className="flex items-center gap-2"><CheckIcon className="w-3.5 h-3.5 text-brand-accent shrink-0" /><span>{videographers}</span></li>}
                                                        {processingTime && <li className="flex items-center gap-2"><CheckIcon className="w-3.5 h-3.5 text-brand-accent shrink-0" /><span>Pengerjaan: {processingTime}</span></li>}
                                                        {digitalItems.map((item: string, i: number) => <li key={i} className="flex items-center gap-2"><CheckIcon className="w-3.5 h-3.5 text-brand-accent shrink-0" /><span>{item}</span></li>)}
                                                        {physicalItems.map((item: { name: string }, i: number) => <li key={i} className="flex items-center gap-2"><CheckIcon className="w-3.5 h-3.5 text-brand-accent shrink-0" /><span>{item.name}</span></li>)}
                                                    </ul>
                                                ) : (
                                                    <p className="text-xs text-brand-text-secondary italic">Pilih opsi Jam Kerja untuk melihat detail.</p>
                                                )}
                                            </div>
                                        );
                                    })()}

                                    {bookingModal.pkg?.durationOptions && bookingModal.pkg.durationOptions.length > 0 && (
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-brand-text-light">Jam Kerja / Durasi</label>
                                            <div className="flex flex-nowrap gap-2 overflow-x-auto pb-2">
                                                {bookingModal.pkg.durationOptions.map(opt => {
                                                    const isSelected = formData.durationSelection === opt.label;
                                                    return (
                                                        <label key={opt.label} className={`flex min-w-[150px] cursor-pointer flex-col justify-between gap-2 rounded-2xl border-2 p-3 transition-all shrink-0 ${isSelected ? 'border-brand-accent bg-brand-accent/5 shadow-sm' : 'border-brand-border bg-brand-surface hover:border-brand-accent/50'}`}>
                                                            <span className="flex items-center justify-between gap-2 text-xs font-semibold text-brand-text-primary">
                                                                {opt.label}
                                                                {opt.default && <span className="rounded-full bg-brand-accent/10 px-2 py-0.5 text-[9px] font-bold uppercase text-brand-accent">Default</span>}
                                                            </span>
                                                            <span className="flex items-center justify-between gap-2 pt-2 border-t border-brand-border/60">
                                                                <span className="text-[10px] font-medium text-brand-text-secondary">{formatCurrency(opt.price)}</span>
                                                                <input type="radio" name="durationSelection" value={opt.label} checked={isSelected} onChange={handleFormChange} className="h-4 w-4 accent-brand-accent" />
                                                            </span>
                                                        </label>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Column 2: Optional Packages, Add-ons, Promo, Payment */}
                            <div className="space-y-6 bg-brand-surface/60 p-6 rounded-3xl border border-brand-border/80 shadow-sm">
                                <div className="space-y-1">
                                    <h4 className="text-base font-bold text-brand-text-light flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-brand-accent"></span>
                                        Paket Tambahan & Add-On
                                    </h4>
                                    <p className="text-xs text-brand-text-secondary">Pilih tambahan layanan jika diperlukan.</p>
                                </div>

                                {visiblePackages.filter(p => p.id !== bookingModal.pkg?.id).length > 0 && (
                                    <div className="space-y-3">
                                        <label className="text-xs font-bold text-brand-text-light">Paket Tambahan (Opsional)</label>
                                        <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
                                            {visiblePackages
                                                .filter(p => p.id !== bookingModal.pkg?.id)
                                                .map(pkg => {
                                                    const isSelected = optionalPackages.some(op => op.id === pkg.id);
                                                    const selectedOptional = optionalPackages.find(op => op.id === pkg.id);
                                                    const hasDurationOpts = pkg.durationOptions && pkg.durationOptions.length > 0;
                                                    const selectedOpt = hasDurationOpts
                                                        ? (pkg.durationOptions!.find(o => o.label === selectedOptional?.selectedDuration) || pkg.durationOptions!.find(o => o.default) || pkg.durationOptions![0])
                                                        : null;
                                                    const photographers = selectedOpt?.photographers || pkg.photographers;
                                                    const videographers = selectedOpt?.videographers || pkg.videographers;
                                                    const processingTime = selectedOpt?.processingTime || pkg.processingTime;
                                                    const digitalItems = (selectedOpt?.digitalItems?.filter(Boolean).length ? selectedOpt.digitalItems : pkg.digitalItems)?.filter(Boolean) || [];
                                                    const physicalItems = (selectedOpt?.physicalItems?.filter((p: { name?: string }) => p?.name).length ? selectedOpt.physicalItems : pkg.physicalItems)?.filter((p: { name?: string }) => p?.name) || [];
                                                    const hasAnyDetail = photographers || videographers || processingTime || digitalItems.length > 0 || physicalItems.length > 0;
                                                    return (
                                                        <div key={pkg.id} className="p-3.5 border border-brand-border bg-brand-bg/40 rounded-2xl space-y-2.5 text-xs">
                                                            <div className="flex items-center justify-between gap-3">
                                                                <label className="flex items-center gap-2.5 cursor-pointer flex-1">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={isSelected}
                                                                        onChange={(e) => {
                                                                            if (e.target.checked) {
                                                                                const defaultDuration = pkg.durationOptions && pkg.durationOptions.length > 0
                                                                                    ? (pkg.durationOptions.find(o => o.default) || pkg.durationOptions[0])
                                                                                    : undefined;
                                                                                setOptionalPackages([...optionalPackages, { 
                                                                                    id: pkg.id, 
                                                                                    name: pkg.name, 
                                                                                    price: defaultDuration?.price ?? pkg.price,
                                                                                    selectedDuration: defaultDuration?.label
                                                                                }]);
                                                                            } else {
                                                                                setOptionalPackages(optionalPackages.filter(op => op.id !== pkg.id));
                                                                            }
                                                                        }}
                                                                        className="h-4 w-4 rounded accent-brand-accent"
                                                                    />
                                                                    <span className="font-bold text-brand-text-light">{pkg.name}</span>
                                                                </label>
                                                                <span className="font-extrabold text-brand-accent">
                                                                    {formatCurrency(selectedOptional?.price ?? (hasDurationOpts ? (pkg.durationOptions!.find(o => o.default) || pkg.durationOptions![0])!.price : pkg.price))}
                                                                </span>
                                                            </div>
                                                            {isSelected && (
                                                                <div className="pt-3 pl-6 space-y-2.5 border-t border-brand-border/60">
                                                                    {hasAnyDetail ? (
                                                                        <ul className="text-[11px] text-brand-text-secondary space-y-1.5">
                                                                            {photographers && <li className="flex items-center gap-1.5"><CheckIcon className="w-3.5 h-3.5 text-brand-accent shrink-0" /><span>{photographers}</span></li>}
                                                                            {videographers && <li className="flex items-center gap-1.5"><CheckIcon className="w-3.5 h-3.5 text-brand-accent shrink-0" /><span>{videographers}</span></li>}
                                                                            {processingTime && <li className="flex items-center gap-1.5"><CheckIcon className="w-3.5 h-3.5 text-brand-accent shrink-0" /><span>Pengerjaan: {processingTime}</span></li>}
                                                                            {digitalItems.map((item: string, i: number) => <li key={i} className="flex items-center gap-1.5"><CheckIcon className="w-3.5 h-3.5 text-brand-accent shrink-0" /><span>{item}</span></li>)}
                                                                            {physicalItems.map((item: { name: string }, i: number) => <li key={i} className="flex items-center gap-1.5"><CheckIcon className="w-3.5 h-3.5 text-brand-accent shrink-0" /><span>{item.name}</span></li>)}
                                                                        </ul>
                                                                    ) : pkg.description ? (
                                                                        <p className="text-[11px] text-brand-text-secondary whitespace-pre-wrap">{pkg.description}</p>
                                                                    ) : null}

                                                                    {hasDurationOpts && (
                                                                        <div className="pt-2">
                                                                            <p className="text-[10px] font-semibold text-brand-text-secondary mb-1.5">Pilih Jam Kerja Tambahan:</p>
                                                                            <div className="flex flex-nowrap gap-2 overflow-x-auto pb-1">
                                                                                {pkg.durationOptions!.map(opt => {
                                                                                    const isOptSelected = selectedOptional?.selectedDuration === opt.label;
                                                                                    return (
                                                                                        <label key={opt.label} className={`flex min-w-[130px] cursor-pointer flex-col justify-between gap-1 rounded-xl border p-2 text-[10px] shrink-0 ${isOptSelected ? 'border-brand-accent bg-brand-accent/10 font-bold' : 'border-brand-border bg-brand-surface'}`}>
                                                                                            <span className="flex items-center justify-between">
                                                                                                <span>{opt.label}</span>
                                                                                                <input 
                                                                                                    type="radio" 
                                                                                                    name={`duration-${pkg.id}`} 
                                                                                                    checked={isOptSelected}
                                                                                                    onChange={() => {
                                                                                                        setOptionalPackages(optionalPackages.map(op => 
                                                                                                            op.id === pkg.id 
                                                                                                            ? { ...op, price: Number(opt.price), selectedDuration: opt.label }
                                                                                                            : op
                                                                                                        ));
                                                                                                    }}
                                                                                                    className="h-3 w-3 accent-brand-accent"
                                                                                                />
                                                                                            </span>
                                                                                            <span className="text-brand-accent font-bold">{formatCurrency(opt.price)}</span>
                                                                                        </label>
                                                                                    );
                                                                                })}
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                        </div>
                                    </div>
                                )}

                                {visibleAddOns.length > 0 && (
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-brand-text-light">
                                            Add-On Lainnya {selectedRegion ? `(Wilayah ${selectedRegion.toUpperCase()})` : ''}
                                        </label>
                                        <div className="p-3 border border-brand-border bg-brand-bg/40 rounded-2xl space-y-2 max-h-[600px] overflow-y-auto">
                                            {visibleAddOns.map(addon => (
                                                <label key={addon.id} className="flex items-center justify-between p-2 rounded-xl hover:bg-brand-surface cursor-pointer text-xs transition-colors">
                                                    <span className="font-medium text-brand-text-primary">{addon.name}</span>
                                                    <div className="flex items-center gap-3">
                                                        <span className="font-semibold text-brand-text-secondary">{formatCurrency(addon.price)}</span>
                                                        <input type="checkbox" id={addon.id} name="addOns" checked={formData.selectedAddOnIds.includes(addon.id)} onChange={handleFormChange} className="h-4 w-4 rounded accent-brand-accent" />
                                                    </div>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="input-group">
                                        <input type="text" id="promoCode" name="promoCode" value={formData.promoCode} onChange={handleFormChange} className="input-field" placeholder=" " />
                                        <label htmlFor="promoCode" className="input-label">Kode Promo (Opsional)</label>
                                        {promoFeedback.message && <p className={`text-xs mt-1 ${promoFeedback.type === 'success' ? 'text-green-500' : 'text-red-500'}`}>{promoFeedback.message}</p>}
                                    </div>
                                    <div className="input-group">
                                        <RupiahInput
                                            id="transportCost"
                                            name="transportCost"
                                            value={String(formData.transportCost ?? '')}
                                            onChange={(raw) => setFormData(prev => ({ ...prev, transportCost: raw }))}
                                            className="input-field"
                                            placeholder=" "
                                        />
                                        <label htmlFor="transportCost" className="input-label">Fee Transport (Opsional)</label>
                                    </div>
                                </div>

                                {/* Cost Breakdown & DP Payment Box */}
                                <div className="p-5 bg-brand-bg/60 border border-brand-border rounded-2xl space-y-4">
                                    <h4 className="text-xs font-bold text-brand-text-light uppercase tracking-wider">Rincian Pembayaran</h4>
                                    <div className="space-y-2 text-xs">
                                        <div className="flex justify-between items-center text-brand-text-secondary">
                                            <span>Package Utama</span>
                                            <span className="font-semibold text-brand-text-primary">
                                                {(() => {
                                                    if (!bookingModal.pkg) return formatCurrency(0);
                                                    const opts = bookingModal.pkg.durationOptions;
                                                    if (!opts || opts.length === 0) return formatCurrency(bookingModal.pkg.price);
                                                    const selected = opts.find(o => o.label === formData.durationSelection) || opts.find(o => o.default) || opts[0];
                                                    return formatCurrency(selected?.price ?? bookingModal.pkg.price);
                                                })()}
                                            </span>
                                        </div>
                                        {optionalPackages.map(op => (
                                            <div key={op.id} className="flex justify-between items-center text-brand-text-secondary pl-2">
                                                <span>+ Tambahan: {op.name}</span>
                                                <span className="font-semibold text-brand-text-primary">{formatCurrency(op.price)}</span>
                                            </div>
                                        ))}
                                        {formData.selectedAddOnIds.length > 0 && visibleAddOns.filter(a => formData.selectedAddOnIds.includes(a.id)).map(a => (
                                            <div key={a.id} className="flex justify-between items-center text-brand-text-secondary pl-2">
                                                <span>+ Add-on: {a.name}</span>
                                                <span className="font-semibold text-brand-text-primary">{formatCurrency(a.price)}</span>
                                            </div>
                                        ))}
                                        {Number(formData.transportCost) > 0 && (
                                            <div className="flex justify-between items-center text-brand-text-secondary pl-2">
                                                <span>+ Fee Transport</span>
                                                <span className="font-semibold text-brand-text-primary">{formatCurrency(Number(formData.transportCost) || 0)}</span>
                                            </div>
                                        )}
                                        {discountAmount > 0 && (
                                            <div className="flex justify-between items-center text-green-600 pl-2">
                                                <span>- Diskon ({discountText})</span>
                                                <span className="font-semibold">-{formatCurrency(discountAmount)}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between items-center font-extrabold text-base pt-3 border-t border-brand-border text-brand-text-light">
                                            <span>Total Biaya</span>
                                            <span className="text-brand-accent text-lg">{formatCurrency(totalProject)}</span>
                                        </div>
                                    </div>

                                    <div className="pt-3 border-t border-brand-border space-y-3">
                                        <div className="text-xs space-y-1">
                                            <p className="text-brand-text-secondary">Silakan transfer Uang Muka (DP) ke rekening:</p>
                                            <p className="font-bold text-brand-text-light p-2 bg-brand-surface rounded-xl border border-brand-border text-center tracking-wide">{userProfile.bankAccount}</p>
                                        </div>
                                        <div className="input-group !mt-0">
                                            <RupiahInput
                                                id="dp"
                                                name="dp"
                                                value={String(formData.dp ?? '')}
                                                onChange={(raw) => setFormData(prev => ({ ...prev, dp: raw }))}
                                                className="input-field text-right font-bold"
                                                placeholder=" "
                                            />
                                            <label htmlFor="dp" className="input-label">Jumlah DP</label>
                                            <p className="text-[11px] text-brand-text-secondary mt-1 text-right">Saran DP (30%): <strong className="text-brand-accent">{formatCurrency(suggestedDp)}</strong></p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="dpPaymentProof" className="text-xs font-bold text-brand-text-light block">Unggah Bukti Transfer DP</label>
                                    <div className="flex justify-center rounded-2xl border border-dashed border-brand-border bg-brand-bg/40 px-6 py-8 hover:bg-brand-bg/80 transition-colors">
                                        <div className="text-center">
                                            <UploadIcon className="mx-auto h-10 w-10 text-brand-text-secondary mb-2" />
                                            <div className="flex text-xs leading-6 text-brand-text-secondary">
                                                <label htmlFor="dpPaymentProof" className="relative cursor-pointer rounded-md bg-brand-surface px-2 py-1 font-semibold text-brand-accent border border-brand-border hover:bg-brand-surface/80">
                                                    <span>Pilih file</span>
                                                    <input id="dpPaymentProof" name="dpPaymentProof" type="file" className="sr-only" onChange={handleFileChange} accept="image/png, image/jpeg, image/jpg, application/pdf" />
                                                </label>
                                                <p className="pl-2 pt-1">atau seret dan lepas</p>
                                            </div>
                                            <p className="text-[11px] text-brand-text-secondary mt-1">PNG, JPG, PDF hingga 10MB {paymentProof ? `(Dipilih: ${paymentProof.name})` : ''}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-6 border-t border-brand-border">
                            <button type="button" onClick={handleCloseBookingModal} className="button-secondary px-6">Batal</button>
                            <button type="submit" disabled={isSubmitting} className="button-primary px-8">{isSubmitting ? 'Mengirim...' : 'Kirim Booking'}</button>
                        </div>
                    </form>
                    )}
                </Modal>
                <Modal isOpen={isTermsModalOpen} onClose={() => setIsTermsModalOpen(false)} title="Syarat & Ketentuan Umum">
                    <div className="max-h-[70vh] overflow-y-auto pr-4">
                        {formattedTerms ? (
                            <div>{formattedTerms}</div>
                        ) : (
                            <p className="text-brand-text-secondary text-center py-8">Syarat dan ketentuan belum diatur oleh vendor.</p>
                        )}
                    </div>
                </Modal>
            </div>
        )
    );
};

export default PublicPackages;
