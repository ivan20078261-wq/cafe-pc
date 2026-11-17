import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Coffee, Table, ChevronLeft, ShoppingBag } from 'lucide-react'
import { supabase } from '../supabase'
import SelectorModificadores from './SelectorModificadores'

export default function ModalNuevoPedido({ abierto, comercioId, onCerrar, onCrear }) {
  const [productos, setProductos] = useState([])
  const [categorias, setCategorias] = useState([])
  const [categoriaActiva, setCategoriaActiva] = useState('')
  const [mesa, setMesa] = useState('')
  const [notas, setNotas] = useState('')
  const [itemsCarrito, setItemsCarrito] = useState([])

  const [seleccionado, setSeleccionado] = useState(null)
  const [modifierData, setModifierData] = useState({ modificadores: [], precioExtra: 0 })
  const [cantidad, setCantidad] = useState(1)

  useEffect(() => {
    if (!abierto || !comercioId) return
    async function cargar() {
      const { data } = await supabase
        .from('productos')
        .select('*')
        .eq('comercio_id', comercioId)
        .order('nombre', { ascending: true })

      if (data) {
        setProductos(data)
        const cats = [...new Set(data.map((p) => p.categoria))]
        setCategorias(cats)
      }
    }
    cargar()
  }, [abierto, comercioId])

  useEffect(() => {
    if (categorias.length > 0) {
      setCategoriaActiva((prev) => prev || categorias[0])
    }
  }, [categorias])

  function reset() {
    setMesa('')
    setItemsCarrito([])
    setNotas('')
    setSeleccionado(null)
    setCantidad(1)
    setModifierData({ modificadores: [], precioExtra: 0 })
  }

  function seleccionarProducto(producto) {
    setSeleccionado(producto)
    setModifierData({ modificadores: [], precioExtra: 0 })
    setCantidad(1)
  }

  function agregarAlCarrito() {
    if (!seleccionado) return

    const precioUnitario = seleccionado.precio_base + modifierData.precioExtra

    setItemsCarrito((prev) => [
      ...prev,
      {
        id: `${seleccionado.id}-${Date.now()}`,
        nombre: seleccionado.nombre,
        modificadores: modifierData.modificadores,
        precioUnitario,
        cantidad,
        total: precioUnitario * cantidad,
      },
    ])
    setSeleccionado(null)
    setCantidad(1)
    setModifierData({ modificadores: [], precioExtra: 0 })
  }

  function eliminarDelCarrito(id) {
    setItemsCarrito((prev) => prev.filter((i) => i.id !== id))
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!mesa || itemsCarrito.length === 0) return

    const pedido = {
      mesa: parseInt(mesa),
      productos: itemsCarrito.map((i) => ({
        nombre: i.nombre,
        modificadores: i.modificadores.map((m) => ({
          grupo: m.grupo,
          nombre: m.nombre,
          precio_adicional: m.precio_adicional,
        })),
        precio: i.precioUnitario,
        cantidad: i.cantidad,
      })),
      notas: notas.trim(),
      estado: 'pendiente',
      creadoEn: Date.now(),
    }
    onCrear(pedido)
    reset()
    onCerrar()
  }

  function handleCerrar() {
    reset()
    onCerrar()
  }

  const totalGeneral = itemsCarrito.reduce((s, i) => s + i.total, 0)

  return (
    <AnimatePresence>
      {abierto && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
            onClick={handleCerrar}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="fixed inset-4 md:inset-auto md:top-[5%] md:left-1/2 md:-translate-x-1/2 md:w-[620px] md:max-h-[90vh] z-50 bg-white rounded-2xl border border-[#E8DDD2] shadow-2xl flex flex-col overflow-hidden"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#E8DDD2] bg-gradient-to-r from-amber-50/50 to-white">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-100/80 border border-amber-200/60 flex items-center justify-center text-amber-600">
                  <Coffee size={18} strokeWidth={1.5} />
                </div>
                <h2 className="text-lg font-bold text-[#3D2B1F]">Nuevo pedido</h2>
              </div>
              <button
                onClick={handleCerrar}
                className="w-8 h-8 rounded-lg hover:bg-[#F5F0EB] flex items-center justify-center text-[#8B7A6A] hover:text-[#3D2B1F] transition-colors cursor-pointer"
              >
                <X size={18} strokeWidth={1.5} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
              <div className="p-4 pb-0">
                <label className="flex items-center gap-1.5 text-sm font-semibold text-[#3D2B1F] mb-1.5">
                  <Table size={14} strokeWidth={1.5} className="text-amber-600" />
                  Mesa
                </label>
                <select
                  value={mesa}
                  onChange={(e) => setMesa(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8DDD2] bg-white text-[#3D2B1F] text-sm focus:outline-none focus:ring-2 focus:ring-amber-200 focus:border-amber-300 appearance-none cursor-pointer"
                  required
                >
                  <option value="">Seleccionar mesa...</option>
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i + 1} value={i + 1}>Mesa {i + 1}</option>
                  ))}
                </select>
              </div>

              <div className="flex-1 flex flex-col overflow-hidden">
                {seleccionado ? (
                  <div className="flex-1 flex flex-col overflow-hidden">
                    <div className="flex items-center gap-2 px-4 pt-3 pb-1">
                      <button
                        type="button"
                        onClick={() => setSeleccionado(null)}
                        className="flex items-center gap-1 text-xs font-medium text-[#8B7A6A] hover:text-[#3D2B1F] transition-colors cursor-pointer"
                      >
                        <ChevronLeft size={14} />
                        Volver
                      </button>
                    </div>

                    <div className="flex-1 overflow-y-auto px-4 py-2 space-y-4">
                      <div>
                        <h3 className="text-base font-bold text-[#3D2B1F]">{seleccionado.nombre}</h3>
                        <p className="text-xs text-[#8B7A6A] mt-0.5">{seleccionado.descripcion}</p>
                      </div>

                      <SelectorModificadores
                        productoId={seleccionado.id}
                        onChange={setModifierData}
                      />

                      <div>
                        <div className="text-sm font-semibold text-[#3D2B1F] mb-2">Cantidad</div>
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => setCantidad(Math.max(1, cantidad - 1))}
                            className="w-10 h-10 rounded-xl border border-[#E8DDD2] bg-[#FAF7F2] flex items-center justify-center text-[#3D2B1F] text-lg font-semibold hover:border-amber-300 transition-colors cursor-pointer"
                          >
                            −
                          </button>
                          <span className="w-10 text-center text-xl font-bold text-[#3D2B1F] tabular-nums">
                            {cantidad}
                          </span>
                          <button
                            type="button"
                            onClick={() => setCantidad(Math.min(99, cantidad + 1))}
                            className="w-10 h-10 rounded-xl border border-[#E8DDD2] bg-[#FAF7F2] flex items-center justify-center text-[#3D2B1F] text-lg font-semibold hover:border-amber-300 transition-colors cursor-pointer"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={agregarAlCarrito}
                        className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 text-white text-sm font-semibold hover:from-amber-500 hover:to-amber-400 transition-all shadow-lg shadow-amber-200/50 cursor-pointer flex items-center justify-center gap-2"
                      >
                        <ShoppingBag size={16} />
                        Agregar al pedido
                        {modifierData.precioExtra > 0 && (
                          <span className="text-amber-200 text-xs">
                            (+${modifierData.precioExtra})
                          </span>
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col overflow-hidden">
                    <div className="flex gap-1.5 px-4 pt-3 pb-2 overflow-x-auto scrollbar-none">
                      {categorias.map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setCategoriaActiva(cat)}
                          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                            cat === categoriaActiva
                              ? 'bg-amber-600 text-white shadow-md shadow-amber-200'
                              : 'bg-[#FAF7F2] text-[#8B7A6A] border border-[#E8DDD2] hover:border-amber-300'
                          }`}
                        >
                          {cat.charAt(0).toUpperCase() + cat.slice(1)}
                        </button>
                      ))}
                    </div>

                    <div className="flex-1 overflow-y-auto px-4 py-2 space-y-1">
                      {productos
                        .filter((p) => p.categoria === categoriaActiva)
                        .map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => seleccionarProducto(p)}
                            className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-[#FAF7F2]/50 border border-[#E8DDD2] hover:border-amber-300 hover:bg-amber-50/30 transition-all cursor-pointer text-left"
                          >
                            <div className="min-w-0 mr-3">
                              <div className="text-sm font-semibold text-[#3D2B1F]">{p.nombre}</div>
                              <div className="text-[11px] text-[#8B7A6A] truncate mt-0.5">{p.descripcion}</div>
                            </div>
                            <div className="text-sm font-bold text-[#3D2B1F] shrink-0">
                              ${Number(p.precio_base).toLocaleString('es-AR')}
                            </div>
                          </button>
                        ))}
                      {productos.filter((p) => p.categoria === categoriaActiva).length === 0 && (
                        <div className="text-center py-8 text-xs text-[#DCCFC0]">Sin productos en esta categoría</div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {itemsCarrito.length > 0 && (
                <div className="border-t border-[#E8DDD2] bg-[#FAF7F2]/50">
                  <div className="max-h-32 overflow-y-auto px-4 py-2 space-y-1.5">
                    {itemsCarrito.map((item) => (
                      <div key={item.id} className="flex items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-2 min-w-0">
                          <button
                            type="button"
                            onClick={() => eliminarDelCarrito(item.id)}
                            className="w-5 h-5 rounded hover:bg-red-50 flex items-center justify-center text-red-400 hover:text-red-600 shrink-0 cursor-pointer"
                          >
                            <X size={10} />
                          </button>
                          <span className="font-medium text-[#3D2B1F] truncate">
                            {item.cantidad}x {item.nombre}
                          </span>
                          {item.modificadores.length > 0 && (
                            <span className="text-[#8B7A6A] hidden sm:inline truncate max-w-[120px]">
                              · {item.modificadores.map((m) => m.nombre).join(', ')}
                            </span>
                          )}
                        </div>
                        <span className="font-semibold text-[#3D2B1F] shrink-0">${item.total}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between px-4 py-2 border-t border-[#E8DDD2]">
                    <span className="text-xs text-[#8B7A6A]">Total</span>
                    <span className="text-base font-bold text-[#3D2B1F]">${totalGeneral.toLocaleString('es-AR')}</span>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5 px-4 py-3 border-t border-[#E8DDD2] bg-white">
                <button
                  type="button"
                  onClick={handleCerrar}
                  className="px-4 py-2.5 rounded-xl border border-[#E8DDD2] bg-white text-[#8B7A6A] text-sm font-semibold hover:text-[#3D2B1F] hover:border-[#DCCFC0] transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!mesa || itemsCarrito.length === 0}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 disabled:from-[#E8DDD2] disabled:to-[#E8DDD2] disabled:text-[#DCCFC0] text-white text-sm font-semibold transition-all shadow-lg shadow-amber-200/50 disabled:shadow-none cursor-pointer disabled:cursor-not-allowed"
                >
                  Crear pedido ({itemsCarrito.length} {itemsCarrito.length === 1 ? 'item' : 'items'})
                </button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
