import {
  Coffee, CupSoda, Croissant, IceCream, Cookie,
  Milk, Martini
} from 'lucide-react'
import EtiquetaModificador from './EtiquetaModificador'

const iconosPorNombre = {
  'flat white': Coffee,
  'latte': CupSoda,
  'cold brew': Coffee,
  'cappuccino': Coffee,
  'miel latte': CupSoda,
  'mocatha': Martini,
  'affogato': IceCream,
  'espresso': Coffee,
  'golden milk': Milk,
  'v60': Coffee,
  'matcha latte': CupSoda,
  'tostada': Croissant,
  'croissant': Croissant,
  'brownie': Cookie,
  'helado': IceCream,
}

function obtenerIcono(nombre) {
  const clave = nombre.toLowerCase()
  for (const [palabra, Icono] of Object.entries(iconosPorNombre)) {
    if (clave.includes(palabra)) return Icono
  }
  return Coffee
}

function obtenerTextoMod(mod) {
  if (typeof mod === 'string') return mod
  if (mod?.nombre) return mod.nombre
  return String(mod)
}

function ItemProducto({ producto }) {
  const Icono = obtenerIcono(producto.nombre)

  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-[#E8DDD2]/80 last:border-b-0 group">
      <div className="mt-0.5 shrink-0 w-8 h-8 rounded-lg bg-amber-100/60 flex items-center justify-center text-amber-600/70 group-hover:bg-amber-200/60 group-hover:text-amber-700 transition-colors">
        <Icono size={16} strokeWidth={1.5} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="text-[#3D2B1F] font-semibold text-sm truncate">
            {producto.nombre}
          </span>
          {producto.cantidad > 1 && (
            <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-amber-200/70 text-amber-800 text-[10px] font-bold">
              x{producto.cantidad}
            </span>
          )}
        </div>
        {producto.modificadores && producto.modificadores.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            {producto.modificadores.map((mod, i) => (
              <EtiquetaModificador key={i} texto={obtenerTextoMod(mod)} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default ItemProducto
