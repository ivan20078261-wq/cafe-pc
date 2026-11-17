import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Coffee, Loader2, Eye, EyeOff, Building2 } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../supabase'

export default function Login() {
  const navigate = useNavigate()
  const { login, register, authUser, cargando } = useAuth()
  const [modo, setModo] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nombre, setNombre] = useState('')
  const [comercios, setComercios] = useState([])
  const [comercioId, setComercioId] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [registrado, setRegistrado] = useState(false)

  useEffect(() => {
    if (modo === 'register') {
      supabase.from('comercios').select('id, nombre, slug').then(({ data }) => {
        if (data) setComercios(data)
      })
    }
  }, [modo])

  useEffect(() => {
    if (authUser && !cargando && modo === 'login') navigate('/', { replace: true })
  }, [authUser, cargando, modo])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setEnviando(true)

    try {
      if (modo === 'register') {
        const autoConfirm = await register(email, password, nombre, comercioId)
        if (autoConfirm) {
          navigate('/', { replace: true })
        } else {
          setRegistrado(true)
        }
      } else {
        await login(email, password)
        navigate('/')
      }
    } catch (err) {
      if (modo === 'register') {
        if (err.message === 'User already registered') {
          setError('Ya existe un usuario con ese email')
        } else {
          setError('Error al registrarse')
        }
      } else {
        setError(err.message === 'Invalid login credentials'
          ? 'Email o contraseña incorrectos'
          : 'Error al iniciar sesión')
      }
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FAF7F2] via-[#F5F0EB] to-[#F0EAE3] flex items-center justify-center px-4">
      <div className="absolute inset-0 opacity-[0.15] pointer-events-none" style={{
        backgroundImage: `radial-gradient(circle at 20% 30%, #C4A882 1px, transparent 1px),
                          radial-gradient(circle at 80% 70%, #C4A882 1px, transparent 1px)`,
        backgroundSize: '50px 50px'
      }} />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-sm"
      >
        <div className="bg-white rounded-2xl border border-[#E8DDD2] shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-100 to-amber-50 border border-amber-200/60 flex items-center justify-center mx-auto mb-4 shadow-sm">
              <Coffee size={28} strokeWidth={1.5} className="text-amber-700" />
            </div>
            <h1 className="text-xl font-bold text-[#3D2B1F]">Comandera Digital</h1>
            <p className="text-sm text-[#8B7A6A] mt-1">
              {modo === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {modo === 'register' && (
              <>
                <div>
                  <label className="block text-sm font-semibold text-[#3D2B1F] mb-1">Nombre</label>
                  <input
                    type="text"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    placeholder="Tu nombre"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8DDD2] bg-white text-[#3D2B1F] text-sm focus:outline-none focus:ring-2 focus:ring-amber-200 focus:border-amber-300 placeholder:text-[#DCCFC0]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#3D2B1F] mb-1">Comercio (opcional)</label>
                  <div className="relative">
                    <select
                      value={comercioId}
                      onChange={(e) => setComercioId(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8DDD2] bg-white text-[#3D2B1F] text-sm focus:outline-none focus:ring-2 focus:ring-amber-200 focus:border-amber-300 appearance-none pr-10"
                    >
                      <option value="">Soy dueño — crearé mi comercio después</option>
                      {comercios.length > 0 && <option value="" disabled>── Unirme a un comercio existente ──</option>}
                      {comercios.map((c) => (
                        <option key={c.id} value={c.id}>{c.nombre}</option>
                      ))}
                    </select>
                    <Building2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8B7A6A] pointer-events-none" />
                  </div>
                </div>
              </>
            )}
            <div>
              <label className="block text-sm font-semibold text-[#3D2B1F] mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8DDD2] bg-white text-[#3D2B1F] text-sm focus:outline-none focus:ring-2 focus:ring-amber-200 focus:border-amber-300 placeholder:text-[#DCCFC0]"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#3D2B1F] mb-1">Contraseña</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8DDD2] bg-white text-[#3D2B1F] text-sm focus:outline-none focus:ring-2 focus:ring-amber-200 focus:border-amber-300 placeholder:text-[#DCCFC0] pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8B7A6A] hover:text-[#3D2B1F] cursor-pointer"
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>
            )}

            <button
              type="submit"
              disabled={enviando}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 disabled:from-[#E8DDD2] disabled:to-[#E8DDD2] disabled:text-[#DCCFC0] text-white text-sm font-semibold transition-all shadow-lg shadow-amber-200/50 disabled:shadow-none cursor-pointer disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {enviando ? <Loader2 size={16} className="animate-spin" /> : null}
              {enviando ? (modo === 'register' ? 'Creando cuenta...' : 'Ingresando...') : (modo === 'register' ? 'Crear cuenta' : 'Ingresar')}
            </button>

            {modo === 'register' && registrado && (
              <div className="text-sm text-emerald-600 bg-emerald-50 rounded-lg px-3 py-2">
                Cuenta creada. {comercios.find(c => c.id === comercioId)?.nombre ? `Vinculada a ${comercios.find(c => c.id === comercioId)?.nombre}. ` : ''}Ahora podés iniciar sesión.
              </div>
            )}

            <p className="text-sm text-center text-[#8B7A6A]">
              {modo === 'login' ? (
                <>¿No tenés cuenta?{' '}
                  <button type="button" onClick={() => { setModo('register'); setError(''); }} className="text-amber-600 hover:text-amber-500 font-semibold cursor-pointer">
                    Registrarse
                  </button>
                </>
              ) : (
                <>¿Ya tenés cuenta?{' '}
                  <button type="button" onClick={() => { setModo('login'); setError(''); }} className="text-amber-600 hover:text-amber-500 font-semibold cursor-pointer">
                    Iniciar sesión
                  </button>
                </>
              )}
            </p>
          </form>
        </div>
      </motion.div>
    </div>
  )
}
