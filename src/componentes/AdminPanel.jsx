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
import { puede } from '../services/permisos'
import useNotificacionSonido from '../hooks/useNotificacionSonido'
import ModalConfigurarMesas from './ModalConfigurarMesas'
import ModalGestionarCategorias from './ModalGestionarCategorias'
import ModalEquipo from './ModalEquipo'
import ModalConfiguracionComercio from './ModalConfiguracionComercio'
import ModalLlamadas from './ModalLlamadas'
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
  const [modalQRAbierto, setModalQRAbierto] = useState(false)
  const [modalCategoriasAbierto, setModalCategoriasAbierto] = useState(false)
  const [modalEquipoAbierto, setModalEquipoAbierto] = useState(false)
  const [modalConfiguracionAbierto, setModalConfiguracionAbierto] = useState(false)
  const [modalLlamadasAbierto, setModalLlamadasAbierto] = useState(false)
  const [llamadas, setLlamadas] = useState([])

  useNotificacionSonido(pedidos)

  const slugAUsar = comercio_slug || 'cafe-central'
  const rol = usuario?.rol

  useEffect(() => {
    if (!puede(rol, 'verSala') && vista === 'sala') setVista('cocina')
    if (!puede(rol, 'verDashboard') && vista === 'dashboard') setVista('cocina')
  }, [rol, vista])

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

      // Cargar llamadas pendientes
      const { data: llamadasData } = await supabase
        .from('llamadas_mozo')
        .select('*')
        .eq('comercio_id', comercio.id)
        .eq('estado', 'pendiente')
        .order('creado_at', { ascending: false })
      if (llamadasData) setLlamadas(llamadasData)

      // Realtime
      const canalLlamadas = supabase
        .channel(`llamadas-${comercio.id}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'llamadas_mozo', filter: `comercio_id=eq.${comercio.id}` }, (payload) => {
          if (payload.eventType === 'INSERT') {
            setLlamadas((prev) => [payload.new, ...prev])
          } else if (payload.eventType === 'UPDATE') {
            setLlamadas((prev) => prev.filter((l) => l.id !== payload.new.id || payload.new.estado === 'pendiente').map((l) => l.id === payload.new.id ? payload.new : l).filter((l) => l.estado === 'pendiente'))
          } else if (payload.eventType === 'DELETE') {
            setLlamadas((prev) => prev.filter((l) => l.id !== payload.old.id))
          }
        })
        .subscribe()
      // guardar para cleanup
      timersRef.current.canalLlamadas = canalLlamadas

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
          notas: p.notas || '',
          motivoCancelacion: p.motivo_cancelacion || '',
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
    return () => {
      if (timersRef.current.canalLlamadas) supabase.removeChannel(timersRef.current.canalLlamadas)
    }
  }, [slugAUsar])

  const abrirModalProductos = useCallback(() => {
    if (comercioId && puede(rol, 'gestionar')) {
      setModalProductosAbierto(true)
    }
  }, [comercioId, rol])

  const abrirModalQR = useCallback(() => {
    if (puede(rol, 'gestionar')) {
      setModalQRAbierto(true)
    }
  }, [rol])

  const atenderLlamada = useCallback(async (id) => {
    await supabase.from('llamadas_mozo').update({ estado: 'atendido' }).eq('id', id)
    setLlamadas((prev) => prev.filter((l) => l.id !== id))
  }, [])

  const abrirModalLlamadas = useCallback(() => {
    setModalLlamadasAbierto(true)
  }, [])

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
              notas: payload.new.notas || '',
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
                    ? { ...ped, estado: payload.new.estado, motivoCancelacion: payload.new.motivo_cancelacion || ped.motivoCancelacion }
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

  const handleCancelar = useCallback(async (idPedido, motivo = '') => {
    setPedidos((prev) =>
      prev.map((p) =>
        p.id === idPedido ? { ...p, estado: 'cancelado', motivoCancelacion: motivo } : p
      )
    )
    setTiemposEstimados((prev) => {
      const next = { ...prev }
      delete next[idPedido]
      return next
    })
    await supabase
      .from('pedidos')
      .update({ estado: 'cancelado', motivo_cancelacion: motivo || null })
      .eq('id', idPedido)
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

    const total = (pedido.productos || []).reduce(
      (sum, p) => sum + (Number(p.precio) || 0) * (Number(p.cantidad) || 1),
      0,
    )

    const { error } = await supabase.from('pedidos').insert({
      comercio_id: comercioId,
      mesa_id: mesa.id,
      items: pedido.productos,
      total,
      notas: pedido.notas || '',
      estado: 'pendiente',
    })

    if (error) {
      console.error('Error al crear pedido:', error)
    }
  }, [comercioId])

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-[#FAF7F2] via-[#F5F0EB] to-[#F0EAE3] text-[#3D2B1F] overflow-hidden relative">
      <div className="absolute inset-0 opacity-[0.15] pointer-events-none" style={{
        backgroundImage: `radial-gradient(circle at 20% 30%, #C4A882 1px, transparent 1px),
                          radial-gradient(circle at 80% 70%, #C4A882 1px, transparent 1px)`,
        backgroundSize: '50px 50px'
      }} />
      <Encabezado
      onAbrirQR={abrirModalQR}
        vista={vista}
        onChangeVista={setVista}
        pedidosActivos={pedidos.length}
        enPreparacion={pedidos.filter(p => p.estado === 'preparando').length}
        entregados={pedidos.filter(p => p.estado === 'entregado').length}
        onNuevoPedido={() => setModalAbierto(true)}
        onGestionarProductos={abrirModalProductos}
        onAbrirCategorias={() => setModalCategoriasAbierto(true)}
        onAbrirEquipo={() => setModalEquipoAbierto(true)}
        onAbrirConfiguracion={() => setModalConfiguracionAbierto(true)}
        onAbrirLlamadas={abrirModalLlamadas}
        llamadasPendientes={llamadas.length}
        comercioNombre={usuario?.comercios?.nombre}
        usuario={usuario}
        rol={rol}
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
          onCancelar={handleCancelar}
          puedeCancelar={puede(rol, 'cancelarPedido')}
        />
      ) : vista === 'sala' && puede(rol, 'verSala') ? (
        <VistaSala
          pedidos={pedidos}
          tiemposTranscurridos={tiemposTranscurridos}
          onPreparar={handlePreparar}
          onEntregar={handleEntregar}
          onEliminar={handleEliminar}
          onCancelar={handleCancelar}
          puedeCancelar={puede(rol, 'cancelarPedido')}
        />
      ) : vista === 'dashboard' && puede(rol, 'verDashboard') ? (
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
      {comercioId && (
        <ModalConfigurarMesas
          abierto={modalQRAbierto}
          onCerrar={() => setModalQRAbierto(false)}
          comercioId={comercioId}
          slug={slugAUsar}
        />
      )}
      {comercioId && (
        <ModalGestionarCategorias
          abierto={modalCategoriasAbierto}
          onCerrar={() => setModalCategoriasAbierto(false)}
          comercioId={comercioId}
        />
      )}
      {comercioId && (
        <ModalEquipo
          abierto={modalEquipoAbierto}
          onCerrar={() => setModalEquipoAbierto(false)}
          comercioId={comercioId}
        />
      )}
      {comercioId && (
        <ModalConfiguracionComercio
          abierto={modalConfiguracionAbierto}
          onCerrar={() => setModalConfiguracionAbierto(false)}
          comercioId={comercioId}
        />
      )}
      <ModalLlamadas
        abierto={modalLlamadasAbierto}
        onCerrar={() => setModalLlamadasAbierto(false)}
        llamadas={llamadas}
        onAtender={atenderLlamada}
      />
    </div>
  )
}
