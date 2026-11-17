import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { motion, AnimatePresence } from 'framer-motion'
import { Building2, Coffee, Store, Utensils, Loader2, ChevronRight, CheckCircle, Plus, LogIn } from 'lucide-react'
import { supabase } from '../supabase'

function TarjetaComercio({ comercio, seleccionado, onClick }) {
  return (
    <motion.button
      onClick={() => onClick(comercio)}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`relative w-full p-5 rounded-2xl border-2 transition-all ${
        seleccionado
          ? 'border-amber-400 bg-amber-50/50 shadow-lg shadow-amber-100/50'
          : 'border-[#E8DDD2] bg-white hover:border-[#DCCFC0] hover:shadow-md'
      }`}
      style={{ borderColor: seleccionado ? comercio.color_primario : undefined }}
    >
      <div className="flex items-start gap-4">
        <div
          className="w-14 h-14 rounded-xl flex items-center justify-center text-white shrink-0"
          style={{ backgroundColor: comercio.color_primario || '#C4A882' }}
        >
          {comercio.slug.includes('cafe') && <Coffee size={24} strokeWidth={1.5} />}
          {comercio.slug.includes('panaderia') && <Store size={24} strokeWidth={1.5} />}
          {comercio.slug.includes('resto') && <Utensils size={24} strokeWidth={1.5} />}
          {!comercio.slug.includes('cafe') && !comercio.slug.includes('panaderia') && !comercio.slug.includes('resto') && (
            <Store size={24} strokeWidth={1.5} />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold text-[#3D2B1F] truncate">{comercio.nombre}</h3>
          <p className="text-sm text-[#8B7A6A] mt-0.5 truncate">{comercio.slug}</p>
        </div>
        <AnimatePresence>
          {seleccionado && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center text-white"
            >
              <CheckCircle size={16} strokeWidth={2.5} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: seleccionado ? '100%' : 0 }}
        className="absolute bottom-0 left-0 h-1 rounded-bl-2xl rounded-br-2xl"
        style={{ backgroundColor: comercio.color_primario || '#C4A882' }}
      />
    </motion.button>
  )
}

export default function SeleccionComercio() {
  const navigate = useNavigate()
  const { usuario, authUser } = useAuth()
  const [comercios, setComercios] = useState([])
  const [cargando, setCargando] = useState(true)
  const [seleccionado, setSeleccionado] = useState(null)

  const [mostrarCrear, setMostrarCrear] = useState(false)
  const [nuevoNombre, setNuevoNombre] = useState('')
  const [nuevoColor, setNuevoColor] = useState('#C4A882')
  const [creando, setCreando] = useState(false)
  const [errorCrear, setErrorCrear] = useState('')

  useEffect(() => {
    if (usuario?.comercios?.slug) {
      navigate(`/admin/${usuario.comercios.slug}`, { replace: true })
      return
    }
  }, [usuario, navigate])

  useEffect(() => {
    async function cargarMisComercios() {
      if (!authUser?.id) {
        setCargando(false)
        return
      }
      const { data, error } = await supabase
        .from('usuarios')
        .select('id, comercios(id, nombre, slug, color_primario)')
        .eq('auth_uid', authUser.id)

      if (error) {
        console.error('Error cargando comercios:', error)
      } else {
        const misComercios = (data || [])
          .map((u) => u.comercios)
          .filter(Boolean)
        setComercios(misComercios)
      }
      setCargando(false)
    }
    cargarMisComercios()
  }, [authUser])

  async function crearComercio(e) {
    e.preventDefault()
    setErrorCrear('')
    if (!nuevoNombre.trim()) return
    setCreando(true)
    const { data: nuevoId, error } = await supabase
      .rpc('crear_comercio', { p_nombre: nuevoNombre.trim(), p_color: nuevoColor })
    setCreando(false)
    if (error) {
      console.error(error)
      setErrorCrear('No se pudo crear el comercio. ¿Tenés sesión iniciada?')
      return
    }
    const { data: creado } = await supabase
      .from('comercios')
      .select('slug')
      .eq('id', nuevoId)
      .single()
    if (creado?.slug) {
      window.location.href = `/admin/${creado.slug}`
    } else {
      window.location.reload()
    }
  }

  if (cargando) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#FAF7F2] via-[#F5F0EB] to-[#F0EAE3]">
        <div className="flex items-center gap-3">
          <Loader2 size={24} className="animate-spin text-amber-500" />
          <span className="text-sm font-medium text-[#8B7A6A]">Cargando comercios...</span>
        </div>
      </div>
    )
  }

  if (!authUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FAF7F2] via-[#F5F0EB] to-[#F0EAE3] flex flex-col items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm bg-white rounded-2xl border border-[#E8DDD2] shadow-xl p-8 text-center"
        >
          <div className="w-14 h-14 rounded-xl mx-auto mb-4 flex items-center justify-center text-white" style={{ backgroundColor: '#C4A882' }}>
            <Building2 size={24} strokeWidth={1.5} />
          </div>
          <h1 className="text-xl font-bold text-[#3D2B1F] mb-1">Comandera Digital</h1>
          <p className="text-sm text-[#8B7A6A] mb-6">Iniciá sesión para ver tus comercios.</p>
          <button
            onClick={() => navigate('/login')}
            className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 text-white font-semibold cursor-pointer"
          >
            <LogIn size={16} strokeWidth={2} />
            Iniciar sesión
          </button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FAF7F2] via-[#F5F0EB] to-[#F0EAE3] relative">
      <div className="absolute inset-0 opacity-[0.15] pointer-events-none" style={{
        backgroundImage: `radial-gradient(circle at 20% 30%, #C4A882 1px, transparent 1px),
                          radial-gradient(circle at 80% 70%, #C4A882 1px, transparent 1px)`,
        backgroundSize: '50px 50px'
      }} />

      <div className="relative min-h-screen flex flex-col items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-2xl text-center mb-10"
        >
          <div className="w-20 h-20 rounded-2xl mx-auto mb-5 flex items-center justify-center text-white" style={{ backgroundColor: '#C4A882' }}>
            <Building2 size={32} strokeWidth={1.5} />
          </div>
          <h1 className="text-3xl font-bold text-[#3D2B1F] mb-2">Comandera Digital</h1>
          <p className="text-[#8B7A6A]">
            {comercios.length > 0
              ? 'Seleccioná tu comercio para continuar'
              : 'Todavía no tenés comercios asignados'}
          </p>
        </motion.div>

        {comercios.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="w-full max-w-2xl space-y-4"
          >
            {comercios.map((comercio, i) => (
              <motion.div
                key={comercio.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.15 + i * 0.08 }}
              >
                <TarjetaComercio
                  comercio={comercio}
                  seleccionado={seleccionado === comercio.id}
                  onClick={() => setSeleccionado(comercio.id)}
                />
              </motion.div>
            ))}
          </motion.div>
        )}

        {comercios.length > 0 ? (
          <motion.button
            onClick={() => {
              if (seleccionado) {
                const slug = comercios.find((c) => c.id === seleccionado)?.slug
                if (slug) navigate(`/admin/${slug}`)
              }
            }}
            disabled={!seleccionado}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="w-full max-w-2xl mt-8 px-6 py-4 rounded-xl font-semibold text-lg text-white transition-all shadow-lg shadow-amber-200/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
            style={{
              backgroundColor: seleccionado
                ? comercios.find((c) => c.id === seleccionado)?.color_primario || '#C4A882'
                : '#E8DDD2',
            }}
          >
            Continuar
            <ChevronRight size={18} strokeWidth={2} className="inline-block ml-2" />
          </motion.button>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
            className="w-full max-w-2xl"
          >
            {mostrarCrear ? (
              <form
                onSubmit={crearComercio}
                className="bg-white rounded-2xl border border-[#E8DDD2] shadow-xl p-6 space-y-4"
              >
                <h2 className="font-bold text-[#3D2B1F] flex items-center gap-2">
                  <Plus size={18} strokeWidth={1.5} className="text-amber-600" />
                  Crear tu comercio
                </h2>
                <input
                  type="text"
                  value={nuevoNombre}
                  onChange={(e) => setNuevoNombre(e.target.value)}
                  placeholder="Nombre del comercio (ej: Café Central)"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-[#E8DDD2] text-sm focus:outline-none focus:ring-2 focus:ring-amber-200"
                />
                <div className="flex items-center gap-3 text-sm text-[#8B7A6A]">
                  <input
                    type="color"
                    value={nuevoColor}
                    onChange={(e) => setNuevoColor(e.target.value)}
                    className="w-10 h-10 rounded-lg border border-[#E8DDD2] cursor-pointer"
                  />
                  Color de marca
                </div>
                {errorCrear && <p className="text-sm text-red-500">{errorCrear}</p>}
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setMostrarCrear(false)}
                    className="px-4 py-2.5 rounded-xl border border-[#E8DDD2] text-sm text-[#8B7A6A] cursor-pointer"
                  >
                    Volver
                  </button>
                  <button
                    type="submit"
                    disabled={creando || !nuevoNombre.trim()}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 text-white text-sm font-semibold disabled:opacity-50 cursor-pointer"
                  >
                    {creando && <Loader2 size={14} className="animate-spin inline mr-2" />}
                    Crear y abrir panel
                  </button>
                </div>
                <p className="text-[11px] text-[#8B7A6A]/70">
                  Se crea tu comercio con 10 mesas listas para escanear con QR.
                </p>
              </form>
            ) : (
              <button
                onClick={() => setMostrarCrear(true)}
                className="w-full px-6 py-4 rounded-xl border-2 border-dashed border-[#DCCFC0] bg-white/60 hover:bg-white hover:border-amber-300 text-[#8B7A6A] hover:text-amber-600 font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Plus size={18} strokeWidth={1.5} />
                Crear tu comercio
              </button>
            )}
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="px-4 py-6 text-center mt-4"
        >
          <p className="text-xs text-[#8B7A6A]/50">Comandera Digital v2.0 — Multi-comercio</p>
        </motion.div>
      </div>
    </div>
  )
}