import { motion } from 'framer-motion'

const filtros = [
  { key: 'todos', label: 'Todos' },
  { key: 'pendiente', label: 'Pendientes' },
  { key: 'preparando', label: 'Preparando' },
  { key: 'entregado', label: 'Entregados' },
  { key: 'cancelado', label: 'Cancelados' },
]

function FiltrosEstado({ filtro, onChange }) {
  return (
    <div className="flex gap-1.5 px-6 pt-3">
      {filtros.map((f) => (
        <button
          key={f.key}
          onClick={() => onChange(f.key)}
          className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
            filtro === f.key
              ? 'text-[#3D2B1F]'
              : 'text-[#8B7A6A]/70 hover:text-[#6B5A4A] hover:bg-white/40'
          }`}
        >
          {filtro === f.key && (
            <motion.div
              layoutId="fondo-filtro"
              className="absolute inset-0 bg-white rounded-lg border border-[#E8DDD2] shadow-sm"
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            />
          )}
          <span className="relative z-10">{f.label}</span>
        </button>
      ))}
    </div>
  )
}

export default FiltrosEstado
