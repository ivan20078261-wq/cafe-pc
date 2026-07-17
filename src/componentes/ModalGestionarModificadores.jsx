import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Plus, Trash2, GripVertical, Sparkles } from 'lucide-react'
import { supabase } from '../supabase'

function GrupoModificador({ grupo, onActualizar, onEliminar }) {
  const [editando, setEditando] = useState(false)
  const [nombre, setNombre] = useState(grupo.nombre)
  const [tipo, setTipo] = useState(grupo.tipo)
  const [requerido, setRequerido] = useState(grupo.requerido)
  const [opciones, setOpciones] = useState(grupo.opciones || [])
  const [nuevaOpcion, setNuevaOpcion] = useState('')
  const [nuevoPrecio, setNuevoPrecio] = useState('')

  useEffect(() => {
    cargarOpciones()
  }, [grupo.id])

  async function cargarOpciones() {
    const { data } = await supabase
      .from('opciones_modificador')
      .select('*')
      .eq('modificador_id', grupo.id)
      .order('orden')
    if (data) setOpciones(data)
  }

  async function guardarGrupo() {
    const { error } = await supabase
      .from('modificadores')
      .update({ nombre, tipo, requerido })
      .eq('id', grupo.id)
    if (!error) {
      onActualizar()
      setEditando(false)
    }
  }

  async function agregarOpcion() {
    if (!nuevaOpcion.trim()) return
    const { error } = await supabase
      .from('opciones_modificador')
      .insert({
        modificador_id: grupo.id,
        nombre: nuevaOpcion.trim(),
        precio_adicional: parseFloat(nuevoPrecio) || 0,
        orden: opciones.length,
      })
    if (!error) {
      cargarOpciones()
      setNuevaOpcion('')
      setNuevoPrecio('')
    }
  }

  async function eliminarOpcion(id) {
    await supabase.from('opciones_modificador').delete().eq('id', id)
    cargarOpciones()
  }

  return (
    <div className="rounded-xl border border-[#E8DDD2] bg-white overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-[#FAF7F2]/50">
        <div className="flex items-center gap-2 min-w-0">
          <GripVertical size={14} className="text-[#DCCFC0] shrink-0" />
          {editando ? (
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="px-2 py-1 rounded-lg border border-[#E8DDD2] text-sm font-semibold text-[#3D2B1F] w-40"
              autoFocus
            />
          ) : (
            <span className="text-sm font-semibold text-[#3D2B1F]">{grupo.nombre}</span>
          )}
          <span className={`text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded font-semibold ${grupo.tipo === 'select' ? 'bg-blue-50 text-blue-500' : 'bg-purple-50 text-purple-500'}`}>
            {grupo.tipo === 'select' ? 'Elegir uno' : 'Varios'}
          </span>
          {grupo.requerido && (
            <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded font-semibold bg-red-50 text-red-400">
              Requerido
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {editando ? (
            <>
              <button onClick={guardarGrupo} className="px-3 py-1.5 bg-amber-600 text-white rounded-lg text-xs font-semibold hover:bg-amber-500 cursor-pointer">
                Guardar
              </button>
              <button onClick={() => setEditando(false)} className="px-3 py-1.5 border border-[#E8DDD2] rounded-lg text-xs font-semibold text-[#8B7A6A] hover:text-[#3D2B1F] cursor-pointer">
                Cancelar
              </button>
            </>
          ) : (
            <>
              <button onClick={() => setEditando(true)} className="w-7 h-7 rounded-lg hover:bg-[#F5F0EB] flex items-center justify-center text-[#8B7A6A] hover:text-[#3D2B1F] cursor-pointer">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              </button>
              <button onClick={() => onEliminar(grupo.id)} className="w-7 h-7 rounded-lg hover:bg-red-50 flex items-center justify-center text-red-400 hover:text-red-600 cursor-pointer">
                <Trash2 size={14} strokeWidth={1.5} />
              </button>
            </>
          )}
        </div>
      </div>

      {editando && (
        <div className="px-4 py-2 border-b border-[#E8DDD2] flex items-center gap-4">
          <label className="flex items-center gap-2 text-xs text-[#8B7A6A]">
            <select value={tipo} onChange={(e) => setTipo(e.target.value)} className="px-2 py-1 rounded-lg border border-[#E8DDD2] text-xs bg-white">
              <option value="select">Elegir uno</option>
              <option value="multi">Varios</option>
            </select>
          </label>
          <label className="flex items-center gap-1.5 text-xs text-[#8B7A6A] cursor-pointer">
            <input type="checkbox" checked={requerido} onChange={(e) => setRequerido(e.target.checked)} className="w-3.5 h-3.5 rounded border-[#E8DDD2] text-amber-600" />
            Requerido
          </label>
        </div>
      )}

      <div className="px-4 py-2 space-y-1">
        {opciones.map((op) => (
          <div key={op.id} className="flex items-center justify-between gap-2 py-1.5">
            <div className="flex items-center gap-2 min-w-0">
              <Sparkles size={12} className="text-amber-400 shrink-0" />
              <span className="text-sm text-[#3D2B1F]">{op.nombre}</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs font-medium text-[#8B7A6A] tabular-nums">
                {op.precio_adicional > 0 ? `+$${op.precio_adicional}` : '—'}
              </span>
              <button onClick={() => eliminarOpcion(op.id)} className="w-6 h-6 rounded hover:bg-red-50 flex items-center justify-center text-red-300 hover:text-red-500 cursor-pointer">
                <X size={10} />
              </button>
            </div>
          </div>
        ))}
        {editando && (
          <div className="flex items-center gap-2 pt-1 pb-1">
            <input
              type="text"
              value={nuevaOpcion}
              onChange={(e) => setNuevaOpcion(e.target.value)}
              placeholder="Nueva opción..."
              className="flex-1 px-2 py-1.5 rounded-lg border border-[#E8DDD2] text-xs focus:outline-none focus:ring-1 focus:ring-amber-200"
              onKeyDown={(e) => e.key === 'Enter' && agregarOpcion()}
            />
            <input
              type="number"
              value={nuevoPrecio}
              onChange={(e) => setNuevoPrecio(e.target.value)}
              placeholder="$0"
              className="w-16 px-2 py-1.5 rounded-lg border border-[#E8DDD2] text-xs focus:outline-none focus:ring-1 focus:ring-amber-200 text-right"
              onKeyDown={(e) => e.key === 'Enter' && agregarOpcion()}
            />
            <button onClick={agregarOpcion} className="w-7 h-7 rounded-lg bg-amber-100 text-amber-600 hover:bg-amber-200 flex items-center justify-center cursor-pointer" disabled={!nuevaOpcion.trim()}>
              <Plus size={12} />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default function ModalGestionarModificadores({ abierto, onCerrar, comercioId }) {
  const [grupos, setGrupos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [creando, setCreando] = useState(false)
  const [nuevoNombre, setNuevoNombre] = useState('')
  const [nuevoTipo, setNuevoTipo] = useState('select')
  const [nuevoRequerido, setNuevoRequerido] = useState(false)

  useEffect(() => {
    if (abierto && comercioId) cargarGrupos()
  }, [abierto, comercioId])

  async function cargarGrupos() {
    setCargando(true)
    const { data } = await supabase
      .from('modificadores')
      .select('*')
      .eq('comercio_id', comercioId)
      .order('orden')
    setGrupos(data || [])
    setCargando(false)
  }

  async function crearGrupo() {
    if (!nuevoNombre.trim()) return
    const { data, error } = await supabase
      .from('modificadores')
      .insert({
        comercio_id: comercioId,
        nombre: nuevoNombre.trim(),
        tipo: nuevoTipo,
        requerido: nuevoRequerido,
        orden: grupos.length,
      })
      .select()
    if (!error && data) {
      setGrupos((prev) => [...prev, data[0]])
      setNuevoNombre('')
      setCreando(false)
    }
  }

  async function eliminarGrupo(id) {
    await supabase.from('modificadores').delete().eq('id', id)
    setGrupos((prev) => prev.filter((g) => g.id !== id))
  }

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
            onClick={onCerrar}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="fixed inset-4 md:inset-auto md:top-[5%] md:left-1/2 md:-translate-x-1/2 md:w-[600px] md:max-h-[90vh] z-50 bg-white rounded-2xl border border-[#E8DDD2] shadow-2xl flex flex-col overflow-hidden"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#E8DDD2] bg-gradient-to-r from-amber-50/50 to-white">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-100/80 border border-amber-200/60 flex items-center justify-center text-amber-600">
                  <Sparkles size={18} strokeWidth={1.5} />
                </div>
                <h2 className="text-lg font-bold text-[#3D2B1F]">Modificadores</h2>
              </div>
              <button onClick={onCerrar} className="w-8 h-8 rounded-lg hover:bg-[#F5F0EB] flex items-center justify-center text-[#8B7A6A] hover:text-[#3D2B1F] transition-colors cursor-pointer">
                <X size={18} strokeWidth={1.5} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {!creando && (
                <button
                  onClick={() => setCreando(true)}
                  className="w-full py-3 rounded-xl border-2 border-dashed border-[#E8DDD2] text-sm font-semibold text-[#8B7A6A] hover:border-amber-300 hover:text-amber-600 hover:bg-amber-50/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Plus size={16} />
                  Agregar grupo de modificadores
                </button>
              )}

              {creando && (
                <div className="rounded-xl border border-[#E8DDD2] bg-[#FAF7F2]/50 p-4 space-y-3">
                  <input
                    type="text"
                    value={nuevoNombre}
                    onChange={(e) => setNuevoNombre(e.target.value)}
                    placeholder="Nombre del grupo (ej: Tamaño, Tipo de leche, Extras...)"
                    className="w-full px-3 py-2 rounded-lg border border-[#E8DDD2] text-sm focus:outline-none focus:ring-2 focus:ring-amber-200"
                    autoFocus
                    onKeyDown={(e) => e.key === 'Enter' && crearGrupo()}
                  />
                  <div className="flex items-center gap-4">
                    <select value={nuevoTipo} onChange={(e) => setNuevoTipo(e.target.value)} className="px-3 py-2 rounded-lg border border-[#E8DDD2] text-sm bg-white">
                      <option value="select">Elegir uno</option>
                      <option value="multi">Seleccionar varios</option>
                    </select>
                    <label className="flex items-center gap-1.5 text-sm text-[#8B7A6A] cursor-pointer">
                      <input type="checkbox" checked={nuevoRequerido} onChange={(e) => setNuevoRequerido(e.target.checked)} className="w-4 h-4 rounded border-[#E8DDD2] text-amber-600" />
                      Requerido
                    </label>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={crearGrupo} disabled={!nuevoNombre.trim()} className="px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-semibold hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer">
                      Crear grupo
                    </button>
                    <button onClick={() => { setCreando(false); setNuevoNombre('') }} className="px-4 py-2 border border-[#E8DDD2] rounded-lg text-sm font-semibold text-[#8B7A6A] hover:text-[#3D2B1F] cursor-pointer">
                      Cancelar
                    </button>
                  </div>
                </div>
              )}

              {cargando ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-5 h-5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : grupos.length === 0 && !creando ? (
                <div className="text-center py-12 text-[#8B7A6A]">
                  <Sparkles size={32} className="mx-auto mb-3 opacity-50" />
                  <p className="text-sm">No hay grupos de modificadores</p>
                  <p className="text-xs mt-1 text-[#DCCFC0]">Crea grupos como "Tamaño", "Tipo de leche" o "Extras"</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {grupos.map((grupo) => (
                    <GrupoModificador
                      key={grupo.id}
                      grupo={grupo}
                      onActualizar={cargarGrupos}
                      onEliminar={eliminarGrupo}
                    />
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2.5 px-6 py-4 border-t border-[#E8DDD2] bg-[#FAF7F2]/50">
              <button onClick={onCerrar} className="px-4 py-2.5 rounded-xl border border-[#E8DDD2] bg-white text-[#8B7A6A] text-sm font-semibold hover:text-[#3D2B1F] hover:border-[#DCCFC0] transition-all cursor-pointer">
                Cerrar
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
