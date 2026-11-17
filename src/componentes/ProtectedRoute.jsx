import { Navigate, useParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Loader2 } from 'lucide-react'

export default function ProtectedRoute({ children }) {
  const { usuario, authUser, cargando } = useAuth()
  const { comercio_slug } = useParams()

  if (cargando) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-[#FAF7F2] via-[#F5F0EB] to-[#F0EAE3]">
        <div className="flex items-center gap-3">
          <Loader2 size={20} className="animate-spin text-amber-500" />
          <span className="text-sm font-medium text-[#8B7A6A]">Verificando sesión...</span>
        </div>
      </div>
    )
  }

  if (!authUser) {
    return <Navigate to="/login" replace />
  }

  if (!usuario) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-[#FAF7F2] via-[#F5F0EB] to-[#F0EAE3] px-4">
        <div className="bg-white rounded-2xl border border-[#E8DDD2] shadow-xl p-8 max-w-sm text-center">
          <h2 className="text-lg font-bold text-[#3D2B1F] mb-2">Sin acceso</h2>
          <p className="text-sm text-[#8B7A6A] mb-6">
            Tu usuario no está vinculado a ningún comercio. Contactá al dueño para que te agregue.
          </p>
          <a
            href="/login"
            className="inline-block px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 text-white text-sm font-semibold"
          >
            Volver
          </a>
        </div>
      </div>
    )
  }

  if (comercio_slug && usuario.comercios?.slug !== comercio_slug) {
    return <Navigate to="/" replace />
  }

  return children
}
