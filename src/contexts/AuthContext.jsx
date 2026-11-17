import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [authUser, setAuthUser] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setAuthUser(session.user)
        cargarUsuario(session.user)
      } else {
        setCargando(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setAuthUser(session.user)
        cargarUsuario(session.user)
      } else {
        setAuthUser(null)
        setUsuario(null)
        setCargando(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function cargarUsuario(sessionUser) {
    const { data } = await supabase
      .from('usuarios')
      .select('*, comercios(nombre, slug, logo_url)')
      .eq('auth_uid', sessionUser.id)
      .maybeSingle()

    if (data) {
      setUsuario(data)
    } else {
      // Autenticado en Supabase pero sin registro en usuarios → mostrar error
      setUsuario(null)
    }
    setCargando(false)
  }

  async function login(email, password) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  async function register(email, password, nombre, comercioId, rol = 'dueno') {
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) throw error

    if (comercioId) {
      const { error: insertError } = await supabase.rpc('crear_usuario', {
        p_auth_uid: data.user.id,
        p_email: email,
        p_nombre: nombre,
        p_comercio_id: comercioId,
        p_rol: rol,
      })
      if (insertError) throw insertError
    }

    // Si el email está auto-confirmado, recargamos los datos del usuario
    if (data.session) {
      await cargarUsuario(data.user)
      return true
    }
    return false
  }

  async function logout() {
    await supabase.auth.signOut()
    setUsuario(null)
    setAuthUser(null)
  }

  return (
      <AuthContext.Provider value={{ usuario, cargando, authUser, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
