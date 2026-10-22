import React from 'react';
import Modal from '../../../shared/ui/Modal';
import { Package, Sparkles, Layers, Share2, Image, CheckCircle } from 'lucide-react';

interface PackageGuideModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const PackageGuideModal: React.FC<PackageGuideModalProps> = ({
    isOpen,
    onClose,
}) => {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Panduan Katalog Paket & Layanan"
            size="lg"
        >
            <div className="space-y-4 text-xs sm:text-sm text-[#2A3547]">
                <p className="text-[#5A6A85]">
                    Halaman ini digunakan untuk mengelola seluruh portofolio paket dokumentasi foto/video pernikahan dan item add-on untuk bisnis wedding Anda.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <div className="p-4 rounded-2xl bg-[#F4F6F9] border border-[#EAEFF4] space-y-2">
                        <div className="w-8 h-8 rounded-xl solid-blue text-white flex items-center justify-center">
                            <Package className="w-4 h-4" />
                        </div>
                        <h4 className="font-bold text-sm text-[#2A3547]">Paket Utama</h4>
                        <p className="text-xs text-[#5A6A85] leading-relaxed">
                            Buat penawaran paket layanan utama. Anda dapat menyetel opsi durasi fleksibel (misal: 4 Jam vs Full Day) sehingga pengantin dapat memilih paket dengan harga yang tepat.
                        </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-[#F4F6F9] border border-[#EAEFF4] space-y-2">
                        <div className="w-8 h-8 rounded-xl solid-green text-white flex items-center justify-center">
                            <Sparkles className="w-4 h-4" />
                        </div>
                        <h4 className="font-bold text-sm text-[#2A3547]">Layanan Add-On</h4>
                        <p className="text-xs text-[#5A6A85] leading-relaxed">
                            Tambahan opsional seperti Drone, Extra Jam, Live Streaming, atau Cetak Canvas yang dapat ditambahkan langsung oleh calon pengantin saat memilih paket.
                        </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-[#F4F6F9] border border-[#EAEFF4] space-y-2">
                        <div className="w-8 h-8 rounded-xl solid-orange text-white flex items-center justify-center">
                            <Image className="w-4 h-4" />
                        </div>
                        <h4 className="font-bold text-sm text-[#2A3547]">Foto Sampul Visual</h4>
                        <p className="text-xs text-[#5A6A85] leading-relaxed">
                            Tambahkan foto sampul terbaik pada setiap paket agar tampilan katalog di portal booking calon pengantin terlihat profesional dan meyakinkan.
                        </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-[#F4F6F9] border border-[#EAEFF4] space-y-2">
                        <div className="w-8 h-8 rounded-xl solid-pink text-white flex items-center justify-center">
                            <Share2 className="w-4 h-4" />
                        </div>
                        <h4 className="font-bold text-sm text-[#2A3547]">Tautan per Grup Paket</h4>
                        <p className="text-xs text-[#5A6A85] leading-relaxed">
                            Gunakan tombol Bagikan Tautan untuk membagikan katalog harga otomatis yang hanya menampilkan paket, add-on, dan attire sesuai grup paket yang dipilih.
                        </p>
                    </div>
                </div>

                <div className="pt-3 border-t border-[#EAEFF4] flex justify-end">
                    <button
                        type="button"
                        onClick={onClose}
                        className="py-2 px-5 rounded-xl bg-brand-accent text-white text-xs font-semibold hover:bg-brand-accent-hover transition-colors"
                    >
                        Saya Mengerti
                    </button>
                </div>
            </div>
        </Modal>
    );
};
