export const ROLES = {
  dueno: 'dueno',
  cajero: 'cajero',
  cocina: 'cocina',
}

const ACCIONES = {
  gestionar: ['dueno'],
  crearPedido: ['dueno', 'cajero'],
  cancelarPedido: ['dueno', 'cajero'],
  verSala: ['dueno', 'cajero'],
  verDashboard: ['dueno', 'cajero'],
}

export function puede(rol, accion) {
  const permitidos = ACCIONES[accion]
  if (!permitidos) return true
  return permitidos.includes(rol)
}