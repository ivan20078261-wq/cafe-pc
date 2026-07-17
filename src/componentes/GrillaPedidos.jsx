import { AnimatePresence, motion } from 'framer-motion'
import { Coffee, ChefHat } from 'lucide-react'
import TarjetaPedido from './TarjetaPedido'

function EstadoVacio() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center w-full gap-4 text-[#8B7A6A]/50"
    >
      <div className="relative">
        <div className="w-24 h-24 rounded-full bg-white/60 border-2 border-dashed border-[#DCCFC0] flex items-center justify-center">
          <Coffee size={40} strokeWidth={1} className="text-[#DCCFC0]" />
        </div>
        <motion.div
          className="absolute -top-1 -right-1"
          animate={{ rotate: [0, -15, 0, 15, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        >
          <ChefHat size={20} strokeWidth={1.5} className="text-amber-400/50" />
        </motion.div>
      </div>
      <div className="text-center">
        <p className="text-lg font-medium text-[#8B7A6A]/70">No hay pedidos activos</p>
        <p className="text-sm text-[#8B7A6A]/40 mt-1">Los nuevos pedidos aparecerán aquí</p>
      </div>
    </motion.div>
  )
}

function GrillaPedidos({ pedidos, tiemposTranscurridos, tiemposEstimados, onPreparar, onEntregar, onEliminar }) {
  return (
    <div className="flex-1 overflow-y-auto px-6 pb-6">
      <div className="grid grid-cols-[repeat(auto-fill,minmax(340px,1fr))] gap-4 pt-4 auto-rows-min">
        <AnimatePresence mode="popLayout">
          {pedidos.map((pedido) => (
            <TarjetaPedido
              key={pedido.id}
              pedido={pedido}
              tiempoTranscurrido={tiemposTranscurridos[pedido.id] ?? 0}
              tiempoEstimado={tiemposEstimados[pedido.id]}
              onPreparar={onPreparar}
              onEntregar={onEntregar}
              onEliminar={onEliminar}
            />
          ))}
        </AnimatePresence>
        {pedidos.length === 0 && (
          <div className="col-span-full flex items-center justify-center min-h-[60vh]">
            <EstadoVacio />
          </div>
        )}
      </div>
    </div>
  )
}

export default GrillaPedidos
