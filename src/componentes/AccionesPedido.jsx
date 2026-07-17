import { motion } from 'framer-motion'
import { CookingPot, CheckCircle2, Sparkles, Trash2 } from 'lucide-react'

function AccionesPedido({ estado, onPreparar, onEntregar, onEliminar }) {
  return (
    <div className="mt-4 flex gap-2.5">
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
    </div>
  )
}

export default AccionesPedido
