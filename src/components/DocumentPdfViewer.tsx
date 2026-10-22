import React, { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';

// Set worker path
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

interface DocumentPdfViewerProps {
    pdfBlob: Blob;
}

export const DocumentPdfViewer: React.FC<DocumentPdfViewerProps> = ({ pdfBlob }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [numPages, setNumPages] = useState<number>(0);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        let isCancelled = false;
        let loadingTask: ReturnType<typeof pdfjsLib.getDocument> | undefined;
        const loadPdf = async () => {
            loadingTask = pdfjsLib.getDocument({ data: await pdfBlob.arrayBuffer() });
            const pdf = await loadingTask.promise;
            if (isCancelled) return;
            setNumPages(pdf.numPages);

            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const viewport = page.getViewport({ scale: 1.5 }); // Adjust scale as needed
                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');
                if (!context) throw new Error('Unable to create PDF canvas context.');
                canvas.height = viewport.height;
                canvas.width = viewport.width;

                const renderContext = {
                    canvas,
                    canvasContext: context,
                    viewport: viewport,
                };
                await page.render(renderContext).promise;
                
                if (isCancelled) return;
                container.appendChild(canvas);
            }
        };

        void loadPdf();
        return () => {
            isCancelled = true;
            void loadingTask?.destroy();
            container.replaceChildren();
        };
    }, [pdfBlob]);

    return (
        <div className="flex flex-col items-center p-4">
            <div ref={containerRef} className="shadow-lg" />
        </div>
    );
};
