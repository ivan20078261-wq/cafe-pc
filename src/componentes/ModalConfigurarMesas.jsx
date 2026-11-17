import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, QrCode, Printer, Minus, Plus, Check } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { supabase } from '../supabase'

const cartaBase = import.meta.env.VITE_CARTA_URL || window.location.origin

export default function ModalConfigurarMesas({ abierto, onCerrar, comercioId, slug }) {
  const [cantidad, setCantidad] = useState(1)
  const [guardado, setGuardado] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [menuCtx, setMenuCtx] = useState(null)
  const [copiado, setCopiado] = useState(false)
  const printRef = useRef(null)

  useEffect(() => {
    if (!abierto || !comercioId) return
    let activo = true
    supabase
      .from('mesas')
      .select('numero_mesa')
      .eq('comercio_id', comercioId)
      .then(({ data }) => {
        if (!activo) return
        const max = (data || []).reduce(
          (m, x) => Math.max(m, Number(x.numero_mesa) || 0),
          0,
        )
        if (max > 0) setCantidad(max)
      })
    return () => { activo = false }
  }, [abierto, comercioId])

  const mesasPreview = Array.from({ length: cantidad }, (_, i) => i + 1)
  const urlMesa = (num) => `${cartaBase}/${slug}/mesa/${num}`

  useEffect(() => {
    if (!menuCtx) return
    const cerrar = () => setMenuCtx(null)
    window.addEventListener('click', cerrar)
    window.addEventListener('contextmenu', cerrar)
    return () => {
      window.removeEventListener('click', cerrar)
      window.removeEventListener('contextmenu', cerrar)
    }
  }, [menuCtx])

  function abrirMenuCtx(e, num) {
    e.preventDefault()
    let x = e.clientX
    let y = e.clientY
    const mw = 260
    const mh = 200
    if (x + mw > window.innerWidth) x = window.innerWidth - mw - 12
    if (y + mh > window.innerHeight) y = window.innerHeight - mh - 12
    if (x < 8) x = 8
    if (y < 8) y = 8
    setMenuCtx({ x, y, num, url: urlMesa(num) })
    setCopiado(false)
  }

  async function copiarLink(url) {
    try {
      await navigator.clipboard.writeText(url)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = url
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
    }
    setCopiado(true)
    setTimeout(() => {
      setCopiado(false)
      setMenuCtx(null)
    }, 900)
  }

  async function guardarMesas() {
    if (!comercioId) return
    setGuardando(true)
    const { data: existentes } = await supabase
      .from('mesas')
      .select('numero_mesa')
      .eq('comercio_id', comercioId)

    const yaExistentes = new Set((existentes || []).map((x) => Number(x.numero_mesa)))
    const nuevas = []
    for (let n = 1; n <= cantidad; n++) {
      if (!yaExistentes.has(n)) {
        nuevas.push({ comercio_id: comercioId, numero_mesa: n })
      }
    }

    if (nuevas.length > 0) {
      const { error } = await supabase.from('mesas').insert(nuevas)
      if (error) {
        console.error('Error guardando mesas:', error)
        alert('No se pudieron guardar las mesas. Revisá la consola.')
        setGuardando(false)
        return
      }
    }
    setGuardando(false)
    setGuardado(true)
    setTimeout(() => setGuardado(false), 2500)
  }

  function imprimirTodos() {
    const node = printRef.current
    if (!node) return

    const iframe = document.createElement('iframe')
    iframe.style.position = 'fixed'
    iframe.style.left = '-9999px'
    iframe.style.top = '0'
    iframe.style.width = '1000px'
    iframe.style.height = '800px'
    iframe.style.border = '0'
    iframe.style.opacity = '0'
    document.body.appendChild(iframe)

    const doc = iframe.contentWindow.document
    doc.open()
    doc.write(`<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <title>Códigos QR - Mesas</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: system-ui, -apple-system, sans-serif; margin: 16px; color: #3D2B1F; }
    h1 { text-align: center; margin: 0 0 16px; font-size: 20px; }
    .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
    .card { border: 1px solid #E8DDD2; border-radius: 12px; padding: 16px; text-align: center; break-inside: avoid; }
    .label { margin-top: 8px; font-weight: 700; font-size: 14px; }
    .url { margin-top: 4px; font-size: 9px; color: #8B7A6A; word-break: break-all; }
    @media print {
      body { margin: 8mm; }
      .grid { gap: 12px; }
    }
  </style>
</head>
<body>
  <h1>Códigos QR — Mesas</h1>
  <div class="grid">${node.innerHTML}</div>
</body>
</html>`)
    doc.close()

    iframe.contentWindow.focus()
    setTimeout(() => {
      iframe.contentWindow.print()
      setTimeout(() => document.body.removeChild(iframe), 500)
    }, 400)
  }

  return (
    <AnimatePresence>
      {abierto && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 print:hidden"
            onClick={onCerrar}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="fixed inset-4 md:inset-auto md:top-[5%] md:left-1/2 md:-translate-x-1/2 md:w-[580px] md:max-h-[90vh] z-50 bg-white rounded-2xl border border-[#E8DDD2] shadow-2xl flex flex-col overflow-hidden print:hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#E8DDD2] bg-gradient-to-r from-amber-50/50 to-white">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-100/80 border border-amber-200/60 flex items-center justify-center text-amber-600">
                  <QrCode size={18} strokeWidth={1.5} />
                </div>
                <h2 className="text-lg font-bold text-[#3D2B1F]">Configurar Mesas</h2>
              </div>
              <button
                onClick={onCerrar}
                className="w-8 h-8 rounded-lg hover:bg-[#F5F0EB] flex items-center justify-center text-[#8B7A6A] hover:text-[#3D2B1F] transition-colors cursor-pointer"
                aria-label="Cerrar"
              >
                <X size={18} strokeWidth={1.5} />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="mb-6">
                <label className="block text-sm font-semibold text-[#3D2B1F] mb-2">
                  Cantidad de mesas
                </label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setCantidad(Math.max(1, cantidad - 1))}
                    className="w-10 h-10 rounded-xl border border-[#E8DDD2] bg-[#FAF7F2] flex items-center justify-center text-[#3D2B1F] text-lg font-semibold hover:border-amber-300 transition-colors cursor-pointer"
                    aria-label="Disminuir cantidad de mesas"
                  >
                    <Minus size={16} />
                  </button>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={cantidad}
                    onChange={(e) => setCantidad(Math.max(1, Math.min(50, parseInt(e.target.value) || 1)))}
                    className="w-20 h-10 text-center text-xl font-bold text-[#3D2B1F] border border-[#E8DDD2] rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-200 focus:border-amber-300"
                  />
                  <button
                    onClick={() => setCantidad(Math.min(50, cantidad + 1))}
                    className="w-10 h-10 rounded-xl border border-[#E8DDD2] bg-[#FAF7F2] flex items-center justify-center text-[#3D2B1F] text-lg font-semibold hover:border-amber-300 transition-colors cursor-pointer"
                    aria-label="Aumentar cantidad de mesas"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>

              {/* Preview de QRs */}
              <div>
                <label className="block text-sm font-semibold text-[#3D2B1F] mb-3">
                  Vista previa
                </label>
                <div className="grid grid-cols-4 gap-3">
                  {mesasPreview.map((num) => (
                    <div
                      key={num}
                      className="flex flex-col items-center p-3 rounded-xl border border-[#E8DDD2] bg-[#FAF7F2]/50"
                      onContextMenu={(e) => abrirMenuCtx(e, num)}
                      title={urlMesa(num)}
                    >
                      <div className="w-24 h-24 bg-white rounded-lg border border-[#E8DDD2] flex items-center justify-center mb-2 p-1 cursor-context-menu">
                        <QRCodeSVG value={urlMesa(num)} size={88} level="M" />
                      </div>
                      <span className="text-xs font-semibold text-[#3D2B1F]">Mesa {num}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-[#E8DDD2] bg-[#FAF7F2]/50">
              <button
                onClick={imprimirTodos}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-[#E8DDD2] bg-white text-[#8B7A6A] text-sm font-semibold hover:text-[#3D2B1F] hover:border-[#DCCFC0] transition-all cursor-pointer"
              >
                <Printer size={16} strokeWidth={1.5} />
                Imprimir todos
              </button>
              <div className="flex items-center gap-2.5">
                <button
                  onClick={onCerrar}
                  className="px-4 py-2.5 rounded-xl border border-[#E8DDD2] bg-white text-[#8B7A6A] text-sm font-semibold hover:text-[#3D2B1F] hover:border-[#DCCFC0] transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  onClick={guardarMesas}
                  disabled={!comercioId || guardando}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white text-sm font-semibold transition-all shadow-lg shadow-amber-200/50 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                >
                  {guardado ? (
                    <>
                      <Check size={16} /> Guardadas
                    </>
                  ) : guardando ? (
                    'Guardando...'
                  ) : (
                    'Guardar mesas'
                  )}
                </button>
              </div>
            </div>
          </motion.div>

          {/* Area imprimible: se usa para la ventana de impresión */}
          <div ref={printRef} className="hidden" aria-hidden="true">
            <div className="grid grid-cols-4 gap-4 p-8">
              {mesasPreview.map((num) => (
                <div key={num} className="flex flex-col items-center border border-[#E8DDD2] rounded-xl p-4">
                  <QRCodeSVG value={urlMesa(num)} size={180} level="M" />
                  <span className="mt-2 text-sm font-bold text-[#3D2B1F]">Mesa {num}</span>
                  <span className="mt-1 text-[9px] text-[#8B7A6A] break-all">{urlMesa(num)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Menú contextual (click derecho) */}
          {menuCtx && (
            <div
              className="fixed z-[60] w-[260px] bg-white/95 backdrop-blur-sm border border-[#E8DDD2] rounded-2xl shadow-2xl overflow-hidden transition-all duration-150"
              style={{ left: menuCtx.x, top: menuCtx.y }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-4 py-3 bg-gradient-to-r from-amber-50/80 to-white border-b border-[#E8DDD2]">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-amber-100 border border-amber-200/60 flex items-center justify-center text-amber-600">
                    <QrCode size={14} strokeWidth={1.5} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-[#3D2B1F]">Mesa {menuCtx.num}</p>
                    <p className="text-[10px] text-[#8B7A6A] truncate">{menuCtx.url}</p>
                  </div>
                </div>
              </div>
              <div className="p-1.5">
                <button
                  onClick={() => copiarLink(menuCtx.url)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-[#3D2B1F] hover:bg-[#F5F0EB] rounded-xl transition-colors cursor-pointer"
                >
                  <span className="w-6 h-6 rounded-lg bg-[#FAF7F2] border border-[#E8DDD2] flex items-center justify-center text-[#8B7A6A]">
                    {copiado ? <Check size={13} className="text-emerald-600" /> : <span className="text-xs">📋</span>}
                  </span>
                  {copiado ? '¡Copiado!' : 'Copiar link'}
                </button>
                <button
                  onClick={() => { window.open(menuCtx.url, '_blank', 'noopener'); setMenuCtx(null) }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-[#3D2B1F] hover:bg-[#F5F0EB] rounded-xl transition-colors cursor-pointer"
                >
                  <span className="w-6 h-6 rounded-lg bg-[#FAF7F2] border border-[#E8DDD2] flex items-center justify-center text-[#8B7A6A] text-xs">
                    🔗
                  </span>
                  Abrir en nueva pestaña
                </button>
                <button
                  onClick={() => { imprimirTodos(); setMenuCtx(null) }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-[#3D2B1F] hover:bg-[#F5F0EB] rounded-xl transition-colors cursor-pointer"
                >
                  <span className="w-6 h-6 rounded-lg bg-[#FAF7F2] border border-[#E8DDD2] flex items-center justify-center text-[#8B7A6A]">
                    <Printer size={13} strokeWidth={1.5} />
                  </span>
                  Imprimir todos
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </AnimatePresence>
  )
}