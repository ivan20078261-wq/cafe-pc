import { useState, useMemo, useCallback, useRef } from 'react'
import { Trash2, X, ClipboardList, Coffee, Armchair } from 'lucide-react'

const UMBRAL_ALERTA = 7 * 60
const CW = 1180, CH = 560

const POSICIONES_INICIALES = {
  1: [130, 100], 2: [310, 100],
  3: [130, 460], 4: [310, 460],
  5: [500, 210], 6: [700, 210],
  7: [500, 340], 8: [700, 340],
  9: [900, 100], 10: [1050, 100],
  11: [900, 460], 12: [1050, 460],
}

function formatearTiempo(segundos) {
  if (segundos < 60) return `${segundos}s`
  const mins = Math.floor(segundos / 60)
  const segs = segundos % 60
  return `${mins}m ${segs < 10 ? '0' : ''}${segs}s`
}

function estadoMesa(lista, tiemposTranscurridos) {
  if (!lista.length) return 'libre'
  const maxT = Math.max(...lista.map((p) => tiemposTranscurridos[p.id] ?? 0))
  if (lista.every((p) => p.estado === 'entregado')) return 'entregado'
  if (lista.some((p) => p.estado === 'pendiente') && maxT >= UMBRAL_ALERTA) return 'urgente'
  if (lista.some((p) => p.estado === 'preparando')) return 'preparando'
  return 'pendiente'
}

const ESTADO_CONFIG = {
  libre:      { silla: '#C8B99A', mesa: '#F5EDE0', borde: '#D9C8B0', dot: '#9CA3AF', label: 'Libre' },
  pendiente:  { silla: '#F59E0B', mesa: '#FFFBEB', borde: '#F59E0B', dot: '#F59E0B', label: 'Pendiente' },
  preparando: { silla: '#F97316', mesa: '#FFF7ED', borde: '#F97316', dot: '#F97316', label: 'Preparando' },
  entregado:  { silla: '#10B981', mesa: '#ECFDF5', borde: '#10B981', dot: '#10B981', label: 'Atendido' },
  urgente:    { silla: '#EF4444', mesa: '#FEF2F2', borde: '#EF4444', dot: '#EF4444', label: '¡Urgente!' },
  cancelado:  { silla: '#FCA5A5', mesa: '#FEF2F2', borde: '#FCA5A5', dot: '#EF4444', label: 'Cancelado' },
}

function Silla({ x, y, rot, color }) {
  return (
    <g transform={`translate(${x},${y}) rotate(${rot})`}>
      <rect x="-9" y="-20" width="18" height="10" rx="4" fill={color} opacity="0.9" />
      <rect x="-9" y="-8" width="18" height="14" rx="3" fill={color} opacity="0.75" />
      <rect x="-8" y="6" width="4" height="6" rx="1" fill={color} opacity="0.5" />
      <rect x="4" y="6" width="4" height="6" rx="1" fill={color} opacity="0.5" />
    </g>
  )
}

function MesaSVG({ numero, x, y, pedidosMesa, tiemposTranscurridos, onClick, onDragStart, dragging }) {
  const estado = estadoMesa(pedidosMesa, tiemposTranscurridos)
  const cfg = ESTADO_CONFIG[estado]
  const maxT = pedidosMesa.length ? Math.max(...pedidosMesa.map((p) => tiemposTranscurridos[p.id] ?? 0)) : 0
  const totalItems = pedidosMesa.reduce((s, p) => s + p.productos.reduce((a, x) => a + x.cantidad, 0), 0)
  const hasOrders = pedidosMesa.length > 0
  const W = 80, H = 56

  const handleMouseDown = (e) => {
    e.stopPropagation()
    const svg = e.target.closest('svg')
    const pt = svg.createSVGPoint()
    pt.x = e.clientX
    pt.y = e.clientY
    const svgP = pt.matrixTransform(svg.getScreenCTM().inverse())
    onDragStart(numero, svgP.x - x, svgP.y - y)
  }

  return (
    <g
      transform={`translate(${x},${y})`}
      onMouseDown={handleMouseDown}
      onTouchStart={(e) => {
        e.stopPropagation()
        const touch = e.touches[0]
        const svg = e.target.closest('svg')
        const pt = svg.createSVGPoint()
        pt.x = touch.clientX
        pt.y = touch.clientY
        const svgP = pt.matrixTransform(svg.getScreenCTM().inverse())
        onDragStart(numero, svgP.x - x, svgP.y - y)
      }}
      onClick={() => !dragging && hasOrders && onClick(numero)}
      style={{ cursor: dragging ? 'grabbing' : 'grab' }}
    >
      <Silla x={0} y={-H / 2 - 18} rot={0} color={cfg.silla} />
      <Silla x={0} y={H / 2 + 18} rot={180} color={cfg.silla} />
      <Silla x={-W / 2 - 18} y={0} rot={-90} color={cfg.silla} />
      <Silla x={W / 2 + 18} y={0} rot={90} color={cfg.silla} />

      <rect x={-W / 2} y={-H / 2} width={W} height={H} rx="10"
        fill={cfg.mesa} stroke={cfg.borde}
        strokeWidth={hasOrders ? 2 : 1}
        style={{ filter: dragging ? 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))' : 'none' }}
      />

      <text x="0" y="-8" textAnchor="middle" fontSize="13" fontWeight="600"
        fill={estado === 'libre' ? '#8B7A6A' : '#1F2937'} fontFamily="sans-serif" style={{ pointerEvents: 'none' }}>
        M{numero}
      </text>

      {estado === 'libre' ? (
        <text x="0" y="10" textAnchor="middle" fontSize="9" fill="#B0A090" fontFamily="sans-serif" style={{ pointerEvents: 'none' }}>libre</text>
      ) : (
        <>
          <text x="0" y="8" textAnchor="middle" fontSize="9" fontWeight="500" fill={cfg.dot} fontFamily="sans-serif" style={{ pointerEvents: 'none' }}>
            {totalItems} item{totalItems !== 1 ? 's' : ''}
          </text>
          {maxT > 0 && (
            <text x="0" y="20" textAnchor="middle" fontSize="8" fill={estado === 'urgente' ? '#EF4444' : '#6B7280'} fontFamily="monospace" style={{ pointerEvents: 'none' }}>
              {formatearTiempo(maxT)}
            </text>
          )}
        </>
      )}

      {hasOrders && (
        <circle cx={W / 2 - 8} cy={-H / 2 + 8} r="5" fill={cfg.dot} style={{ pointerEvents: 'none' }}>
          <animate attributeName="opacity" values="1;0.3;1" dur="1.5s" repeatCount="indefinite" />
        </circle>
      )}
    </g>
  )
}

function ModalDetalle({ mesa, pedidos, tiemposTranscurridos, onPreparar, onEntregar, onEliminarPedido, onCancelar, puedeCancelar, onEliminar, onCerrar }) {
  if (!mesa) return null
  const totalItems = pedidos.reduce((s, p) => s + p.productos.reduce((a, x) => a + (x.cantidad ?? 1), 0), 0)

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(30,20,10,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, backdropFilter: 'blur(3px)' }}
         onClick={(e) => e.target === e.currentTarget && onCerrar()}>
      <div style={{ background: '#FDFAF6', borderRadius: 20, border: '1px solid #E0D4C0', padding: 24, width: 360, maxHeight: '80vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 600, color: '#3D2B1F' }}>Mesa {mesa}</div>
            <div style={{ fontSize: 12, color: '#8B7A6A', marginTop: 2 }}>{pedidos.length} pedido{pedidos.length !== 1 ? 's' : ''} · {totalItems} items</div>
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            <button onClick={() => onEliminar(mesa)} title="Eliminar mesa" style={{ background: '#FEE2E2', border: 'none', borderRadius: 8, padding: '4px 8px', fontSize: 12, color: '#DC2626', cursor: 'pointer', display: 'flex', alignItems: 'center' }}><Trash2 size={14} /></button>
            <button onClick={onCerrar} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: '#8B7A6A', lineHeight: 1, padding: 4, display: 'flex', alignItems: 'center' }}><X size={18} /></button>
          </div>
        </div>

        {pedidos.map((p) => {
          const t = tiemposTranscurridos[p.id] ?? 0
          const estado = p.estado
          const dc = ESTADO_CONFIG[estado]?.dot ?? '#9CA3AF'
          return (
            <div key={p.id} style={{ background: '#FFF8F0', border: '1px solid #E8DDD2', borderRadius: 12, padding: '12px 14px', marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#3D2B1F' }}>Pedido #{p.id}</span>
                <span style={{ fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 20, background: dc + '22', color: dc, border: `1px solid ${dc}55` }}>
                  {ESTADO_CONFIG[estado]?.label} · {estado === 'entregado' ? 'Listo' : formatearTiempo(t)}
                </span>
              </div>
              {p.productos.map((pr, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#5D4E3C', padding: '3px 0', borderBottom: i < p.productos.length - 1 ? '1px dashed #E8DDD2' : 'none' }}>
                  <span>{pr.nombre}</span>
                  <span style={{ color: '#8B7A6A' }}>×{pr.cantidad ?? 1}</span>
                </div>
              ))}
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                {estado === 'pendiente' && (
                  <button onClick={() => onPreparar(p.id)} style={{ flex: 1, padding: '8px 0', borderRadius: 8, border: 'none', background: '#F59E0B', color: 'white', fontWeight: 600, fontSize: 12, cursor: 'pointer' }}>
                    Preparar
                  </button>
                )}
                {estado === 'preparando' && (
                  <button onClick={() => onEntregar(p.id)} style={{ flex: 1, padding: '8px 0', borderRadius: 8, border: 'none', background: '#10B981', color: 'white', fontWeight: 600, fontSize: 12, cursor: 'pointer' }}>
                    Entregado
                  </button>
                )}
                {estado === 'entregado' && (
                  <button onClick={() => onEliminarPedido(p.id)} style={{ flex: 1, padding: '8px 0', borderRadius: 8, border: 'none', background: '#6B7280', color: 'white', fontWeight: 600, fontSize: 12, cursor: 'pointer' }}>
                    Marcar libre
                  </button>
                )}
                {(estado === 'pendiente' || estado === 'preparando') && puedeCancelar && (
                  <button onClick={() => { if (window.confirm('¿Cancelar este pedido?')) onCancelar(p.id) }} style={{ flex: 1, padding: '8px 0', borderRadius: 8, border: '1.5px solid #FCA5A5', background: 'transparent', color: '#DC2626', fontWeight: 600, fontSize: 12, cursor: 'pointer' }}>
                    Cancelar
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function VistaSala({ pedidos, tiemposTranscurridos, onPreparar, onEntregar, onEliminar, onCancelar, puedeCancelar }) {
  const [mesaSeleccionada, setMesaSeleccionada] = useState(null)
  const [posiciones, setPosiciones] = useState(POSICIONES_INICIALES)
  const [dragInfo, setDragInfo] = useState(null)
  const svgRef = useRef(null)

  const pedidosPorMesa = useMemo(() => {
    const m = {}
    for (const num of Object.keys(posiciones).map(Number)) {
      m[num] = pedidos.filter((p) => p.mesa === num && p.estado !== 'cancelado')
    }
    return m
  }, [pedidos, posiciones])

  const mesasOcupadas = Object.values(pedidosPorMesa).filter((l) => l.length > 0).length
  const totalItems = pedidos.reduce((s, p) => s + p.productos.reduce((a, x) => a + x.cantidad, 0), 0)

  const handleDragStart = useCallback((mesa, offsetX, offsetY) => {
    setDragInfo({ mesa, offsetX, offsetY })
  }, [])

  const handleMouseMove = useCallback((e) => {
    if (!dragInfo) return
    const svg = svgRef.current
    const pt = svg.createSVGPoint()
    pt.x = e.clientX
    pt.y = e.clientY
    const svgP = pt.matrixTransform(svg.getScreenCTM().inverse())

    let nx = svgP.x - dragInfo.offsetX
    let ny = svgP.y - dragInfo.offsetY
    nx = Math.max(40, Math.min(CW - 40, nx))
    ny = Math.max(40, Math.min(CH - 40, ny))

    setPosiciones((prev) => ({ ...prev, [dragInfo.mesa]: [nx, ny] }))
  }, [dragInfo])

  const handleTouchMove = useCallback((e) => {
    if (!dragInfo) return
    e.preventDefault()
    const touch = e.touches[0]
    const svg = svgRef.current
    const pt = svg.createSVGPoint()
    pt.x = touch.clientX
    pt.y = touch.clientY
    const svgP = pt.matrixTransform(svg.getScreenCTM().inverse())

    let nx = svgP.x - dragInfo.offsetX
    let ny = svgP.y - dragInfo.offsetY
    nx = Math.max(40, Math.min(CW - 40, nx))
    ny = Math.max(40, Math.min(CH - 40, ny))

    setPosiciones((prev) => ({ ...prev, [dragInfo.mesa]: [nx, ny] }))
  }, [dragInfo])

  const handleDragEnd = useCallback(() => {
    setDragInfo(null)
  }, [])

  const handleReiniciar = useCallback(() => {
    setPosiciones(POSICIONES_INICIALES)
  }, [])

  const totalMesas = Object.keys(posiciones).length

  const handleAgregarMesa = useCallback(() => {
    const siguienteNum = Math.max(...Object.keys(posiciones).map(Number)) + 1

    const occupy = (x, y) => Object.values(posiciones).some(([px, py]) => Math.abs(px - x) < 120 && Math.abs(py - y) < 100)

    const candidatos = []
    for (let x = 130; x < CW - 40; x += 120) {
      for (let y = 100; y < CH - 40; y += 100) {
        if (!occupy(x, y)) candidatos.push([x, y])
      }
    }

    if (candidatos.length === 0) {
      const cx = CW / 2 + (Math.random() - 0.5) * 200
      const cy = CH / 2 + (Math.random() - 0.5) * 150
      candidatos.push([cx, cy])
    }

    const pos = candidatos[Math.floor(Math.random() * candidatos.length)]
    setPosiciones((prev) => ({ ...prev, [siguienteNum]: pos }))
  }, [posiciones])

  const handleEliminarMesa = useCallback((num) => {
    setPosiciones((prev) => {
      const next = { ...prev }
      delete next[num]
      return next
    })
    setMesaSeleccionada(null)
  }, [])

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: '8px 12px 12px', background: '#F5EDE0', overflow: 'hidden' }}>
      <div style={{ display: 'flex', gap: 10, marginBottom: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        {[
          { icon: Armchair, val: `${mesasOcupadas}/${totalMesas}`, lbl: 'mesas ocupadas' },
          { icon: ClipboardList, val: pedidos.length, lbl: pedidos.length === 1 ? 'pedido' : 'pedidos' },
          { icon: Coffee, val: totalItems, lbl: totalItems === 1 ? 'item' : 'items' },
        ].map((s) => (
          <div key={s.lbl} style={{ background: 'rgba(255,255,255,0.7)', border: '1px solid #E0D0BC', borderRadius: 12, padding: '6px 14px', display: 'flex', alignItems: 'center', gap: 8, backdropFilter: 'blur(4px)' }}>
            <s.icon size={16} style={{ color: '#8B7A6A' }} />
            <span style={{ fontSize: 14, fontWeight: 600, color: '#3D2B1F' }}>{s.val}</span>
            <span style={{ fontSize: 11, color: '#8B7A6A' }}>{s.lbl}</span>
          </div>
        ))}

        <button onClick={handleAgregarMesa} style={{ background: '#F59E0B', border: 'none', borderRadius: 8, padding: '5px 12px', fontSize: 12, fontWeight: 600, color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ fontSize: 14, lineHeight: 1 }}>+</span> Mesa
        </button>

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={handleReiniciar} style={{ background: 'rgba(255,255,255,0.7)', border: '1px solid #E0D0BC', borderRadius: 8, padding: '4px 10px', fontSize: 10, color: '#8B7A6A', cursor: 'pointer', backdropFilter: 'blur(4px)' }}>
            Reiniciar posición
          </button>
          {Object.entries(ESTADO_CONFIG).map(([k, v]) => (
            <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: v.dot }} />
              <span style={{ fontSize: 10, color: '#8B7A6A' }}>{v.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, minHeight: 0, background: '#FDF6EC', borderRadius: 20, border: '1.5px solid #D9C8B0', overflow: 'hidden', position: 'relative' }}>
        <svg ref={svgRef} viewBox={`-4 -4 ${CW + 8} ${CH + 32}`} width="100%" height="100%" preserveAspectRatio="xMidYMid meet" style={{ display: 'block' }}
          onMouseMove={handleMouseMove}
          onMouseUp={handleDragEnd}
          onMouseLeave={handleDragEnd}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleDragEnd}
          onTouchCancel={handleDragEnd}
        >
          <defs>
            <pattern id="madera" x="0" y="0" width="80" height="20" patternUnits="userSpaceOnUse">
              <rect width="80" height="20" fill="#EFE1CC" />
              <rect x="0" y="0" width="78" height="19" rx="1" fill="#EAD9C0" />
              <rect x="40" y="0" width="38" height="19" rx="1" fill="#E5D4BA" />
              <line x1="0" y1="20" x2="80" y2="20" stroke="#D9C8B0" strokeWidth="0.5" />
              <line x1="0" y1="0" x2="0" y2="20" stroke="#D9C8B0" strokeWidth="0.3" opacity="0.5" />
              <line x1="40" y1="0" x2="40" y2="20" stroke="#D9C8B0" strokeWidth="0.3" opacity="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#madera)" />

          {/* Paredes */}
          <rect x="0" y="0" width="16" height={CH} fill="#C8B99A" />
          <rect x="12" y="0" width="4" height={CH} fill="#B8A88A" />
          <rect x={CW - 16} y="0" width="16" height={CH} fill="#C8B99A" />
          <rect x={CW - 16} y="0" width="4" height={CH} fill="#B8A88A" />
          <rect x="0" y="0" width={CW} height="14" fill="#C8B99A" />
          <rect x="0" y="10" width={CW} height="4" fill="#B8A88A" />

          {/* Ventanas */}
          {[200, 400, 600, 800, 1000].map((wx) => (
            <g key={wx} transform={`translate(${wx}, 1)`}>
              <rect x="0" y="0" width="50" height="12" rx="2" fill="#A8C4D8" opacity="0.6" />
              <rect x="2" y="1" width="46" height="10" rx="1.5" fill="#C8DDE8" opacity="0.7" />
              <line x1="25" y1="1" x2="25" y2="11" stroke="#90AABB" strokeWidth="1" />
              <line x1="2" y1="6" x2="48" y2="6" stroke="#90AABB" strokeWidth="0.5" />
            </g>
          ))}

          {/* Plantas */}
          {[[38, 40], [CW - 38, 40], [38, CH - 40], [CW - 38, CH - 40]].map(([px, py], i) => (
            <g key={`planta-${i}`} transform={`translate(${px},${py})`} style={{ pointerEvents: 'none' }}>
              <ellipse cx="0" cy="8" rx="10" ry="6" fill="#8B6914" opacity="0.7" />
              <circle cx="-6" cy="-2" r="10" fill="#2D6A4F" opacity="0.85" />
              <circle cx="6" cy="-4" r="9" fill="#1B4332" opacity="0.8" />
              <circle cx="0" cy="-8" r="8" fill="#2D6A4F" opacity="0.9" />
              <circle cx="-4" cy="-12" r="5" fill="#40916C" opacity="0.7" />
              <circle cx="4" cy="-10" r="5" fill="#52B788" opacity="0.6" />
            </g>
          ))}

          {/* Mesas */}
          {Object.entries(posiciones).map(([num, [cx, cy]]) => (
            <MesaSVG key={num} numero={Number(num)} x={cx} y={cy}
              pedidosMesa={pedidosPorMesa[Number(num)]}
              tiemposTranscurridos={tiemposTranscurridos}
              onClick={setMesaSeleccionada}
              onDragStart={handleDragStart}
              dragging={dragInfo?.mesa === Number(num)} />
          ))}

          {/* Barra */}
          <g transform="translate(16, 220)" style={{ pointerEvents: 'none' }}>
            <rect x="0" y="0" width="12" height="120" rx="3" fill="#C8A870" stroke="#A88850" strokeWidth="0.5" />
            <rect x="1" y="2" width="10" height="116" rx="2" fill="#D8B880" opacity="0.8" />
            {[20, 40, 60, 80, 100].map((yy) => (
              <circle key={yy} cx="6" cy={yy} r="2.5" fill="#8B6020" opacity="0.5" />
            ))}
            <text x="6" y="-5" textAnchor="middle" fontSize="5" fill="#6B4510" fontFamily="sans-serif" letterSpacing="1" transform="rotate(-90,6,-5)">BARRA</text>
          </g>

          {/* Puerta */}
          <g transform={`translate(${CW / 2}, ${CH})`} style={{ pointerEvents: 'none' }}>
            <rect x="-40" y="-14" width="80" height="14" rx="0" fill="#B8A070" />
            <rect x="-39" y="-13" width="78" height="12" fill="#C8B080" />
            <path d="M-30,-13 Q-30,-26 0,-26 Q30,-26 30,-13" fill="#8B6914" opacity="0.4" />
            <line x1="-30" y1="-13" x2="-30" y2="0" stroke="#8B6914" strokeWidth="2" opacity="0.5" />
            <line x1="30" y1="-13" x2="30" y2="0" stroke="#8B6914" strokeWidth="2" opacity="0.5" />
            <text x="0" y="-4" textAnchor="middle" fontSize="7" fill="#6B4F1A" fontFamily="sans-serif" letterSpacing="2" fontWeight="500">ENTRADA</text>
          </g>
        </svg>
      </div>

      <ModalDetalle
        mesa={mesaSeleccionada}
        pedidos={mesaSeleccionada ? pedidosPorMesa[mesaSeleccionada] : []}
        tiemposTranscurridos={tiemposTranscurridos}
        onPreparar={onPreparar}
        onEntregar={(id) => {
          onEntregar(id)
        }}
        onEliminarPedido={(id) => {
          onEliminar(id)
          const quedan = pedidosPorMesa[mesaSeleccionada]?.filter((p) => p.id !== id) ?? []
          if (quedan.length === 0) setMesaSeleccionada(null)
        }}
        onCancelar={onCancelar}
        puedeCancelar={puedeCancelar}
        onEliminar={handleEliminarMesa}
        onCerrar={() => setMesaSeleccionada(null)}
      />
    </div>
  )
}

export default VistaSala
