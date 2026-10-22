import React, { useState } from 'react';
import { PromoCode, Project } from '../../types';
import PageHeader from '../../layouts/PageHeader';
import Modal from '../../shared/ui/Modal';
import { PlusIcon, PencilIcon, Trash2Icon, PackageIcon, DollarSignIcon, CalendarIcon } from '../../constants';
import { createPromoCode, updatePromoCode, deletePromoCode } from '../../services/promoCodes';
import { MobileExpandableExtra } from '../../components/ui/MobileProgressiveDisclosure';

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
}

const emptyFormState = {
    code: '',
    discountType: 'percentage' as 'percentage' | 'fixed',
    discountValue: '',
    isActive: true,
    maxUsage: '',
    expiryDate: ''
};

interface PromoCodesProps {
    promoCodes: PromoCode[];
    setPromoCodes: React.Dispatch<React.SetStateAction<PromoCode[]>>;
    projects: Project[];
    showNotification: (message: string) => void;
}

const PromoCodes: React.FC<PromoCodesProps> = ({ promoCodes, setPromoCodes, projects, showNotification }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
    const [selectedCode, setSelectedCode] = useState<PromoCode | null>(null);
    const [formData, setFormData] = useState(emptyFormState);

    const handleOpenModal = (mode: 'add' | 'edit', code?: PromoCode) => {
        setModalMode(mode);
        if (mode === 'edit' && code) {
            setSelectedCode(code);
            setFormData({
                code: code.code,
                discountType: code.discountType,
                discountValue: code.discountValue.toString(),
                isActive: code.isActive,
                maxUsage: code.maxUsage?.toString() || '',
                expiryDate: code.expiryDate || '',
            });
        } else {
            setSelectedCode(null);
            setFormData(emptyFormState);
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
    };

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const isCheckbox = type === 'checkbox';
        const checked = isCheckbox ? (e.target as HTMLInputElement).checked : false;

        setFormData(prev => ({
            ...prev,
            [name]: isCheckbox ? checked : value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            if (modalMode === 'add') {
                const created = await createPromoCode({
                    code: formData.code.toUpperCase(),
                    discountType: formData.discountType,
                    discountValue: Number(formData.discountValue),
                    isActive: formData.isActive,
                    maxUsage: formData.maxUsage ? Number(formData.maxUsage) : undefined,
                    expiryDate: formData.expiryDate || undefined,
                } as any);
                setPromoCodes(prev => [...prev, created]);
                showNotification(`Kode promo "${created.code}" berhasil dibuat.`);
            } else if (selectedCode) {
                const updated = await updatePromoCode(selectedCode.id, {
                    code: formData.code.toUpperCase(),
                    discountType: formData.discountType,
                    discountValue: Number(formData.discountValue),
                    isActive: formData.isActive,
                    maxUsage: formData.maxUsage ? Number(formData.maxUsage) : undefined,
                    expiryDate: formData.expiryDate || undefined,
                } as any);
                setPromoCodes(prev => prev.map(c => c.id === selectedCode.id ? updated : c));
                showNotification(`Kode promo "${updated.code}" berhasil diperbarui.`);
            }
        } catch (err) {
            alert('Gagal menyimpan kode promo ke database. Coba lagi.');
            return;
        }
        handleCloseModal();
    };

    const handleDelete = async (codeId: string) => {
        const isUsed = projects.some(p => p.promoCodeId === codeId);
        if (isUsed) {
            showNotification('Kode promo tidak dapat dihapus karena sedang digunakan pada Acara Pernikahan.');
            return;
        }
        if (!window.confirm("Apakah Anda yakin ingin menghapus kode promo ini?")) return;
        try {
            await deletePromoCode(codeId);
            setPromoCodes(prev => prev.filter(c => c.id !== codeId));
            showNotification('Kode promo berhasil dihapus.');
        } catch (err) {
            alert('Gagal menghapus kode promo di database. Coba lagi.');
        }
    };

    return (
        <div className="space-y-6">
            <PageHeader title="Voucher" subtitle="Buat dan kelola kode diskon untuk pengantin Anda." icon={<PackageIcon className="w-6 h-6" />}>
                <button onClick={() => handleOpenModal('add')} className="button-primary inline-flex items-center gap-2">
                    <PlusIcon className="w-5 h-5" />
                    Buat Kode Baru
                </button>
            </PageHeader>

            {/* Desktop Table View */}
            <div className="hidden md:block bg-brand-surface p-4 rounded-xl shadow-lg border border-brand-border">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="text-xs text-brand-text-secondary uppercase">
                            <tr>
                                <th className="px-4 py-3 text-center w-12">No</th>
                                <th className="px-4 py-3">Kode</th>
                                <th className="px-4 py-3">Diskon</th>
                                <th className="px-4 py-3">Status</th>
                                <th className="px-4 py-3">Penggunaan</th>
                                <th className="px-4 py-3">Kadaluwarsa</th>
                                <th className="px-4 py-3 text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-brand-border">
                            {promoCodes.map((code, index) => (
                                <tr key={code.id} className="hover:bg-brand-bg">
                                    <td className="px-4 py-3 text-center font-medium text-brand-text-secondary">{index + 1}</td>
                                    <td className="px-4 py-3 font-semibold text-brand-text-light">{code.code}</td>
                                    <td className="px-4 py-3">
                                        {code.discountType === 'percentage'
                                            ? `${code.discountValue}%`
                                            : formatCurrency(code.discountValue)}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${code.isActive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                            {code.isActive ? 'Aktif' : 'Tidak Aktif'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">{code.usageCount} / {code.maxUsage ?? '∞'}</td>
                                    <td className="px-4 py-3">{code.expiryDate ? new Date(code.expiryDate).toLocaleDateString('id-ID') : 'Tidak ada'}</td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center justify-center space-x-1">
                                            <button onClick={() => handleOpenModal('edit', code)} className="p-2 text-brand-text-secondary hover:bg-brand-input rounded-full" title="Edit"><PencilIcon className="w-5 h-5" /></button>
                                            <button onClick={() => handleDelete(code.id)} className="p-2 text-brand-text-secondary hover:bg-brand-input rounded-full" title="Hapus"><Trash2Icon className="w-5 h-5" /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-2.5">
                {promoCodes.length === 0 ? (
                    <div className="bg-brand-surface p-8 rounded-xl text-center border border-brand-border">
                        <PackageIcon className="w-12 h-12 text-brand-text-secondary mx-auto mb-3 opacity-50" />
                        <p className="text-brand-text-secondary">Belum ada kode promo. Klik tombol "Buat Kode Baru" untuk memulai.</p>
                    </div>
                ) : (
                    promoCodes.map(code => (
                        <div key={code.id} className="bg-brand-surface rounded-xl shadow-sm border border-brand-border p-3.5">
                            <div className="flex items-center justify-between gap-2">
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                        <p className="font-bold text-base text-brand-text-light tracking-wider truncate">{code.code}</p>
                                        <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full ${code.isActive ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
                                            {code.isActive ? 'Aktif' : 'Nonaktif'}
                                        </span>
                                    </div>
                                    <p className="text-xs text-brand-text-secondary mt-0.5">
                                        Terpakai: {code.usageCount} / {code.maxUsage ?? '∞'}
                                    </p>
                                </div>
                                <div className="text-right flex-shrink-0">
                                    <p className="text-[10px] text-brand-text-secondary">Diskon</p>
                                    <p className="text-base font-bold text-brand-accent">
                                        {code.discountType === 'percentage'
                                            ? `${code.discountValue}%`
                                            : formatCurrency(code.discountValue)}
                                    </p>
                                </div>
                            </div>

                            <MobileExpandableExtra
                                labelOpen="Detail & Aksi"
                                labelClose="Tutup"
                            >
                                <div className="space-y-2 text-xs">
                                    <div className="flex items-center justify-between text-brand-text-secondary">
                                        <span>Kadaluwarsa:</span>
                                        <span className="font-semibold text-brand-text-light">
                                            {code.expiryDate ? new Date(code.expiryDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Tidak ada batas'}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 pt-1">
                                        <button
                                            onClick={() => handleOpenModal('edit', code)}
                                            className="flex items-center justify-center gap-1.5 py-1.5 px-3 bg-brand-bg hover:bg-brand-input text-brand-text-light rounded-lg border border-brand-border text-xs font-semibold transition-colors"
                                        >
                                            <PencilIcon className="w-3.5 h-3.5" />
                                            <span>Edit</span>
                                        </button>
                                        <button
                                            onClick={() => handleDelete(code.id)}
                                            className="flex items-center justify-center gap-1.5 py-1.5 px-3 bg-red-600 hover:bg-red-700 text-white rounded-lg border border-red-600 text-xs font-semibold transition-colors"
                                        >
                                            <Trash2Icon className="w-3.5 h-3.5" />
                                            <span>Hapus</span>
                                        </button>
                                    </div>
                                </div>
                            </MobileExpandableExtra>
                        </div>
                    ))
                )}
            </div>

            <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={modalMode === 'add' ? 'Buat Kode Promo Baru' : 'Edit Kode Promo'}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grad-purple text-white rounded-lg p-4 mb-4">
                        <h4 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
                            <PackageIcon className="w-4 h-4" />
                            Informasi Kode Promo
                        </h4>
                        <p className="text-xs text-white/80">
                            Buat kode promo unik untuk memberikan diskon kepada pengantin Anda. Kode ini dapat digunakan saat membuat A cara Pernikahan baru untuk mengurangi total biaya.
                        </p>
                    </div>

                    <div>
                        <h5 className="text-sm font-semibold text-brand-text-light mb-3">Detail Kode Promo</h5>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="input-group">
                                <input
                                    type="text"
                                    id="code"
                                    name="code"
                                    value={formData.code}
                                    onChange={handleFormChange}
                                    className="input-field uppercase"
                                    placeholder=" "
                                    required
                                />
                                <label htmlFor="code" className="input-label">Kode Promo</label>
                                <p className="text-xs text-brand-text-secondary mt-1">Contoh: PROMO2024, DISKON50K, NEWCLIENT</p>
                            </div>
                            <div className="input-group">
                                <select
                                    id="discountType"
                                    name="discountType"
                                    value={formData.discountType}
                                    onChange={handleFormChange}
                                    className="input-field"
                                >
                                    <option value="percentage">Persentase (%)</option>
                                    <option value="fixed">Nominal Tetap (Rp)</option>
                                </select>
                                <label htmlFor="discountType" className="input-label">Jenis Diskon</label>
                                <p className="text-xs text-brand-text-secondary mt-1">Pilih tipe diskon yang akan diberikan</p>
                            </div>
                        </div>
                    </div>

                    <div>
                        <h5 className="text-sm font-semibold text-brand-text-light mb-3">Nilai Diskon</h5>
                        <div className="input-group">
                            <input
                                type="number"
                                id="discountValue"
                                name="discountValue"
                                value={formData.discountValue}
                                onChange={handleFormChange}
                                className="input-field"
                                placeholder=" "
                                min="0"
                                max={formData.discountType === 'percentage' ? '100' : undefined}
                                required
                            />
                            <label htmlFor="discountValue" className="input-label">
                                {formData.discountType === 'percentage' ? 'Nilai Persentase (%)' : 'Jumlah Diskon (IDR)'}
                            </label>
                            <p className="text-xs text-brand-text-secondary mt-1">
                                {formData.discountType === 'percentage'
                                    ? 'Masukkan angka 1-100 untuk persentase diskon (contoh: 10 untuk diskon 10%)'
                                    : 'Masukkan jumlah diskon dalam Rupiah (contoh: 50000 untuk diskon Rp 50.000)'}
                            </p>
                        </div>
                    </div>

                    <div>
                        <h5 className="text-sm font-semibold text-brand-text-light mb-3">Batasan & Masa Berlaku</h5>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="input-group">
                                <input
                                    type="number"
                                    id="maxUsage"
                                    name="maxUsage"
                                    value={formData.maxUsage}
                                    onChange={handleFormChange}
                                    className="input-field"
                                    placeholder=" "
                                    min="0"
                                />
                                <label htmlFor="maxUsage" className="input-label">Maksimal Penggunaan</label>
                                <p className="text-xs text-brand-text-secondary mt-1">Kosongkan untuk penggunaan tak terbatas (∞)</p>
                            </div>
                            <div className="input-group">
                                <input
                                    type="date"
                                    id="expiryDate"
                                    name="expiryDate"
                                    value={formData.expiryDate}
                                    onChange={handleFormChange}
                                    className="input-field"
                                    placeholder=" "
                                />
                                <label htmlFor="expiryDate" className="input-label">Tanggal Kadaluwarsa</label>
                                <p className="text-xs text-brand-text-secondary mt-1">Kosongkan jika tidak ada batas waktu</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-brand-bg p-4 rounded-lg border border-brand-border">
                        <div className="flex items-start gap-3">
                            <input
                                type="checkbox"
                                id="isActive"
                                name="isActive"
                                checked={formData.isActive}
                                onChange={handleFormChange}
                                className="h-4 w-4 rounded flex-shrink-0 mt-0.5 text-brand-accent focus:ring-brand-accent transition-colors"
                            />
                            <div className="flex-1">
                                <label htmlFor="isActive" className="text-sm font-medium text-brand-text-light cursor-pointer block">
                                    Aktifkan Kode Promo
                                </label>
                                <p className="text-xs text-brand-text-secondary mt-1">
                                    Hanya kode promo yang aktif yang dapat digunakan oleh pengantin saat membuat Acara Pernikahan baru
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t border-brand-border">
                        <button type="button" onClick={handleCloseModal} className="button-secondary w-full sm:w-auto">Batal</button>
                        <button type="submit" className="button-primary w-full sm:w-auto">
                            {modalMode === 'add' ? 'Simpan Kode Promo' : 'Update Kode Promo'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default PromoCodes;