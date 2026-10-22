import React, { Component, ReactNode } from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode | ((error?: Error, resetError?: () => void) => ReactNode);
  resetKey?: any;
  resetKeys?: any[];
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  componentDidMount() {
    window.addEventListener('hashchange', this.handleNavigationChange);
    window.addEventListener('popstate', this.handleNavigationChange);
  }

  componentWillUnmount() {
    window.removeEventListener('hashchange', this.handleNavigationChange);
    window.removeEventListener('popstate', this.handleNavigationChange);
  }

  componentDidUpdate(prevProps: Props) {
    if (this.state.hasError) {
      const resetKeyChanged =
        this.props.resetKey !== undefined && this.props.resetKey !== prevProps.resetKey;
      const resetKeysChanged =
        this.props.resetKeys !== undefined &&
        !this.areKeysEqual(prevProps.resetKeys, this.props.resetKeys);

      if (resetKeyChanged || resetKeysChanged) {
        this.resetError();
      }
    }
  }

  private areKeysEqual(a?: any[], b?: any[]): boolean {
    if (!a || !b) return a === b;
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) return false;
    }
    return true;
  }

  handleNavigationChange = () => {
    if (this.state.hasError) {
      this.resetError();
    }
  };

  resetError = () => {
    if (this.props.onReset) {
      this.props.onReset();
    }
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (typeof this.props.fallback === 'function') {
        return this.props.fallback(this.state.error, this.resetError);
      }

      if (this.props.fallback) {
        return this.props.fallback;
      }

      const msg = this.state.error?.message || '';
      const isChunkError =
        msg.includes('dynamically imported module') ||
        msg.includes('Importing a module script failed') ||
        msg.includes('Failed to fetch') ||
        this.state.error?.name === 'ChunkLoadError';

      return (
        <div className="min-h-[400px] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-sm border border-[#EAEFF4] p-6 sm:p-8 max-w-md w-full text-center">
            <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-red-600 border border-transparent flex items-center justify-center text-white">
              <AlertCircle className="w-7 h-7" />
            </div>

            <h2 className="text-lg font-bold text-[#2A3547] mb-2">
              {isChunkError ? 'Pembaruan Aplikasi Tersedia' : 'Kendala Memuat Halaman'}
            </h2>

            <p className="text-xs sm:text-sm text-[#5A6A85] mb-6 leading-relaxed">
              {isChunkError
                ? 'Versi berkas aplikasi telah diperbarui. Silakan muat ulang atau pilih menu lain di navigasi.'
                : 'Terjadi kendala saat memuat konten. Halaman lain tetap dapat diakses langsung lewat menu navigasi.'}
            </p>

            <div className="flex flex-col sm:flex-row gap-2.5 justify-center">
              <button
                type="button"
                onClick={() => {
                  if (isChunkError) {
                    window.location.reload();
                  } else {
                    this.resetError();
                  }
                }}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-brand-accent hover:bg-brand-accent-hover text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>{isChunkError ? 'Muat Ulang Halaman' : 'Coba Buka Ulang'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  this.resetError();
                  window.location.hash = '#/dashboard';
                }}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-brand-accent hover:bg-brand-accent-hover text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                <Home className="w-3.5 h-3.5" />
                <span>Ke Dashboard</span>
              </button>
            </div>

            {(import.meta.env?.DEV ||
              (typeof process !== 'undefined' && process.env?.NODE_ENV === 'development')) &&
              this.state.error && (
                <details className="mt-4 text-left">
                  <summary className="cursor-pointer text-xs text-[#5A6A85] hover:text-[#2A3547]">
                    Detail Error (Mode Pengembangan)
                  </summary>
                  <pre className="mt-2 text-[11px] text-red-600 bg-red-50 p-2.5 rounded-lg overflow-auto max-h-40">
                    {this.state.error.stack}
                  </pre>
                </details>
              )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
