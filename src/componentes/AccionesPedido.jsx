import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CookingPot, CheckCircle2, Sparkles, Trash2, X, Ban } from 'lucide-react'

function AccionesPedido({ estado, puedeCancelar, onPreparar, onEntregar, onEliminar, onCancelar }) {
  const [confirmandoCancelar, setConfirmandoCancelar] = useState(false)
  const [motivo, setMotivo] = useState('')

  const puedeCancelarEstado = puedeCancelar && (estado === 'pendiente' || estado === 'preparando')

  function confirmarCancelar() {
    onCancelar(motivo.trim())
    setConfirmandoCancelar(false)
    setMotivo('')
  }

  return (
    <div className="mt-4">
      <div className="flex gap-2.5">
        {estado === 'pendiente' && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={onPreparar}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-3 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white text-sm font-semibold transition-all shadow-lg shadow-amber-200/50 cursor-pointer"
          >
            <CookingPot size={18} strokeWidth={1.5} />
            En preparación
          </motion.button>
        )}
        {estado === 'preparando' && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={onEntregar}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white text-sm font-semibold transition-all shadow-lg shadow-emerald-200/50 cursor-pointer"
          >
            <CheckCircle2 size={18} strokeWidth={1.5} />
            <Sparkles size={14} strokeWidth={1.5} className="text-emerald-200/80" />
            Entregar
          </motion.button>
        )}
        {estado === 'entregado' && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={onEliminar}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-3 rounded-xl bg-gradient-to-r from-gray-500 to-gray-400 hover:from-gray-400 hover:to-gray-300 text-white text-sm font-semibold transition-all shadow-lg shadow-gray-200/50 cursor-pointer"
          >
            <Trash2 size={18} strokeWidth={1.5} />
            Marcar libre
          </motion.button>
        )}
        {puedeCancelarEstado && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setConfirmandoCancelar((v) => !v)}
            className="flex items-center justify-center gap-1.5 px-3 py-3 rounded-xl border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 text-sm font-semibold transition-all cursor-pointer"
            title="Cancelar pedido"
          >
            <Ban size={16} strokeWidth={1.5} />
            Cancelar
          </motion.button>
        )}
      </div>

      <AnimatePresence>
        {confirmandoCancelar && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-2.5 p-3 rounded-xl bg-red-50/70 border border-red-200/70">
              <input
                type="text"
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                placeholder="Motivo de cancelación (opcional)"
                className="w-full px-3 py-2 rounded-lg border border-red-200 bg-white text-sm text-[#3D2B1F] focus:outline-none focus:ring-2 focus:ring-red-200"
                maxLength={200}
              />
              <div className="flex gap-2 mt-2">
                <button
                  onClick={confirmarCancelar}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white text-xs font-semibold transition-all cursor-pointer"
                >
                  <X size={13} strokeWidth={2} />
                  Confirmar cancelación
                </button>
                <button
                  onClick={() => { setConfirmandoCancelar(false); setMotivo('') }}
                  className="px-3 py-2 rounded-lg border border-[#E8DDD2] bg-white text-[#8B7A6A] text-xs font-semibold hover:text-[#3D2B1F] transition-all cursor-pointer"
                >
                  Volver
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default AccionesPedido