import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface LoadingStateProps {
  message?: string;
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message,
  size = 'medium',
  className = '',
}) => {
  const sizeClasses = {
    small: 'w-5 h-5 border-2',
    medium: 'w-10 h-10 border-3',
    large: 'w-14 h-14 border-4',
  };

  return (
    <div className={`flex flex-col items-center justify-center py-12 gap-3 ${className}`}>
      <div className="relative flex justify-center items-center">
        <div className={`border-[#E2E8F0] rounded-full ${sizeClasses[size]}`}></div>
        <div
          className={`absolute animate-spin border-transparent border-t-brand-accent rounded-full ${sizeClasses[size]}`}
        ></div>
      </div>
      {message && <p className="text-xs font-medium text-[#5A6A85]">{message}</p>}
    </div>
  );
};

interface DataLoadingWrapperProps {
  loading: boolean;
  loaded: boolean;
  error?: string | null;
  children: React.ReactNode;
  loadingMessage?: string;
  onRetry?: () => void;
}

export const DataLoadingWrapper: React.FC<DataLoadingWrapperProps> = ({
  loading,
  loaded,
  error,
  children,
  loadingMessage,
  onRetry,
}) => {
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
        <div className="w-12 h-12 rounded-2xl bg-red-600 border border-transparent flex items-center justify-center text-white mb-3">
          <AlertCircle className="w-6 h-6" />
        </div>
        <p className="text-sm font-bold text-[#2A3547] mb-1">Gagal Memuat Data</p>
        <p className="text-xs text-[#5A6A85] mb-4 max-w-sm">{error}</p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-accent hover:bg-brand-accent-hover text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Coba Lagi</span>
          </button>
        )}
      </div>
    );
  }

  if (loading && !loaded) {
    return <LoadingState message={loadingMessage} />;
  }

  return <>{children}</>;
};
