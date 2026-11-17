import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Coffee,
  ClipboardList,
  CookingPot,
  Timer,
  Plus,
  Table,
  PackageCheck,
  BarChart3,
  Package,
  LogOut,
  QrCode,
  History,
  Users,
  Settings,
  LayoutGrid,
  MoreHorizontal,
  X,
} from "lucide-react";

function Reloj() {
  const [hora, setHora] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setHora(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex items-center gap-1.5 bg-white rounded-lg px-2.5 py-1.5 border border-[#E8DDD2] shadow-sm">
      <Timer size={14} strokeWidth={1.5} className="text-[#8B7A6A]" />
      <span className="text-[#3D2B1F] text-sm font-semibold tabular-nums">
        {hora.toLocaleTimeString("es-AR", {
          hour: "2-digit",
          minute: "2-digit",
        })}
      </span>
      <span className="hidden lg:inline text-[#8B7A6A] text-xs tabular-nums">
        {hora.toLocaleTimeString("es-AR", { second: "2-digit" })}
      </span>
    </div>
  );
}

const vistas = [
  { key: "cocina", label: "Cocina", icon: CookingPot },
  { key: "sala", label: "Sala", icon: Table },
  { key: "dashboard", label: "Dashboard", icon: BarChart3 },
  { key: "historial", label: "Historial", icon: History },
];

const ACCESO_VISTAS = {
  cocina: ["dueno", "cajero", "cocina"],
  sala: ["dueno", "cajero"],
  dashboard: ["dueno", "cajero"],
  historial: ["dueno", "cajero"],
};

function Encabezado({
  vista,
  onChangeVista,
  pedidosActivos,
  enPreparacion,
  entregados,
  onNuevoPedido,
  onGestionarProductos,
  usuario,
  rol,
  onLogout,
  onAbrirQR,
  comercioNombre,
  onAbrirEquipo,
  onAbrirConfiguracion,
  onAbrirCategorias,
  onAbrirLlamadas,
  llamadasPendientes = 0,
}) {
  const [menuAbierto, setMenuAbierto] = useState(false);
  const menuRef = useRef(null);

  const vistasVisibles = vistas.filter((v) =>
    (ACCESO_VISTAS[v.key] || []).includes(rol)
  );
  const puedeGestionar = rol === "dueno";
  const puedeCrearPedido = rol === "dueno" || rol === "cajero";

  useEffect(() => {
    function handleClickFuera(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuAbierto(false);
      }
    }
    if (menuAbierto) document.addEventListener("mousedown", handleClickFuera);
    return () => document.removeEventListener("mousedown", handleClickFuera);
  }, [menuAbierto]);

  const itemsMenu = [
    puedeGestionar && { key: "qr", label: "QR mesas", icon: QrCode, onClick: onAbrirQR },
    puedeGestionar && { key: "categorias", label: "Categorías", icon: LayoutGrid, onClick: onAbrirCategorias },
    puedeGestionar && { key: "equipo", label: "Equipo", icon: Users, onClick: onAbrirEquipo },
    puedeGestionar && { key: "config", label: "Configuración", icon: Settings, onClick: onAbrirConfiguracion },
    puedeGestionar && { key: "menu", label: "Gestionar menú", icon: Package, onClick: onGestionarProductos },
  ].filter(Boolean);

  return (
    <header className="flex items-center justify-between gap-3 px-4 py-2.5 border-b border-[#E8DDD2] bg-white/80 backdrop-blur-md">
      {/* Marca */}
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-amber-100 border border-amber-200/60 shrink-0">
          <Coffee size={18} strokeWidth={1.5} className="text-amber-700" />
        </div>
        <div className="min-w-0">
          <h1 className="text-[#3D2B1F] text-sm font-bold leading-tight truncate">
            {comercioNombre || "Comercio"}
          </h1>
          <p className="text-[#8B7A6A] text-[10px] leading-tight">Comandera Digital</p>
        </div>
      </div>

      {/* Vistas */}
      <div className="flex items-center gap-1 bg-white rounded-lg p-1 border border-[#E8DDD2] shadow-sm">
        {vistasVisibles.map((v) => {
          const Icono = v.icon;
          const activa = vista === v.key;
          return (
            <button
              key={v.key}
              onClick={() => onChangeVista(v.key)}
              className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                activa
                  ? "bg-amber-600 text-white"
                  : "text-[#8B7A6A] hover:text-[#3D2B1F] hover:bg-[#F5F0EB]"
              }`}
            >
              <Icono size={14} strokeWidth={1.5} />
              <span className="hidden sm:inline">{v.label}</span>
            </button>
          );
        })}
      </div>

      {/* Acciones */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Estados */}
        {(enPreparacion > 0 || entregados > 0) && (
          <div className="hidden md:flex items-center gap-1.5">
            {enPreparacion > 0 && (
              <span className="flex items-center gap-1 px-2 py-1 rounded-md bg-amber-50 border border-amber-200/60 text-xs font-semibold text-amber-700">
                <CookingPot size={12} strokeWidth={1.5} />
                {enPreparacion}
              </span>
            )}
            {entregados > 0 && (
              <span className="flex items-center gap-1 px-2 py-1 rounded-md bg-emerald-50 border border-emerald-200/60 text-xs font-semibold text-emerald-700">
                <PackageCheck size={12} strokeWidth={1.5} />
                {entregados}
              </span>
            )}
          </div>
        )}

        {/* Pedidos activos */}
        <div className="flex items-center gap-1.5 bg-white rounded-lg px-2.5 py-1.5 border border-[#E8DDD2] shadow-sm">
          <ClipboardList size={14} strokeWidth={1.5} className="text-[#8B7A6A]" />
          <span className="text-[#3D2B1F] text-xs font-semibold tabular-nums">
            {pedidosActivos}
          </span>
          {pedidosActivos > 0 && (
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          )}
        </div>

        {/* Nuevo pedido */}
        {puedeCrearPedido && (
          <button
            onClick={onNuevoPedido}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold transition-colors cursor-pointer"
          >
            <Plus size={14} strokeWidth={2} />
            <span className="hidden sm:inline">Nuevo</span>
          </button>
        )}

        {/* Llamadas */}
        <button
          onClick={onAbrirLlamadas}
          className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E8DDD2] bg-white hover:bg-[#F5F0EB] text-[#8B7A6A] hover:text-[#3D2B1F] transition-colors cursor-pointer"
          aria-label="Llamadas pendientes"
        >
          Llamadas
          {llamadasPendientes > 0 && (
            <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
              {llamadasPendientes}
            </span>
          )}
        </button>

        {/* Menú Más */}
        {itemsMenu.length > 0 && (
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuAbierto((v) => !v)}
              className="flex items-center justify-center w-8 h-8 rounded-lg border border-[#E8DDD2] bg-white hover:bg-[#F5F0EB] text-[#8B7A6A] hover:text-[#3D2B1F] transition-colors cursor-pointer"
              aria-label="Más opciones"
            >
              {menuAbierto ? <X size={16} strokeWidth={1.5} /> : <MoreHorizontal size={16} strokeWidth={1.5} />}
            </button>
            {menuAbierto && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl border border-[#E8DDD2] shadow-lg py-1 z-50">
                {itemsMenu.map((item) => {
                  const Icono = item.icon;
                  return (
                    <button
                      key={item.key}
                      onClick={() => {
                        item.onClick?.();
                        setMenuAbierto(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-[#3D2B1F] hover:bg-[#F5F0EB] transition-colors cursor-pointer"
                    >
                      <Icono size={15} strokeWidth={1.5} className="text-[#8B7A6A]" />
                      {item.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Usuario */}
        {usuario && (
          <div className="hidden md:flex flex-col items-end leading-tight">
            <span className="text-xs font-semibold text-[#3D2B1F] truncate max-w-[120px]">
              {usuario.nombre || usuario.email}
            </span>
            <span className="text-[10px] uppercase tracking-wider text-[#8B7A6A]">
              {usuario.rol}
            </span>
          </div>
        )}

        {/* Logout */}
        <button
          onClick={onLogout}
          className="flex items-center justify-center w-8 h-8 rounded-lg border border-[#E8DDD2] bg-white hover:bg-red-50 text-[#8B7A6A] hover:text-red-600 transition-colors cursor-pointer"
          aria-label="Cerrar sesión"
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