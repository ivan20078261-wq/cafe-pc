import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { motion, AnimatePresence } from 'framer-motion'
import { Building2, Coffee, Store, Utensils, Loader2, ChevronRight, CheckCircle } from 'lucide-react'
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
          style={{ backgroundColor: comercio.color_primario }}
        >
          {comercio.slug.includes('cafe') && <Coffee size={24} strokeWidth={1.5} />}
          {comercio.slug.includes('panaderia') && <Store size={24} strokeWidth={1.5} />}
          {comercio.slug.includes('resto') && <Utensils size={24} strokeWidth={1.5} />}
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
        style={{ backgroundColor: comercio.color_primario }}
      />
    </motion.button>
  )
}

export default function SeleccionComercio() {
  const navigate = useNavigate()
  const { usuario } = useAuth()
  const [comercios, setComercios] = useState([])
  const [cargando, setCargando] = useState(true)
  const [seleccionado, setSeleccionado] = useState(null)

  useEffect(() => {
    if (usuario?.comercios?.slug) {
      navigate(`/admin/${usuario.comercios.slug}`, { replace: true })
      return
    }
  }, [usuario, navigate])

  useEffect(() => {
    async function cargarComercios() {
      const { data, error } = await supabase
        .from('comercios')
        .select('*')
        .order('nombre')

      if (error) {
        console.error('Error cargando comercios:', error)
      } else {
        setComercios(data || [])
      }
      setCargando(false)
    }
    cargarComercios()
  }, [])

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FAF7F2] via-[#F5F0EB] to-[#F0EAE3] flex flex-col">
      <div className="absolute inset-0 opacity-[0.15] pointer-events-none" style={{
        backgroundImage: `radial-gradient(circle at 20% 30%, #C4A882 1px, transparent 1px),
                          radial-gradient(circle at 80% 70%, #C4A882 1px, transparent 1px)`,
        backgroundSize: '50px 50px'
      }} />

      <div className="relative flex-1 flex flex-col items-center justify-center px-4 py-12">
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
          <p className="text-[#8B7A6A]">Seleccioná tu comercio para continuar</p>
        </motion.div>

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
          style={{ backgroundColor: seleccionado ? '#C4A882' : '#E8DDD2' }}
        >
          Continuar
          <ChevronRight size={18} strokeWidth={2} className="inline-block ml-2" />
        </motion.button>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="px-4 py-6 text-center"
      >
        <p className="text-xs text-[#8B7A6A]/56A]/50">Comandera Digital v2.0 — Multi-comercio</p>
      </motion.div>
    </div>
  )
}