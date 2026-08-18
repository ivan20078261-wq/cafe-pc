import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Coffee,
  ClipboardList,
  ChefHat,
  Timer,
  Plus,
  CookingPot,
  Table,
  PackageCheck,
  BarChart3,
  Package,
  LogOut,
  QrCode,
} from "lucide-react";
function Reloj() {
  const [hora, setHora] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setHora(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex items-center gap-2 bg-white/70 rounded-xl px-4 py-2 border border-[#E8DDD2] shadow-sm">
      <Timer size={19} strokeWidth={1.5} className="text-orange-600" />
      <span className="text-[#6B5A4A] text-lg font-extrabold tabular-nums tracking-wider ">
        {hora.toLocaleTimeString("es-AR", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })}
      </span>
    </div>
  );
}

const vistas = [
  { key: "cocina", label: "Cocina", icon: CookingPot },
  { key: "sala", label: "Sala", icon: Table },
  { key: "dashboard", label: "Dashboard", icon: BarChart3 },
];
function Encabezado({
  vista,
  onChangeVista,
  pedidosActivos,
  enPreparacion,
  entregados,
  onNuevoPedido,
  onGestionarProductos,
  usuario,
  onLogout,
onAbrirQR,
}) {
    return (
    <header className="relative flex items-center justify-between px-6 py-3 border-b border-[#E8DDD2] bg-white/60 backdrop-blur-md">
      <div className="flex items-center gap-4">
        <div className="relative">
          <div className="flex items-center justify-center w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-100 to-amber-50 border border-amber-200/60 shadow-sm">
            <Coffee size={24} strokeWidth={1.5} className="text-amber-700" />
          </div>
          <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-400 border-2 border-white flex items-center justify-center">
            <ChefHat size={8} strokeWidth={2.5} className="text-white" />
          </div>
        </div>
        <div>
          <h1 className="text-[#3D2B1F] text-lg font-bold tracking-tight leading-tight">
            Cafetería
          </h1>
          <p className="text-[#8B7A6A] text-[10px] tracking-wide">
            Comandera Digital
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 bg-white/80 rounded-xl p-1 border border-[#E8DDD2] shadow-sm">
        {vistas.map((v) => {
          const Icono = v.icon;
          const activa = vista === v.key;
          return (
            <button
              key={v.key}
              onClick={() => onChangeVista(v.key)}
              className={`relative flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                activa
                  ? "text-[#3D2B1F]"
                  : "text-[#8B7A6A]/70 hover:text-[#6B5A4A]"
              }`}
            >
              {activa && (
                <motion.div
                  layoutId="vista-tab"
                  className="absolute inset-0 bg-white rounded-lg border border-[#E8DDD2] shadow-sm"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-1.5">
                <Icono size={16} strokeWidth={1.5} />
                {v.label}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-3">
        {enPreparacion > 0 && vista === "cocina" && (
          <div className="hidden sm:flex items-center gap-1.5 bg-amber-50/80 rounded-xl px-3.5 py-2 border border-amber-200/60 shadow-sm">
            <CookingPot
              size={16}
              strokeWidth={1.5}
              className="text-amber-600/60"
            />
            <span className="text-[#3D2B1F] text-sm font-semibold tabular-nums">
              {enPreparacion}
            </span>
            <span className="text-[#8B7A6A] text-xs font-medium">
              en cocina
            </span>
          </div>
        )}

        {entregados > 0 && vista === "cocina" && (
          <div className="hidden sm:flex items-center gap-1.5 bg-emerald-50/80 rounded-xl px-3.5 py-2 border border-emerald-200/60 shadow-sm">
            <PackageCheck
              size={16}
              strokeWidth={1.5}
              className="text-emerald-600/60"
            />
            <span className="text-[#3D2B1F] text-sm font-semibold tabular-nums">
              {entregados}
            </span>
            <span className="text-[#8B7A6A] text-xs font-medium">listos</span>
          </div>
        )}
        <button
          onClick={onAbrirQR}
          className="bg-amber-400 flex items-center gap-1.5 px-3.5 py-2 rounded-xl hover:to-amber-400 text-white text-sm font-semibold transition-all cursor-pointer"
        >
          <QrCode size={23} strokeWidth={3.0} />
        </button>

        <div className="flex items-center gap-2.5 bg-white/70 rounded-xl px-4 py-2 border border-[#E8DDD2] shadow-sm">
          <ClipboardList
            size={18}
            strokeWidth={1.5}
            className="text-amber-600/60"
          />
          <span className="text-[#3D2B1F] text-sm font-semibold tabular-nums">
            {pedidosActivos}
          </span>
          <span className="text-[#8B7A6A] text-xs font-medium hidden sm:inline">
            {pedidosActivos === 1 ? "activo" : "activos"}
          </span>
          {pedidosActivos > 0 && (
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          )}
        </div>

        <button
          onClick={onNuevoPedido}
          className="bg-amber-400 flex items-center gap-1.5 px-3.5 py-2 rounded-xl hover:to-amber-400 text-white text-sm font-semibold transition-all cursor-pointer"
        >
          <Plus size={16} strokeWidth={2} />
          <span className="hidden sm:inline">Nuevo</span>
        </button>

        <button
          onClick={onGestionarProductos}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#E8DDD2] bg-white/70 hover:bg-white text-[#8B7A6A] hover:text-[#3D2B1F] text-sm font-semibold transition-all cursor-pointer"
          title="Gestionar menú"
        >
          <Package size={16} strokeWidth={1.5} />
          <span className="hidden sm:inline">Menú</span>
        </button>

        {usuario && (
          <div className="hidden md:flex items-center gap-2 bg-white/70 rounded-xl px-3 py-1.5 border border-[#E8DDD2] shadow-sm">
            <span className="text-xs text-[#8B7A6A] font-medium">
              {usuario.nombre || usuario.email}
            </span>
            <span className="text-[10px] uppercase tracking-wider text-[#DCCFC0] font-semibold">
              {usuario.rol}
            </span>
          </div>
        )}

        <button
          onClick={onLogout}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#E8DDD2] bg-white/70 hover:bg-white text-[#8B7A6A] hover:text-red-500 text-sm font-semibold transition-all cursor-pointer"
          title="Cerrar sesión"
        >
          <LogOut size={16} strokeWidth={1.5} />
        </button>

        <Reloj />
      </div>
    </header>
  );
}

export default Encabezado;
