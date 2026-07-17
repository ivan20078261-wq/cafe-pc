import { useState, useEffect } from 'react'
import { Sparkles, Milk, Ruler } from 'lucide-react'
import { supabase } from '../supabase'

const iconosModificador = {
  Tamaño: Ruler,
  Leche: Milk,
  default: Sparkles,
}

function obtenerIcono(nombre) {
  for (const [key, Icono] of Object.entries(iconosModificador)) {
    if ((nombre || '').toLowerCase().includes(key.toLowerCase())) return Icono
  }
  return iconosModificador.default
}

export default function SelectorModificadores({ productoId, onChange }) {
  const [grupos, setGrupos] = useState([])
  const [seleccion, setSeleccion] = useState({})
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    if (!productoId) return
    cargarGrupos()
  }, [productoId])

  async function cargarGrupos() {
    setCargando(true)
    const { data: rels } = await supabase
      .from('producto_modificador')
      .select('modificador_id')
      .eq('producto_id', productoId)

    if (!rels || rels.length === 0) {
      setCargando(false)
      setGrupos([])
      onChange({ modificadores: [], precioExtra: 0 })
      return
    }

    const ids = rels.map((r) => r.modificador_id)
    const { data: mods } = await supabase
      .from('modificadores')
      .select('*, opciones_modificador(*)')
      .in('id', ids)
      .order('orden')

    if (mods) {
      setGrupos(mods)
      const sel = {}
      for (const g of mods) {
        if (g.tipo === 'select' && g.requerido && g.opciones_modificador?.length > 0) {
          sel[g.id] = g.opciones_modificador[0].id
        } else if (g.tipo === 'multi') {
          sel[g.id] = []
        }
      }
      setSeleccion(sel)
      notificarCambio(mods, sel)
    }
    setCargando(false)
  }

  function toggleOpcion(grupoId, opcionId, tipo) {
    setSeleccion((prev) => {
      let nueva
      if (tipo === 'select') {
        nueva = { ...prev, [grupoId]: opcionId }
      } else {
        const actual = prev[grupoId] || []
        nueva = {
          ...prev,
          [grupoId]: actual.includes(opcionId)
            ? actual.filter((id) => id !== opcionId)
            : [...actual, opcionId],
        }
      }
      notificarCambio(grupos, nueva)
      return nueva
    })
  }

  function notificarCambio(gruposActuales, seleccionActual) {
    const modificadores = []
    let precioExtra = 0

    for (const g of gruposActuales) {
      const sel = seleccionActual[g.id]
      if (!sel) continue

      const ids = Array.isArray(sel) ? sel : [sel]
      for (const opId of ids) {
        const op = g.opciones_modificador?.find((o) => o.id === opId)
        if (op) {
          modificadores.push({
            modificador_id: g.id,
            grupo: g.nombre,
            opcion_id: op.id,
            nombre: op.nombre,
            precio_adicional: Number(op.precio_adicional),
          })
          precioExtra += Number(op.precio_adicional)
        }
      }
    }

    onChange({ modificadores, precioExtra })
  }

  if (cargando) {
    return (
      <div className="flex items-center justify-center py-6">
        <div className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (grupos.length === 0) return null

  return (
    <div className="space-y-4">
      {grupos.map((grupo) => {
        const opciones = grupo.opciones_modificador || []
        const Icono = obtenerIcono(grupo.nombre)
        const esSelect = grupo.tipo === 'select'
        const seleccionado = seleccion[grupo.id]

        return (
          <div key={grupo.id}>
            <div className="flex items-center gap-1.5 text-sm font-semibold text-[#3D2B1F] mb-2">
              <Icono size={14} className="text-amber-600" />
              {grupo.nombre}
              {grupo.requerido && (
                <span className="text-[10px] text-red-400 font-medium ml-1">*</span>
              )}
            </div>
            <div className={esSelect ? 'flex gap-2 flex-wrap' : 'space-y-1'}>
              {opciones.map((op) => {
                const activo = esSelect
                  ? seleccionado === op.id
                  : (seleccionado || []).includes(op.id)

                if (esSelect) {
                  return (
                    <button
                      key={op.id}
                      type="button"
                      onClick={() => toggleOpcion(grupo.id, op.id, 'select')}
                      className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                        activo
                          ? 'bg-amber-600 text-white shadow-md shadow-amber-200'
                          : 'bg-[#FAF7F2] text-[#3D2B1F] border border-[#E8DDD2] hover:border-amber-300'
                      }`}
                    >
                      {op.nombre}
                      {op.precio_adicional > 0 && (
                        <span className={`ml-1.5 ${activo ? 'text-amber-200' : 'text-[#8B7A6A]'}`}>
                          +${op.precio_adicional}
                        </span>
                      )}
                    </button>
                  )
                }

                return (
                  <label
                    key={op.id}
                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl border transition-all cursor-pointer ${
                      activo
                        ? 'bg-amber-50 border-amber-300'
                        : 'bg-[#FAF7F2] border-[#E8DDD2] hover:border-amber-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={activo}
                      onChange={() => toggleOpcion(grupo.id, op.id, 'multi')}
                      className="w-4 h-4 rounded border-[#E8DDD2] text-amber-600 focus:ring-amber-200"
                    />
                    <span className="text-sm font-medium text-[#3D2B1F] flex-1">
                      {op.nombre}
                    </span>
                    {op.precio_adicional > 0 && (
                      <span className="text-xs font-medium text-[#8B7A6A]">
                        +${op.precio_adicional}
                      </span>
                    )}
                  </label>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
