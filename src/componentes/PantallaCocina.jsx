import { useState } from 'react'
import GrillaPedidos from './GrillaPedidos'
import FiltrosEstado from './FiltrosEstado'

function PantallaCocina({ pedidos, tiemposTranscurridos, tiemposEstimados, onPreparar, onEntregar, onEliminar }) {
  const [filtro, setFiltro] = useState('todos')

  const pedidosFiltrados = pedidos.filter((p) => {
    if (filtro === 'todos') return true
    return p.estado === filtro
  })

  const pedidosOrdenados = [...pedidosFiltrados].sort((a, b) => {
    const ta = tiemposTranscurridos[a.id] ?? 0
    const tb = tiemposTranscurridos[b.id] ?? 0
    return tb - ta
  })

  return (
    <>
      <FiltrosEstado filtro={filtro} onChange={setFiltro} />
      <GrillaPedidos
        pedidos={pedidosOrdenados}
        tiemposTranscurridos={tiemposTranscurridos}
        tiemposEstimados={tiemposEstimados}
        onPreparar={onPreparar}
        onEntregar={onEntregar}
        onEliminar={onEliminar}
      />
    </>
  )
}

export default PantallaCocina
