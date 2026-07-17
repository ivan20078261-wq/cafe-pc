import { useEffect, useState, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Coffee, Clock, Loader2, ShoppingBag, Plus, Minus, Check, X, Package, Sparkles } from 'lucide-react'
import { supabase } from '../supabase'
import SelectorModificadores from './SelectorModificadores'

function generarKey(productoId, modificadores) {
  const ids = modificadores.map((m) => m.opcion_id).sort().join(',')
  return `${productoId}-${ids}`
}

export default function ClientMenu() {
  const { comercio_slug, numero_mesa } = useParams()
  const [productos, setProductos] = useState([])
  const [comercio, setComercio] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [cart, setCart] = useState([])
  const [enviando, setEnviando] = useState(false)
  const [pedidoId, setPedidoId] = useState(null)
  const [pedidoEstado, setPedidoEstado] = useState(null)
  const [cartAbierto, setCartAbierto] = useState(false)
  const [productoParaModificar, setProductoParaModificar] = useState(null)
  const [modifierData, setModifierData] = useState({ modificadores: [], precioExtra: 0 })
  const [cantidadMod, setCantidadMod] = useState(1)
  const [productosConMods, setProductosConMods] = useState(new Set())
  const mesaIdRef = useRef(null)

  useEffect(() => {
    async function cargar() {
      const { data: comercioData } = await supabase
        .from('comercios')
        .select('id, nombre, color_primario')
        .eq('slug', comercio_slug)
        .single()

      if (!comercioData) {
        setCargando(false)
        return
      }
      setComercio(comercioData)

      const { data: mesaData } = await supabase
        .from('mesas')
        .select('id')
        .eq('comercio_id', comercioData.id)
        .eq('numero_mesa', parseInt(numero_mesa))
        .single()

      if (mesaData) {
        mesaIdRef.current = mesaData.id
      }

      const { data: items } = await supabase
        .from('productos')
        .select('*')
        .eq('comercio_id', comercioData.id)
        .order('nombre')

      if (items) {
        setProductos(items)
        const ids = items.map((p) => p.id)
        const { data: rels } = await supabase
          .from('producto_modificador')
          .select('producto_id')
          .in('producto_id', ids)
        const conMods = new Set((rels || []).map((r) => r.producto_id))
        setProductosConMods(conMods)
      }
      setCargando(false)
    }
    cargar()
  }, [comercio_slug, numero_mesa])

  useEffect(() => {
    if (!pedidoId) return
    const canal = supabase
      .channel(`pedido-${pedidoId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'pedidos', filter: `id=eq.${pedidoId}` },
        (payload) => {
          setPedidoEstado(payload.new.estado)
        }
      )
      .subscribe()
    return () => supabase.removeChannel(canal)
  }, [pedidoId])

  function handleClickProducto(producto) {
    if (productosConMods.has(producto.id)) {
      setProductoParaModificar(producto)
      setModifierData({ modificadores: [], precioExtra: 0 })
      setCantidadMod(1)
    } else {
      addToCartSimple(producto)
    }
  }

  function addToCartSimple(producto) {
    setCart((prev) => {
      const key = `${producto.id}-`
      const existing = prev.find((i) => i.key === key)
      if (existing) {
        return prev.map((i) =>
          i.key === key ? { ...i, cantidad: i.cantidad + 1 } : i
        )
      }
      return [
        ...prev,
        {
          key,
          producto_id: producto.id,
          nombre: producto.nombre,
          precio: Number(producto.precio_base),
          cantidad: 1,
          modificadores: [],
        },
      ]
    })
  }

  function agregarConModificadores() {
    if (!productoParaModificar) return
    const key = generarKey(productoParaModificar.id, modifierData.modificadores)
    setCart((prev) => {
      const existing = prev.find((i) => i.key === key)
      if (existing) {
        return prev.map((i) =>
          i.key === key ? { ...i, cantidad: i.cantidad + cantidadMod } : i
        )
      }
      return [
        ...prev,
        {
          key,
          producto_id: productoParaModificar.id,
          nombre: productoParaModificar.nombre,
          precio: Number(productoParaModificar.precio_base) + modifierData.precioExtra,
          cantidad: cantidadMod,
          modificadores: modifierData.modificadores,
        },
      ]
    })
    setProductoParaModificar(null)
  }

  function updateQuantity(key, delta) {
    setCart((prev) =>
      prev
        .map((i) =>
          i.key === key ? { ...i, cantidad: i.cantidad + delta } : i
        )
        .filter((i) => i.cantidad > 0)
    )
  }

  async function sendOrder() {
    if (!comercio || !mesaIdRef.current || cart.length === 0) return
    setEnviando(true)
    try {
      const { data, error } = await supabase
        .from('pedidos')
        .insert({
          comercio_id: comercio.id,
          mesa_id: mesaIdRef.current,
          items: cart.map((i) => ({
            nombre: i.nombre,
            cantidad: i.cantidad,
            precio: i.precio,
            modificadores: i.modificadores.map((m) => ({
              grupo: m.grupo,
              nombre: m.nombre,
              precio_adicional: m.precio_adicional,
            })),
          })),
          total: totalGeneral,
          estado: 'pendiente',
        })
        .select('id')
        .single()

      if (error) throw error
      setPedidoId(data.id)
      setPedidoEstado('pendiente')
      setCart([])
      setCartAbierto(false)
    } catch (err) {
      console.error('Error al enviar pedido:', err)
    } finally {
      setEnviando(false)
    }
  }

  function irANuevaMesa() {
    setPedidoId(null)
    setPedidoEstado(null)
    setCart([])
  }

  const totalItems = cart.reduce((s, i) => s + i.cantidad, 0)
  const totalGeneral = cart.reduce((s, i) => s + i.precio * i.cantidad, 0)

  const estadoLabel = {
    pendiente: 'Pendiente',
    preparando: 'Preparando',
    entregado: 'Entregado',
  }

  const estadoIcono = {
    pendiente: <Clock size={20} />,
    preparando: <Loader2 size={20} className="animate-spin" />,
    entregado: <Check size={20} />,
  }

  const colorPrimario = comercio?.color_primario || '#C4A882'

  if (cargando) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#FAF7F2] via-[#F5F0EB] to-[#F0EAE3]">
        <div className="flex items-center gap-3">
          <Loader2 size={24} className="animate-spin" style={{ color: colorPrimario }} />
          <span className="text-sm font-medium text-[#8B7A6A]">Cargando menú...</span>
        </div>
      </div>
    )
  }

  if (!comercio) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#FAF7F2] via-[#F5F0EB] to-[#F0EAE3]">
        <p className="text-sm text-[#8B7A6A]">Comercio no encontrado</p>
      </div>
    )
  }

  if (pedidoId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FAF7F2] via-[#F5F0EB] to-[#F0EAE3] flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-sm text-center"
        >
          <div
            className="w-20 h-20 rounded-2xl mx-auto mb-6 flex items-center justify-center text-white"
            style={{ backgroundColor: colorPrimario }}
          >
            {pedidoEstado === 'entregado' ? <Check size={32} /> : <Package size={32} />}
          </div>
          <h2 className="text-xl font-bold text-[#3D2B1F] mb-2">
            {pedidoEstado === 'entregado' ? '¡Pedido entregado!' : 'Pedido enviado'}
          </h2>
          <p className="text-sm text-[#8B7A6A] mb-8">
            {pedidoEstado === 'entregado'
              ? 'Que lo disfrutes.'
              : 'Estamos preparando tu pedido. Te avisamos cuando esté listo.'}
          </p>

          <div
            className="bg-white rounded-2xl border border-[#E8DDD2] p-6 mb-8"
          >
            <div className="flex items-center justify-center gap-3" style={{ color: colorPrimario }}>
              {estadoIcono[pedidoEstado]}
              <span className="text-lg font-bold">{estadoLabel[pedidoEstado]}</span>
            </div>
            <div className="mt-4 flex items-center justify-center gap-1.5 text-xs text-[#8B7A6A]">
              <Clock size={12} />
              <span>Mesa {numero_mesa}</span>
            </div>
          </div>

          {pedidoEstado === 'entregado' && (
            <button
              onClick={irANuevaMesa}
              className="px-6 py-3 rounded-xl font-semibold text-sm text-white shadow-lg"
              style={{ backgroundColor: colorPrimario }}
            >
              Hacer otro pedido
            </button>
          )}
        </motion.div>
      </div>
    )
  }

  const categorias = [...new Set(productos.map((p) => p.categoria))]

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FAF7F2] via-[#F5F0EB] to-[#F0EAE3] pb-28">
      <div className="absolute inset-0 opacity-[0.15] pointer-events-none" style={{
        backgroundImage: `radial-gradient(circle at 20% 30%, #C4A882 1px, transparent 1px),
                          radial-gradient(circle at 80% 70%, #C4A882 1px, transparent 1px)`,
        backgroundSize: '50px 50px'
      }} />

      <div className="relative max-w-2xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div
            className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center text-white"
            style={{ backgroundColor: colorPrimario }}
          >
            <Coffee size={28} strokeWidth={1.5} />
          </div>
          <h1 className="text-2xl font-bold text-[#3D2B1F]">{comercio.nombre}</h1>
          <div className="flex items-center justify-center gap-2 mt-2 text-[#8B7A6A] text-sm">
            <Clock size={14} />
            <span>Mesa {numero_mesa}</span>
          </div>
        </motion.div>

        {categorias.map((categoria, idx) => (
          <motion.div
            key={categoria}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="mb-8"
          >
            <h2 className="text-lg font-bold text-[#3D2B1F] mb-3 px-1 uppercase tracking-wider text-sm">
              {categoria}
            </h2>
            <div className="space-y-2">
              {productos
                .filter((p) => p.categoria === categoria)
                .map((producto) => {
                  const enCart = cart.find((i) => i.producto_id === producto.id && i.modificadores.length === 0)
                  return (
                    <div
                      key={producto.id}
                      className="bg-white rounded-xl p-4 flex items-start justify-between shadow-sm border border-[#E8DDD2]"
                    >
                      <div className="flex-1 min-w-0 mr-4">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-[#3D2B1F]">{producto.nombre}</h3>
                          {productosConMods.has(producto.id) && (
                            <Sparkles size={12} className="text-amber-400 shrink-0" />
                          )}
                          {enCart && (
                            <span className="w-5 h-5 rounded-full bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center">
                              {enCart.cantidad}
                            </span>
                          )}
                        </div>
                        {producto.descripcion && (
                          <p className="text-sm text-[#8B7A6A] mt-0.5">{producto.descripcion}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-bold text-[#3D2B1F]">
                          ${Number(producto.precio_base).toLocaleString('es-AR')}
                        </span>
                        <button
                          onClick={() => handleClickProducto(producto)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-white transition-all cursor-pointer"
                          style={{ backgroundColor: colorPrimario }}
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                    </div>
                  )
                })}
            </div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {productoParaModificar && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
              onClick={() => setProductoParaModificar(null)}
            />
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 50, scale: 0.95 }}
              className="fixed bottom-0 left-0 right-0 z-50 max-h-[85vh] bg-white rounded-t-3xl shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-[#E8DDD2]">
                <div>
                  <h3 className="font-bold text-lg text-[#3D2B1F]">{productoParaModificar.nombre}</h3>
                  <p className="text-sm text-[#8B7A6A]">
                    ${Number(productoParaModificar.precio_base).toLocaleString('es-AR')} base
                  </p>
                </div>
                <button
                  onClick={() => setProductoParaModificar(null)}
                  className="w-8 h-8 rounded-lg hover:bg-[#F5F0EB] flex items-center justify-center text-[#8B7A6A] cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="overflow-y-auto px-6 py-4 space-y-4" style={{ maxHeight: 'calc(85vh - 220px)' }}>
                <SelectorModificadores
                  productoId={productoParaModificar.id}
                  onChange={setModifierData}
                />

                <div>
                  <div className="text-sm font-semibold text-[#3D2B1F] mb-2">Cantidad</div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setCantidadMod(Math.max(1, cantidadMod - 1))}
                      className="w-10 h-10 rounded-xl border border-[#E8DDD2] bg-[#FAF7F2] flex items-center justify-center text-[#3D2B1F] text-lg font-semibold hover:border-amber-300 transition-colors cursor-pointer"
                    >
                      −
                    </button>
                    <span className="w-10 text-center text-xl font-bold text-[#3D2B1F] tabular-nums">
                      {cantidadMod}
                    </span>
                    <button
                      type="button"
                      onClick={() => setCantidadMod(Math.min(99, cantidadMod + 1))}
                      className="w-10 h-10 rounded-xl border border-[#E8DDD2] bg-[#FAF7F2] flex items-center justify-center text-[#3D2B1F] text-lg font-semibold hover:border-amber-300 transition-colors cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              <div className="border-t border-[#E8DDD2] px-6 py-4 bg-white space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#8B7A6A]">Total</span>
                  <span className="text-lg font-bold text-[#3D2B1F]">
                    ${((Number(productoParaModificar.precio_base) + modifierData.precioExtra) * cantidadMod).toLocaleString('es-AR')}
                  </span>
                </div>
                <button
                  onClick={agregarConModificadores}
                  className="w-full py-3.5 rounded-xl font-semibold text-sm text-white transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                  style={{ backgroundColor: colorPrimario }}
                >
                  <ShoppingBag size={16} />
                  Agregar al pedido
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {cart.length > 0 && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          onClick={() => setCartAbierto(true)}
          className="fixed bottom-6 right-6 z-30 w-14 h-14 rounded-full flex items-center justify-center text-white shadow-2xl cursor-pointer"
          style={{ backgroundColor: colorPrimario }}
        >
          <ShoppingBag size={22} />
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center shadow-md">
            {totalItems}
          </span>
        </motion.button>
      )}

      <AnimatePresence>
        {cartAbierto && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
              onClick={() => setCartAbierto(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 50, scale: 0.95 }}
              className="fixed bottom-0 left-0 right-0 z-50 max-h-[80vh] bg-white rounded-t-3xl shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-[#E8DDD2]">
                <h3 className="font-bold text-lg text-[#3D2B1F]">Tu pedido</h3>
                <button
                  onClick={() => setCartAbierto(false)}
                  className="w-8 h-8 rounded-lg hover:bg-[#F5F0EB] flex items-center justify-center text-[#8B7A6A] cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="overflow-y-auto px-6 py-4 space-y-3" style={{ maxHeight: 'calc(80vh - 180px)' }}>
                {cart.map((item) => (
                  <div key={item.key} className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="flex flex-col items-center gap-1 shrink-0 pt-0.5">
                        <button
                          onClick={() => updateQuantity(item.key, -1)}
                          className="w-7 h-7 rounded-lg border border-[#E8DDD2] flex items-center justify-center text-[#8B7A6A] hover:text-red-500 hover:border-red-200 transition-colors cursor-pointer"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="w-6 text-center text-base font-bold text-[#3D2B1F] tabular-nums">
                          {item.cantidad}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.key, 1)}
                          className="w-7 h-7 rounded-lg border border-[#E8DDD2] flex items-center justify-center text-[#8B7A6A] hover:text-amber-600 hover:border-amber-200 transition-colors cursor-pointer"
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-[#3D2B1F]">{item.nombre}</span>
                        {item.modificadores.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {item.modificadores.map((m, i) => (
                              <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-100/80 text-amber-700 border border-amber-200/60">
                                <Sparkles size={8} className="text-amber-400" />
                                {m.nombre}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <span className="text-sm font-bold text-[#3D2B1F] shrink-0 pt-0.5">
                      ${(item.precio * item.cantidad).toLocaleString('es-AR')}
                    </span>
                  </div>
                ))}
              </div>

              <div className="border-t border-[#E8DDD2] px-6 py-4 bg-white space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#8B7A6A]">Total</span>
                  <span className="text-lg font-bold text-[#3D2B1F]">${totalGeneral.toLocaleString('es-AR')}</span>
                </div>
                <button
                  onClick={sendOrder}
                  disabled={enviando}
                  className="w-full py-3.5 rounded-xl font-semibold text-sm text-white transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                  style={{ backgroundColor: colorPrimario }}
                >
                  {enviando ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <ShoppingBag size={16} />
                      Enviar pedido
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
