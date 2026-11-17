import { motion, AnimatePresence } from 'framer-motion'
import { X, Timer, ChefHat, AlertTriangle, Coffee, Table, ShoppingBag } from 'lucide-react'
import AccionesPedido from './AccionesPedido'
import NotasEspeciales from './NotasEspeciales'

function formatearTiempo(segundos) {
  if (segundos < 60) return `${segundos}s`
  const mins = Math.floor(segundos / 60)
  const segs = segundos % 60
  return `${mins}m ${segs}s`
}

function ModalDetalleMesa({ mesa, pedidos, tiemposTranscurridos, onPreparar, onEntregar, onEliminar, onCerrar }) {
  if (!mesa) return null

  const totalItems = pedidos.reduce((sum, p) => sum + p.productos.reduce((s, prod) => s + (prod.cantidad ?? 1), 0), 0)

  return (
    <AnimatePresence>
      {mesa && (
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
            className="fixed inset-4 md:inset-auto md:top-[5%] md:left-1/2 md:-translate-x-1/2 md:w-[520px] md:max-h-[85vh] z-50 bg-white rounded-2xl border border-[#E8DDD2] shadow-2xl flex flex-col overflow-hidden"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#E8DDD2] bg-gradient-to-r from-amber-50/50 to-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100/80 border border-amber-200/60 flex items-center justify-center text-amber-600">
                  <Table size={20} strokeWidth={1.5} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[#3D2B1F]">Mesa {mesa}</h2>
                  <div className="flex items-center gap-2 text-xs text-[#8B7A6A]">
                    <span>{pedidos.length} {pedidos.length === 1 ? 'pedido' : 'pedidos'}</span>
                    <span className="w-1 h-1 rounded-full bg-[#DCCFC0]" />
                    <span>{totalItems} {totalItems === 1 ? 'item' : 'items'}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={onCerrar}
                className="w-8 h-8 rounded-lg hover:bg-[#F5F0EB] flex items-center justify-center text-[#8B7A6A] hover:text-[#3D2B1F] transition-colors cursor-pointer"
              >
                <X size={18} strokeWidth={1.5} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {pedidos.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-[#8B7A6A]/50">
                  <Coffee size={32} strokeWidth={1} className="text-[#DCCFC0]" />
                  <p className="mt-2 text-sm font-medium">No hay pedidos activos en esta mesa</p>
                </div>
              ) : (
                pedidos.map((pedido) => {
                  const tiempo = tiemposTranscurridos[pedido.id] ?? 0
                  const estaPreparando = pedido.estado === 'preparando'
                  const esUrgente = pedido.estado === 'pendiente' && tiempo >= 7 * 60

                  return (
                    <div
                      key={pedido.id}
                      className={`rounded-xl border p-4 ${
                        esUrgente
                          ? 'border-red-200 bg-red-50/60'
                          : estaPreparando
                            ? 'border-amber-300 bg-amber-50/80'
                            : 'border-[#E8DDD2] bg-[#FAF7F2]/50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-[#8B7A6A] uppercase tracking-wider">{pedido.id}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                            estaPreparando
                              ? 'bg-amber-100 text-amber-700 border-amber-200'
                              : esUrgente
                                ? 'bg-red-100 text-red-700 border-red-200'
                                : 'bg-[#E8DDD2]/50 text-[#8B7A6A] border-[#DCCFC0]'
                          }`}>
                            {estaPreparando ? 'Preparando' : esUrgente ? 'Urgente' : 'Pendiente'}
                          </span>
                        </div>
                        <div className={`flex items-center gap-1 text-xs font-mono tabular-nums ${
                          esUrgente ? 'text-red-500' : estaPreparando ? 'text-amber-600' : 'text-[#8B7A6A]'
                        }`}>
                          {estaPreparando && <ChefHat size={12} strokeWidth={1.5} className="animate-bounce" />}
                          {esUrgente && <AlertTriangle size={12} strokeWidth={1.5} />}
                          <Timer size={12} strokeWidth={1.5} />
                          {formatearTiempo(tiempo)}
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        {pedido.productos.map((prod, i) => (
                          <div key={i} className="flex items-start gap-2">
                            <div className="mt-0.5 w-5 h-5 rounded bg-amber-100/60 flex items-center justify-center shrink-0">
                              <Coffee size={10} strokeWidth={1.5} className="text-amber-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-baseline gap-1.5">
                                <span className="text-sm font-medium text-[#3D2B1F]">{prod.nombre}</span>
                                {prod.cantidad > 1 && (
                                  <span className="text-[10px] font-bold bg-amber-200/70 text-amber-800 px-1.5 rounded-full">x{prod.cantidad}</span>
                                )}
                              </div>
                              {prod.modificadores?.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-0.5">
                                  {prod.modificadores.map((mod, mi) => (
                                    <span key={mi} className="inline-flex items-center gap-1 text-[10px] text-[#8B7A6A] bg-white/60 px-1.5 py-0.5 rounded-full border border-[#E8DDD2]">
                                      {typeof mod === 'string' ? mod : mod.nombre}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      <NotasEspeciales notas={pedido.notas} />

                      <AccionesPedido
                        estado={pedido.estado}
                        onPreparar={() => onPreparar(pedido.id)}
                        onEntregar={() => onEntregar(pedido.id)}
                        onEliminar={() => onEliminar(pedido.id)}
                      />
                    </div>
                  )
                })
              )}
            </div>

            {pedidos.length > 0 && (
              <div className="flex items-center justify-between px-6 py-3.5 border-t border-[#E8DDD2] bg-[#FAF7F2]/50 text-sm">
                <div className="flex items-center gap-2 text-[#8B7A6A]">
                  <ShoppingBag size={14} strokeWidth={1.5} />
                  <span>{pedidos.length} {pedidos.length === 1 ? 'pedido' : 'pedidos'}</span>
                </div>
                <div className="flex items-center gap-2 text-[#8B7A6A]">
                  <Coffee size={14} strokeWidth={1.5} />
                  <span>{totalItems} {totalItems === 1 ? 'item' : 'items'}</span>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export default ModalDetalleMesa
