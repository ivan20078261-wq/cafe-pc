import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, QrCode, Printer, Minus, Plus } from 'lucide-react'

export default function ModalConfigurarMesas({ abierto, onCerrar, comercioId, slug }) {
  const [cantidad, setCantidad] = useState(1)

  if (!abierto) return null

  const mesasPreview = Array.from({ length: cantidad }, (_, i) => i + 1)

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
        onClick={onCerrar}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="fixed inset-4 md:inset-auto md:top-[5%] md:left-1/2 md:-translate-x-1/2 md:w-[580px] md:max-h-[90vh] z-50 bg-white rounded-2xl border border-[#E8DDD2] shadow-2xl flex flex-col overflow-hidden"
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
          >
            <X size={18} strokeWidth={1.5} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Input de cantidad */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-[#3D2B1F] mb-2">
              Cantidad de mesas
            </label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setCantidad(Math.max(1, cantidad - 1))}
                className="w-10 h-10 rounded-xl border border-[#E8DDD2] bg-[#FAF7F2] flex items-center justify-center text-[#3D2B1F] text-lg font-semibold hover:border-amber-300 transition-colors cursor-pointer"
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
                  className="flex flex-col items-center p-3 rounded-xl border border-[#E8DDD2] bg-[#FAF7F2]/50 hover:border-amber-300 transition-colors"
                >
                  <div className="w-20 h-20 bg-white rounded-lg border border-[#E8DDD2] flex items-center justify-center mb-2">
                    <QrCode size={40} strokeWidth={1} className="text-[#DCCFC0]" />
                  </div>
                  <span className="text-xs font-semibold text-[#3D2B1F]">Mesa {num}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-[#E8DDD2] bg-[#FAF7F2]/50">
          <button className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-[#E8DDD2] bg-white text-[#8B7A6A] text-sm font-semibold hover:text-[#3D2B1F] hover:border-[#DCCFC0] transition-all cursor-pointer">
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
            <button className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white text-sm font-semibold transition-all shadow-lg shadow-amber-200/50 cursor-pointer">
              Guardar mesas
            </button>
          </div>
        </div>
      </motion.div>
    </>
  )
}
