import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import PantallaCocina from './PantallaCocina'
import VistaSala from './VistaSala'
import Dashboard from './Dashboard'
import Encabezado from './Encabezado'
import ModalNuevoPedido from './ModalNuevoPedido'
import ModalGestionarProductos from './ModalGestionarProductos'
import { supabase } from '../supabase'
import { predecirTiempo } from '../services/mistral'
import useNotificacionSonido from '../hooks/useNotificacionSonido'

const DELAY_ENTREGADO_MS = 8000

export default function AdminPanel() {
  const { comercio_slug } = useParams()
  const { usuario, logout } = useAuth()
  const [vista, setVista] = useState('cocina')
  const [pedidos, setPedidos] = useState([])
  const [ahora, setAhora] = useState(Date.now())
  const [modalAbierto, setModalAbierto] = useState(false)
  const [modalProductosAbierto, setModalProductosAbierto] = useState(false)
  const [cargando, setCargando] = useState(true)
  const [comercioId, setComercioId] = useState(null)
  const [tiemposEstimados, setTiemposEstimados] = useState({})
  const timersRef = useRef({})

  useNotificacionSonido(pedidos)

  const slugAUsar = comercio_slug || 'cafe-central'

  const calcularPrediccion = useCallback(async (pedido) => {
    if (pedido.estado !== 'pendiente') return
    if (tiemposEstimados[pedido.id]) return

    const totalItems = pedido.productos.reduce((sum, p) => sum + (p.cantidad ?? 1), 0)
    const hora = new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
    const activos = pedidos.filter((p) => p.estado === 'pendiente' || p.estado === 'preparando').length

    const estimado = await predecirTiempo(pedido.productos, totalItems, hora, activos)
    if (estimado) {
      setTiemposEstimados((prev) => ({ ...prev, [pedido.id]: estimado }))
    }
  }, [pedidos, tiemposEstimados])

  useEffect(() => {
    async function init() {
      const { data: comercio } = await supabase
        .from('comercios')
        .select('id')
        .eq('slug', slugAUsar)
        .single()

      if (!comercio) {
        console.error('No se encontró el comercio:', slugAUsar)
        setCargando(false)
        return
      }
      setComercioId(comercio.id)

      const { data, error } = await supabase
        .from('pedidos')
        .select('*, mesas(numero_mesa)')
        .eq('comercio_id', comercio.id)
        .neq('estado', 'archivado')
        .order('creado_at', { ascending: false })

      if (error) {
        console.error('Error cargando pedidos:', error)
      } else {
        const pedidosCargados = data.map((p) => ({
          id: p.id,
          mesa: p.mesas?.numero_mesa ?? '?',
          productos: p.items,
          notas: '',
          estado: p.estado,
          creadoEn: new Date(p.creado_at).getTime(),
        }))
        setPedidos(pedidosCargados)

        for (const pedido of pedidosCargados) {
          if (pedido.estado === 'pendiente') {
            calcularPrediccion(pedido)
          }
        }
      }
      setCargando(false)
    }
    init()
  }, [slugAUsar])

  const abrirModalProductos = useCallback(() => {
    if (comercioId) {
      setModalProductosAbierto(true)
    }
  }, [comercioId])

  useEffect(() => {
    if (!comercioId) return

    const canal = supabase
      .channel('pedidos-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'pedidos', filter: `comercio_id=eq.${comercioId}` },
        async (payload) => {
          if (payload.eventType === 'INSERT') {
            const { data: mesa } = await supabase
              .from('mesas')
              .select('numero_mesa')
              .eq('id', payload.new.mesa_id)
              .single()

            const nuevoPedido = {
              id: payload.new.id,
              mesa: mesa?.numero_mesa ?? '?',
              productos: payload.new.items,
              notas: '',
              estado: payload.new.estado,
              creadoEn: new Date(payload.new.creado_at).getTime(),
            }

            setPedidos((prev) => [nuevoPedido, ...prev])

            if (payload.new.estado === 'pendiente') {
              calcularPrediccion(nuevoPedido)
            }
          } else if (payload.eventType === 'UPDATE') {
            if (payload.new.estado === 'archivado') {
              setPedidos((prev) => prev.filter((ped) => ped.id !== payload.new.id))
              setTiemposEstimados((prev) => {
                const next = { ...prev }
                delete next[payload.new.id]
                return next
              })
            } else {
              setPedidos((prev) =>
                prev.map((ped) =>
                  ped.id === payload.new.id
                    ? { ...ped, estado: payload.new.estado }
                    : ped
                )
              )
            }
          } else if (payload.eventType === 'DELETE') {
            setPedidos((prev) => prev.filter((ped) => ped.id !== payload.old.id))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(canal)
    }
  }, [comercioId])

  useEffect(() => {
    const id = setInterval(() => setAhora(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    for (const pedido of pedidos) {
      if (pedido.estado === 'entregado' && !timersRef.current[pedido.id]) {
        timersRef.current[pedido.id] = setTimeout(() => {
          setPedidos((prev) => prev.filter((p) => p.id !== pedido.id))
          setTiemposEstimados((prev) => {
            const next = { ...prev }
            delete next[pedido.id]
            return next
          })
          supabase.from('pedidos').update({ estado: 'archivado' }).eq('id', pedido.id)
          delete timersRef.current[pedido.id]
        }, DELAY_ENTREGADO_MS)
      }
      if (pedido.estado !== 'entregado' && timersRef.current[pedido.id]) {
        clearTimeout(timersRef.current[pedido.id])
        delete timersRef.current[pedido.id]
      }
    }

    return () => {
      Object.values(timersRef.current).forEach(clearTimeout)
    }
  }, [pedidos])

  const tiemposTranscurridos = {}
  for (const pedido of pedidos) {
    tiemposTranscurridos[pedido.id] = Math.floor((ahora - pedido.creadoEn) / 1000)
  }

  const handlePreparar = useCallback(async (idPedido) => {
    setPedidos((prev) =>
      prev.map((p) => (p.id === idPedido ? { ...p, estado: 'preparando' } : p))
    )
    await supabase.from('pedidos').update({ estado: 'preparando' }).eq('id', idPedido)
  }, [])

  const handleEntregar = useCallback(async (idPedido) => {
    setPedidos((prev) =>
      prev.map((p) => (p.id === idPedido ? { ...p, estado: 'entregado' } : p))
    )
    await supabase.from('pedidos').update({ estado: 'entregado' }).eq('id', idPedido)
  }, [])

  const handleEliminar = useCallback(async (idPedido) => {
    setPedidos((prev) => prev.filter((p) => p.id !== idPedido))
    setTiemposEstimados((prev) => {
      const next = { ...prev }
      delete next[idPedido]
      return next
    })
    await supabase.from('pedidos').update({ estado: 'archivado' }).eq('id', idPedido)
  }, [])

  const handleCrearPedido = useCallback(async (pedido) => {
    if (!comercioId) return

    const { data: mesa } = await supabase
      .from('mesas')
      .select('id')
      .eq('comercio_id', comercioId)
      .eq('numero_mesa', pedido.mesa)
      .single()

    if (!mesa) {
      console.error('Mesa no encontrada:', pedido.mesa)
      return
    }

    await supabase.from('pedidos').insert({
      comercio_id: comercioId,
      mesa_id: mesa.id,
      items: pedido.productos,
      total: 0,
      estado: 'pendiente',
    })
  }, [comercioId])

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-[#FAF7F2] via-[#F5F0EB] to-[#F0EAE3] text-[#3D2B1F] overflow-hidden relative">
      <div className="absolute inset-0 opacity-[0.15] pointer-events-none" style={{
        backgroundImage: `radial-gradient(circle at 20% 30%, #C4A882 1px, transparent 1px),
                          radial-gradient(circle at 80% 70%, #C4A882 1px, transparent 1px)`,
        backgroundSize: '50px 50px'
      }} />
      <Encabezado
        vista={vista}
        onChangeVista={setVista}
        pedidosActivos={pedidos.length}
        enPreparacion={pedidos.filter(p => p.estado === 'preparando').length}
        entregados={pedidos.filter(p => p.estado === 'entregado').length}
        onNuevoPedido={() => setModalAbierto(true)}
        onGestionarProductos={abrirModalProductos}
        usuario={usuario}
        onLogout={logout}
      />
      {cargando ? (
        <div className="flex-1 flex items-center justify-center text-[#8B7A6A]">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm font-medium">Cargando pedidos...</span>
          </div>
        </div>
      ) : vista === 'cocina' ? (
        <PantallaCocina
          pedidos={pedidos}
          tiemposTranscurridos={tiemposTranscurridos}
          tiemposEstimados={tiemposEstimados}
          onPreparar={handlePreparar}
          onEntregar={handleEntregar}
          onEliminar={handleEliminar}
          onCrearPedido={handleCrearPedido}
        />
      ) : vista === 'sala' ? (
        <VistaSala
          pedidos={pedidos}
          tiemposTranscurridos={tiemposTranscurridos}
          onPreparar={handlePreparar}
          onEntregar={handleEntregar}
          onEliminar={handleEliminar}
        />
      ) : vista === 'dashboard' ? (
        <Dashboard comercioId={comercioId} />
      ) : null}
      <ModalNuevoPedido
        abierto={modalAbierto}
        comercioId={comercioId}
        onCerrar={() => setModalAbierto(false)}
        onCrear={handleCrearPedido}
      />
      {comercioId && (
        <ModalGestionarProductos
          abierto={modalProductosAbierto}
          comercioId={comercioId}
          onCerrar={() => setModalProductosAbierto(false)}
        />
      )}
    </div>
  )
}
