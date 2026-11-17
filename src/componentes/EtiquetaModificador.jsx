import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'

function EtiquetaModificador({ texto }) {
  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-amber-100/80 text-amber-700 border border-amber-200/60 whitespace-nowrap shadow-sm"
    >
      <Sparkles size={10} strokeWidth={1.5} className="text-amber-400" />
      {texto}
    </motion.span>
  )
}

export default EtiquetaModificador
