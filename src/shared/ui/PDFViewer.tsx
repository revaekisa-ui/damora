import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as pdfjs from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

// Load the worker from the same pdfjs-dist version as the API.
if (typeof window !== 'undefined') {
    pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
}

interface PDFViewerProps {
    pdfUrl?: string;
    pdfBlob?: Blob;
    className?: string;
}

const PDFViewer: React.FC<PDFViewerProps> = ({ pdfUrl, pdfBlob, className = '' }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [pdf, setPdf] = useState<pdfjs.PDFDocumentProxy | null>(null);
    const [numPages, setNumPages] = useState(0);
    const [containerWidth, setContainerWidth] = useState(0);
    const [isLoadingPdf, setIsLoadingPdf] = useState(true);
    const [pdfError, setPdfError] = useState<string | null>(null);
    const [pagesRendering, setPagesRendering] = useState<Record<number, boolean>>({});

    const resizeTimerRef = useRef<NodeJS.Timeout | null>(null);

    // 1. Load PDF Document
    useEffect(() => {
        let isCancelled = false;
        let activeLoadingTask: pdfjs.PDFDocumentLoadingTask | null = null;

        const loadPdf = async () => {
            setIsLoadingPdf(true);
            setPdfError(null);
            setPdf(null);
            setNumPages(0);

            try {
                if (pdfBlob) {
                    const arrayBuffer = await pdfBlob.arrayBuffer();
                    if (isCancelled) return;
                    activeLoadingTask = pdfjs.getDocument({ data: arrayBuffer });
                } else if (pdfUrl) {
                    activeLoadingTask = pdfjs.getDocument({ url: pdfUrl });
                } else {
                    setIsLoadingPdf(false);
                    return;
                }

                const pdfDoc = await activeLoadingTask.promise;
                if (isCancelled) {
                    pdfDoc.cleanup();
                    return;
                }

                setPdf(pdfDoc);
                setNumPages(pdfDoc.numPages);
            } catch (err: any) {
                if (!isCancelled) {
                    console.error('[PDFViewer] Error loading PDF document:', err);
                    setPdfError(err?.message || 'Gagal memuat dokumen PDF.');
                }
            } finally {
                if (!isCancelled) {
                    setIsLoadingPdf(false);
                }
            }
        };

        loadPdf();

        return () => {
            isCancelled = true;
            if (activeLoadingTask) {
                try {
                    activeLoadingTask.destroy();
                } catch {
                    // Ignore destroy error
                }
            }
        };
    }, [pdfUrl, pdfBlob]);

    // Cleanup PDF on unmount or before switching
    useEffect(() => {
        return () => {
            if (pdf) {
                try {
                    pdf.cleanup();
                } catch {
                    // Ignore destroy error
                }
            }
        };
    }, [pdf]);

    // 2. Responsive Resize with ResizeObserver & debounce
    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;

        const updateWidth = () => {
            if (!containerRef.current) return;
            const clientWidth = containerRef.current.clientWidth;
            if (clientWidth > 0) {
                setContainerWidth(clientWidth);
            }
        };

        // Initial measurement
        updateWidth();

        const observer = new ResizeObserver((entries) => {
            if (!entries || entries.length === 0) return;
            const entry = entries[0];
            const width = entry.contentRect.width || entry.target.clientWidth;

            if (resizeTimerRef.current) {
                clearTimeout(resizeTimerRef.current);
            }

            resizeTimerRef.current = setTimeout(() => {
                if (width > 0) {
                    setContainerWidth(Math.floor(width));
                }
            }, 80);
        });

        observer.observe(el);

        // Also listen to window resize & orientation change
        const handleWindowResize = () => {
            if (resizeTimerRef.current) clearTimeout(resizeTimerRef.current);
            resizeTimerRef.current = setTimeout(updateWidth, 80);
        };
        window.addEventListener('resize', handleWindowResize);
        window.addEventListener('orientationchange', handleWindowResize);

        return () => {
            if (resizeTimerRef.current) clearTimeout(resizeTimerRef.current);
            observer.disconnect();
            window.removeEventListener('resize', handleWindowResize);
            window.removeEventListener('orientationchange', handleWindowResize);
        };
    }, []);

    const handlePageRenderStatus = useCallback((pageNumber: number, isRendering: boolean) => {
        setPagesRendering(prev => ({ ...prev, [pageNumber]: isRendering }));
    }, []);

    // Check if any page is still actively rendering
    const isAnyPageRendering = Object.values(pagesRendering).some(Boolean);

    // Target width for page:
    // On mobile (< 640px), render edge-to-edge full width A4 with 0 horizontal padding
    // On desktop, comfortable preview width up to 900px
    const isMobile = typeof window !== 'undefined' ? window.innerWidth < 640 : false;
    const horizontalPadding = isMobile ? 24 : 48;
    const availableWidth = Math.max(100, containerWidth - horizontalPadding);
    const targetPageWidth = Math.min(availableWidth, isMobile ? 360 : 900);

    return (
        <div
            ref={containerRef}
            className={`w-full max-w-[950px] mx-auto overflow-x-hidden overflow-y-auto bg-slate-100/70 dark:bg-slate-900/40 rounded-xl p-0 sm:p-4 min-h-[420px] flex flex-col items-center select-none ${className}`}
            style={{ overscrollBehavior: 'contain', maxHeight: 'none', overflowY: 'auto' }}
        >
            {/* Loading PDF State */}
            {isLoadingPdf && (
                <div className="flex flex-col items-center justify-center py-24 my-auto">
                    <div className="w-12 h-12 border-4 border-brand-accent/20 border-t-brand-accent rounded-full animate-spin mb-4" />
                    <p className="text-sm font-semibold text-brand-text-primary">Memuat Dokumen PDF...</p>
                    <p className="text-xs text-brand-text-secondary mt-1">Menyiapkan halaman dokumen</p>
                </div>
            )}

            {/* Error Loading PDF State */}
            {pdfError && !isLoadingPdf && (
                <div className="flex flex-col items-center justify-center p-8 text-center my-auto max-w-md bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-2xl">
                    <svg className="w-12 h-12 text-red-500 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <p className="font-bold text-red-700 dark:text-red-400 mb-1">Gagal Memuat Preview PDF</p>
                    <p className="text-xs text-red-600/80 dark:text-red-400/80 mb-4">{pdfError}</p>
                    <button
                        type="button"
                        onClick={() => {
                            setPdfError(null);
                            setIsLoadingPdf(true);
                            // Force re-trigger by setting dummy state
                            setContainerWidth(prev => prev || 1);
                        }}
                        className="px-4 py-1.5 text-xs font-semibold bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors shadow-sm"
                    >
                        Coba Lagi
                    </button>
                </div>
            )}

            {/* Rendering Indicator Bar */}
            {!isLoadingPdf && !pdfError && isAnyPageRendering && (
                <div className="sticky top-0 z-10 w-full flex justify-center mb-2 pointer-events-none">
                    <div className="bg-slate-900/80 backdrop-blur text-white text-[11px] font-medium px-3 py-1 rounded-full shadow-lg flex items-center gap-2">
                        <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Merender halaman...</span>
                    </div>
                </div>
            )}

            {/* Multi-Page Vertical Rendering (Page 1 -> Page 2 -> Page 3) */}
            {!isLoadingPdf && !pdfError && pdf && targetPageWidth > 0 && (
                <div className="w-full flex flex-col items-center gap-4 sm:gap-6 py-1">
                    {Array.from({ length: numPages }, (_, index) => (
                        <PDFPage
                            key={`pdf-page-${index + 1}`}
                            pdf={pdf}
                            pageNumber={index + 1}
                            targetWidth={targetPageWidth}
                            onRenderStatus={handlePageRenderStatus}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

interface PDFPageProps {
    pdf: pdfjs.PDFDocumentProxy;
    pageNumber: number;
    targetWidth: number;
    onRenderStatus: (pageNumber: number, isRendering: boolean) => void;
}

const PDFPage: React.FC<PDFPageProps> = ({
    pdf,
    pageNumber,
    targetWidth,
    onRenderStatus
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const renderTaskRef = useRef<pdfjs.RenderTask | null>(null);
    const [pageError, setPageError] = useState<string | null>(null);

    useEffect(() => {
        let isCancelled = false;

        const renderPage = async () => {
            if (!canvasRef.current || targetWidth <= 0) return;

            // 1. Cleanup any in-flight render task for this canvas
            if (renderTaskRef.current) {
                try {
                    renderTaskRef.current.cancel();
                } catch {
                    // Ignore cancel error
                }
                renderTaskRef.current = null;
            }

            onRenderStatus(pageNumber, true);
            setPageError(null);

            try {
                // 2. Fetch page and calculate fit-width scale
                const page = await pdf.getPage(pageNumber);
                if (isCancelled) return;

                const originalViewport = page.getViewport({ scale: 1 });
                // Scale is dynamically calculated from targetWidth:
                // scale = targetWidth / pageViewport.width
                const scale = targetWidth / originalViewport.width;
                const viewport = page.getViewport({ scale });

                const canvas = canvasRef.current;
                if (!canvas) return;

                // 3. High DPI / Retina handling
                // Separate display size (CSS) and canvas render resolution (bitmap)
                const outputScale = window.devicePixelRatio || 1;
                canvas.width = Math.floor(viewport.width * outputScale);
                canvas.height = Math.floor(viewport.height * outputScale);

                // CSS display size matches viewport width & height exactly
                canvas.style.width = `${Math.floor(viewport.width)}px`;
                canvas.style.height = `${Math.floor(viewport.height)}px`;

                const context = canvas.getContext('2d', { alpha: false });
                if (!context) return;

                // 4. Render context with proper transform
                const transform = outputScale !== 1 ? [outputScale, 0, 0, outputScale, 0, 0] : null;

                const renderContext = {
                    canvasContext: context,
                    canvas: canvas,
                    viewport: viewport,
                    ...(transform ? { transform } : {}),
                };

                const renderTask = page.render(renderContext);
                renderTaskRef.current = renderTask;

                await renderTask.promise;
                renderTaskRef.current = null;
                if (!isCancelled) {
                    onRenderStatus(pageNumber, false);
                }
            } catch (err: any) {
                if (err?.name === 'RenderingCancelledException') {
                    // Normal cancellation due to re-render or resize
                    return;
                }
                if (!isCancelled) {
                    console.error(`[PDFViewer] Error rendering page ${pageNumber}:`, err);
                    setPageError(`Gagal merender halaman ${pageNumber}`);
                    onRenderStatus(pageNumber, false);
                }
            }
        };

        renderPage();

        return () => {
            isCancelled = true;
            if (renderTaskRef.current) {
                try {
                    renderTaskRef.current.cancel();
                } catch {
                    // Ignore
                }
                renderTaskRef.current = null;
            }
            onRenderStatus(pageNumber, false);
        };
    }, [pdf, pageNumber, targetWidth, onRenderStatus]);

    return (
        <div
            className="pdf-page-wrapper relative bg-white sm:shadow-lg sm:border sm:border-slate-200/80 rounded-none sm:rounded-sm overflow-visible flex flex-col items-center justify-center transition-shadow w-full sm:w-auto"
            style={{ width: '100%', maxWidth: `${targetWidth}px`, height: 'auto', maxHeight: 'none', overflow: 'visible' }}
        >
            {pageError ? (
                <div className="p-8 text-center text-xs text-red-600 bg-red-50 w-full">
                    {pageError}
                </div>
            ) : (
                <canvas
                    ref={canvasRef}
                    className="block m-0 p-0"
                    style={{ width: '100%', maxWidth: '100%', height: 'auto', display: 'block', maxHeight: 'none' }}
                />
            )}
        </div>
    );
};

export default PDFViewer;
