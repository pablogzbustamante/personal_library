import { useEffect, useState } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { ArrowLeft, ZoomIn, ZoomOut, Sun, Moon, PanelRight, PanelLeft, Clipboard } from 'lucide-react'
import { documentsApi } from '../api/documents'
import { useDocumentStore } from '../store/useDocumentStore'
import { useThemeStore } from '../store/useThemeStore'
import PDFViewer from '../components/PDFViewer/PDFViewer'
import ReaderSidebar from '../components/Reader/ReaderSidebar'

const SCALE_STEP = 0.15
const SCALE_MIN = 0.4
const SCALE_MAX = 2.5
const DEFAULT_SCALE = 0.85

export default function ReaderPage() {
  const { documentId } = useParams<{ documentId: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const { currentDocument, currentPage, totalPages, setCurrentDocument, setCurrentPage, setTotalPages } = useDocumentStore()
  const { dark, toggleDark } = useThemeStore()
  const [scale, setScale] = useState(DEFAULT_SCALE)
  const [sidebarSide, setSidebarSide] = useState<'left' | 'right'>('right')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleCopyReference = () => {
    if (!currentDocument?.reference) return
    navigator.clipboard.writeText(currentDocument.reference).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const navState = location.state as { page?: number; quote?: string } | null
  const searchText = navState?.quote

  useEffect(() => {
    if (!documentId) return
    documentsApi.get(documentId).then((doc) => {
      setCurrentDocument(doc)
      const jumpPage = navState?.page
      if (jumpPage) setCurrentPage(jumpPage)
    }).catch(() => navigate('/'))
    return () => setCurrentDocument(null)
  }, [documentId])

  useEffect(() => {
    if (!currentDocument || currentPage === currentDocument.last_page_read) return
    const timer = setTimeout(() => {
      const progress = totalPages > 0 ? currentPage / totalPages : 0
      documentsApi.update(currentDocument.id, { last_page_read: currentPage, progress: Math.min(1, progress) })
    }, 1500)
    return () => clearTimeout(timer)
  }, [currentPage, currentDocument, totalPages])

  if (!currentDocument) {
    return (
      <div className="flex items-center justify-center h-screen text-sm" style={{ background: 'var(--bg-page)', color: 'var(--text-faint)' }}>
        Cargando…
      </div>
    )
  }

  const fileUrl = documentsApi.fileUrl(currentDocument.id)

  return (
    <div className="flex flex-col h-screen" style={{ background: 'var(--bg-page)' }}>
      {/* Top bar */}
      <div className="flex items-center gap-3 px-4 py-2.5 shrink-0" style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)' }}>
        <button
          onClick={() => navigate('/')}
          className="p-1.5 rounded-lg transition-colors"
          style={{ color: 'var(--text-muted)' }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--hover-bg)' }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
        >
          <ArrowLeft size={16} />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{currentDocument.title}</p>
          {currentDocument.author && <p className="text-[11px]" style={{ color: 'var(--text-faint)' }}>{currentDocument.author}</p>}
        </div>
        {currentDocument.reference && (
          <button
            onClick={handleCopyReference}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] transition-colors shrink-0"
            style={{ border: '1px solid var(--border)', color: copied ? '#10B981' : 'var(--text-muted)', background: copied ? '#10B98111' : 'transparent' }}
            onMouseEnter={(e) => { if (!copied) (e.currentTarget as HTMLElement).style.background = 'var(--hover-bg)' }}
            onMouseLeave={(e) => { if (!copied) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
            title="Copiar cita APA"
          >
            <Clipboard size={12} />
            {copied ? 'Copiado' : 'Copiar fuente'}
          </button>
        )}
        <span className="text-xs" style={{ color: 'var(--text-faint)' }}>
          {totalPages > 0 ? `${currentPage} / ${totalPages}` : ''}
        </span>
        {/* Zoom controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setScale((s) => Math.max(SCALE_MIN, +(s - SCALE_STEP).toFixed(2)))}
            disabled={scale <= SCALE_MIN}
            className="p-1.5 rounded-lg transition-colors disabled:opacity-30"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--hover-bg)' }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
          >
            <ZoomOut size={15} />
          </button>
          <span className="text-xs w-9 text-center" style={{ color: 'var(--text-faint)' }}>{Math.round(scale * 100)}%</span>
          <button
            onClick={() => setScale((s) => Math.min(SCALE_MAX, +(s + SCALE_STEP).toFixed(2)))}
            disabled={scale >= SCALE_MAX}
            className="p-1.5 rounded-lg transition-colors disabled:opacity-30"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--hover-bg)' }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
          >
            <ZoomIn size={15} />
          </button>
          {/* Fit button */}
          <button
            onClick={() => setScale(DEFAULT_SCALE)}
            className="px-2 py-1 rounded-lg text-[11px] transition-colors"
            style={{ color: 'var(--text-muted)', border: '1px solid var(--border)' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--hover-bg)' }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
            title="Restablecer zoom"
          >
            Fit
          </button>
        </div>
        {/* Progress bar */}
        <div className="w-24 rounded-full" style={{ height: 3, background: 'var(--progress-track)' }}>
          <div
            className="h-full rounded-full bg-[#534AB7]"
            style={{ width: totalPages > 0 ? `${Math.round((currentPage / totalPages) * 100)}%` : '0%' }}
          />
        </div>
        {/* Dark mode toggle */}
        <button
          onClick={toggleDark}
          className="p-1.5 rounded-lg transition-colors"
          style={{ color: 'var(--text-muted)' }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--hover-bg)' }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
          title={dark ? 'Modo claro' : 'Modo oscuro'}
        >
          {dark ? <Sun size={15} /> : <Moon size={15} />}
        </button>

        {/* Sidebar side toggle */}
        <button
          onClick={() => setSidebarSide((s) => s === 'right' ? 'left' : 'right')}
          className="p-1.5 rounded-lg transition-colors"
          style={{ color: 'var(--text-muted)' }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--hover-bg)' }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
          title={`Mover panel a la ${sidebarSide === 'right' ? 'izquierda' : 'derecha'}`}
        >
          {sidebarSide === 'right' ? <PanelLeft size={15} /> : <PanelRight size={15} />}
        </button>

        {/* Sidebar open/close */}
        <button
          onClick={() => setSidebarOpen((v) => !v)}
          className="p-1.5 rounded-lg transition-colors"
          style={{ color: sidebarOpen ? '#534AB7' : 'var(--text-muted)', background: sidebarOpen ? 'var(--hover-bg)' : undefined }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--hover-bg)' }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = sidebarOpen ? 'var(--hover-bg)' : 'transparent' }}
          title="Marcadores"
        >
          {sidebarSide === 'right' ? <PanelRight size={15} /> : <PanelLeft size={15} />}
        </button>
      </div>

      {/* Body: sidebar + PDF */}
      <div className="flex flex-1 overflow-hidden">
        {sidebarOpen && sidebarSide === 'left' && (
          <ReaderSidebar
            documentId={currentDocument.id}
            currentPage={currentPage}
            side="left"
            onNavigate={setCurrentPage}
          />
        )}

        {/* PDF */}
        <div className="flex-1 overflow-y-auto py-6 px-16">
          <PDFViewer url={fileUrl} currentPage={currentPage} scale={scale} onPageChange={setCurrentPage} onTotalPages={setTotalPages} searchText={searchText} />
        </div>

        {sidebarOpen && sidebarSide === 'right' && (
          <ReaderSidebar
            documentId={currentDocument.id}
            currentPage={currentPage}
            side="right"
            onNavigate={setCurrentPage}
          />
        )}
      </div>
    </div>
  )
}
