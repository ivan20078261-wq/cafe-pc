import { Routes, Route, Navigate, useParams } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import AdminPanel from './componentes/AdminPanel'
import SeleccionComercio from './componentes/SeleccionComercio'
import Login from './componentes/Login'
import ProtectedRoute from './componentes/ProtectedRoute'

function RedirectAdmin() {
  const { comercio_slug } = useParams()
  return <Navigate to={`/admin/${comercio_slug}`} replace />
}

function RedirectCarta() {
  const { comercio_slug, numero_mesa } = useParams()
  const cartaBase = import.meta.env.VITE_CARTA_URL || window.location.origin
  const destino = `${cartaBase}/${comercio_slug}/mesa/${numero_mesa}`
  return <Navigate to={destino} replace />
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<SeleccionComercio />} />
        <Route path="/admin/:comercio_slug" element={
          <ProtectedRoute>
            <AdminPanel />
          </ProtectedRoute>
        } />
        <Route path="/:comercio_slug/mesa/:numero_mesa" element={<RedirectCarta />} />
        <Route path="/:comercio_slug" element={<RedirectAdmin />} />
      </Routes>
    </AuthProvider>
  )
}
