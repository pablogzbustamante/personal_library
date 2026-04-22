import { useState, useCallback, useMemo, useRef } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString()

interface PDFViewerProps {
  url: string
  currentPage: number
  scale: number
  onPageChange: (page: number) => void
  onTotalPages: (total: number) => void
  searchText?: string
}

function applyQuoteHighlight(quote: string): boolean {
  const container = document.querySelector('.react-pdf__Page__textContent')
  if (!container) return false

  const spans = Array.from(container.querySelectorAll('span')) as HTMLSpanElement[]
  const normQuote = quote.replace(/\s+/g, ' ').trim().toLowerCase()
  if (!normQuote) return false

  // Build concatenated text with span boundary tracking
  let text = ''
  const boundaries: { span: HTMLSpanElement; start: number; end: number }[] = []
  for (const span of spans) {
    const t = (span.textContent ?? '').replace(/\s+/g, ' ')
    if (!t) continue
    boundaries.push({ span, start: text.length, end: text.length + t.length })
    text += t
  }

  const idx = text.toLowerCase().indexOf(normQuote)
  if (idx === -1) return false

  const endIdx = idx + normQuote.length
  for (const b of boundaries) {
    if (b.start < endIdx && b.end > idx) {
      b.span.style.background = 'rgba(255, 210, 0, 0.45)'
      b.span.style.borderRadius = '2px'
      b.span.style.outline = '1px solid rgba(200, 160, 0, 0.4)'
    }
  }

  // Scroll the first highlighted span into view
  const first = boundaries.find((b) => b.start < endIdx && b.end > idx)
  first?.span.scrollIntoView({ behavior: 'smooth', block: 'center' })

  return true
}

export default function PDFViewer({
  url,
  currentPage,
  scale,
  onPageChange,
  onTotalPages,
  searchText,
}: PDFViewerProps) {
  const [containerWidth, setContainerWidth] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const searchTextRef = useRef(searchText)
  searchTextRef.current = searchText

  const containerRef = useCallback((node: HTMLDivElement | null) => {
    if (node) setContainerWidth(node.clientWidth)
  }, [])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fileProp = useMemo<any>(
    () => ({ url, httpHeaders: { Authorization: `Bearer ${localStorage.getItem('folio_token') ?? ''}` } }),
    [url],
  )

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setTotalPages(numPages)
    onTotalPages(numPages)
  }

  const handleRenderSuccess = useCallback(() => {
    const text = searchTextRef.current
    if (!text) return
    // The text layer renders shortly after the page canvas
    setTimeout(() => applyQuoteHighlight(text), 200)
  }, [])

  const baseWidth = containerWidth > 0 ? Math.min(containerWidth - 48, 800) : 700

  return (
    <div ref={containerRef} className="flex flex-col items-center w-full">
      <Document
        file={fileProp}
        onLoadSuccess={onDocumentLoadSuccess}
        onLoadError={(err) => console.error('PDF load error:', err)}
        loading={
          <div className="flex items-center justify-center h-64 text-[#bbb] text-sm">
            Cargando PDF…
          </div>
        }
        error={
          <div className="flex items-center justify-center h-64 text-red-400 text-sm">
            Error al cargar el PDF.
          </div>
        }
      >
        {/* Page wrapper with side arrows */}
        <div className="relative flex items-center">
          {/* Prev arrow */}
          <button
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage <= 1}
            className="absolute -left-12 z-10 flex items-center justify-center w-9 h-9 rounded-full bg-black/20 hover:bg-black/35 text-white disabled:opacity-0 transition-all backdrop-blur-sm"
            style={{ top: '50%', transform: 'translateY(-50%)' }}
          >
            <ChevronLeft size={20} />
          </button>

          <Page
            pageNumber={currentPage}
            width={baseWidth * scale}
            renderTextLayer
            renderAnnotationLayer={false}
            onRenderSuccess={handleRenderSuccess}
          />

          {/* Next arrow */}
          <button
            onClick={() => onPageChange(Math.min(totalPages || Infinity, currentPage + 1))}
            disabled={totalPages > 0 && currentPage >= totalPages}
            className="absolute -right-12 z-10 flex items-center justify-center w-9 h-9 rounded-full bg-black/20 hover:bg-black/35 text-white disabled:opacity-0 transition-all backdrop-blur-sm"
            style={{ top: '50%', transform: 'translateY(-50%)' }}
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </Document>
    </div>
  )
}
