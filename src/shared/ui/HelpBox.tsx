import React from 'react';
import { WhatsappIcon } from '../../constants';

interface HelpBoxProps {
  title?: string;
  description?: string;
  phone?: string; // can be local like 08xxxx
  className?: string;
  variant?: 'public' | 'app';
  buttonOnly?: boolean;
}

const normalizePhoneForWa = (phone: string) => {
  // Remove non-digits
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('0')) return '62' + digits.slice(1);
  if (digits.startsWith('62')) return digits;
  return digits; // fallback
};

const HelpBox: React.FC<HelpBoxProps> = ({
  title = 'Butuh Bantuan?',
  description = 'Jika ada pertanyaan atau butuh bantuan dalam pengisian formulir, jangan ragu untuk menghubungi admin kami melalui WhatsApp.',
  phone = '085693994277',
  className = '',
  variant = 'public',
  buttonOnly = false,
}) => {
  const displayPhone = phone || '085693994277';
  const waPhone = normalizePhoneForWa(displayPhone);
  const waUrl = `https://wa.me/${waPhone}?text=${encodeURIComponent('Halo Admin, saya butuh bantuan.')}`;

  if (buttonOnly) {
    return (
      <a
        href={waUrl}
        target="_blank"
        rel="noreferrer"
        className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-[#25D366] hover:bg-[#20bd5a] active:scale-95 transition-all shadow-lg shadow-emerald-500/25 focus:outline-none focus:ring-2 focus:ring-[#25D366] focus:ring-offset-1 ${className}`}
      >
        <WhatsappIcon className="w-4 h-4 flex-shrink-0" />
        <span>Hubungi Admin ({displayPhone})</span>
      </a>
    );
  }

  return (
    <div
      className={`bg-white border border-zinc-200/90 text-zinc-900 rounded-xl sm:rounded-2xl p-2.5 sm:p-5 shadow-xl shadow-black/5 ${className}`}
    >
      <div className="flex items-start gap-2.5 sm:gap-3.5">
        <div className="bg-[#25D366] text-white border border-transparent p-1.5 sm:p-2.5 rounded-lg sm:rounded-xl flex-shrink-0 shadow-xs">
          <WhatsappIcon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-zinc-900 font-bold text-xs sm:text-base leading-tight sm:leading-snug">{title}</h4>
          <p className="text-zinc-600 text-[10px] sm:text-sm mt-0.5 sm:mt-1 leading-snug sm:leading-relaxed">
            {description}
          </p>
          <div className="mt-2 sm:mt-3.5">
            <a
              href={waUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 py-1.5 sm:px-3.5 sm:py-2 rounded-lg sm:rounded-xl text-[10px] sm:text-sm font-bold text-white bg-[#25D366] hover:bg-[#20bd5a] active:scale-95 transition-all shadow-md shadow-emerald-500/20 focus:outline-none focus:ring-2 focus:ring-[#25D366] focus:ring-offset-1"
            >
              <WhatsappIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
              <span>Hubungi Admin ({displayPhone})</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpBox;
