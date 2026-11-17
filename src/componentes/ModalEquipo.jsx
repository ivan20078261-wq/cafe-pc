import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  UserPlus,
  Users,
  Loader2,
  Shield,
  UserCog,
  Flag,
} from "lucide-react";
import { supabase } from "../supabase";
import { useAuth } from "../contexts/AuthContext";

const ROLES_UI = [
  { value: "dueno", label: "Dueño" },
  { value: "cajero", label: "Cajero" },
  { value: "cocina", label: "Cocina" },
];

function BadgeRol({ rol }) {
  const estilos = {
    dueno: "bg-amber-100 text-amber-700 border-amber-200",
    cajero: "bg-sky-100 text-sky-700 border-sky-200",
    cocina: "bg-emerald-100 text-emerald-700 border-emerald-200",
  };
  const iconos = {
    dueno: <Flag size={12} strokeWidth={2} />,
    cajero: <UserCog size={12} strokeWidth={2} />,
    cocina: <Shield size={12} strokeWidth={2} />,
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${estilos[rol] || estilos.cajero}`}>
      {iconos[rol]}
      {ROLES_UI.find((r) => r.value === rol)?.label ?? rol}
    </span>
  );
}

export default function ModalEquipo({ abierto, comercioId, onCerrar }) {
  const { usuario } = useAuth();
  const rolLogueado = usuario?.rol;
  const esDueno = rolLogueado === "dueno";

  const [equipo, setEquipo] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [email, setEmail] = useState("");
  const [nombre, setNombre] = useState("");
  const [rolNuevo, setRolNuevo] = useState("cajero");
  const [enviando, setEnviando] = useState(false);
  const [passwordTemporal, setPasswordTemporal] = useState("");
  const [error, setError] = useState("");

  async function cargarEquipo() {
    if (!comercioId) return;
    setCargando(true);
    const { data, error } = await supabase
      .from("usuarios")
      .select("id, nombre, email, rol, activo")
      .eq("comercio_id", comercioId)
      .order("rol");
    if (error) {
      console.error("Error cargando equipo:", error);
    } else {
      setEquipo(data || []);
    }
    setCargando(false);
  }

  useEffect(() => {
    if (abierto && comercioId) cargarEquipo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abierto, comercioId]);

  async function crearMiembro(e) {
    e.preventDefault();
    setError("");
    setPasswordTemporal("");
    if (!email || !nombre) return;
    setEnviando(true);

    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      if (!token) throw new Error("Sesión expirada");

      const res = await fetch(`${supabase.supabaseUrl}/functions/v1/crear-usuario`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ comercio_id: comercioId, email, nombre, rol: rolNuevo }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "No se pudo crear el usuario");
      }

      setPasswordTemporal(data.temporary_password);
      setEmail("");
      setNombre("");
      setRolNuevo("cajero");
      await cargarEquipo();
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  }

  async function cambiarRol(miembro, rol) {
    if (!esDueno) return;
    const { error } = await supabase.rpc("actualizar_rol_usuario", {
      p_usuario_id: String(miembro.id),
      p_rol: rol,
    });
    if (error) {
      console.error(error);
      alert("No se pudo cambiar el rol");
    } else {
      await cargarEquipo();
    }
  }

  async function cambiarActivo(miembro, activo) {
    if (!esDueno) return;
    const nuevo = !activo;
    const { error } = await supabase.rpc("actualizar_rol_usuario", {
      p_usuario_id: String(miembro.id),
      p_rol: miembro.rol,
      p_activo: nuevo,
    });
    if (error) {
      console.error(error);
      alert("No se pudo actualizar el estado");
    } else {
      await cargarEquipo();
    }
  }

  const selectRol = (miembro) => (
    <select
      disabled={!esDueno || miembro.rol === "dueno"}
      value={miembro.rol}
      onChange={(e) => cambiarRol(miembro, e.target.value)}
      className="px-2 py-1 rounded-lg border border-[#E8DDD2] bg-white text-xs font-semibold text-[#3D2B1F] focus:outline-none focus:ring-2 focus:ring-amber-200 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
    >
      {ROLES_UI.map((r) => (
        <option key={r.value} value={r.value} disabled={r.value === "dueno" && miembro.rol === "dueno"}>
          {r.label}
        </option>
      ))}
    </select>
  );

  return (
    <AnimatePresence>
      {abierto && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
            onClick={onCerrar}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed inset-4 md:inset-auto md:top-[5%] md:left-1/2 md:-translate-x-1/2 md:w-[560px] md:max-h-[85vh] z-50 bg-white rounded-2xl border border-[#E8DDD2] shadow-2xl flex flex-col overflow-hidden"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#E8DDD2] bg-gradient-to-r from-amber-50/50 to-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100/80 border border-amber-200/60 flex items-center justify-center text-amber-600">
                  <Users size={20} strokeWidth={1.5} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[#3D2B1F]">Equipo</h2>
                  <p className="text-xs text-[#8B7A6A]">Usuarios de este comercio</p>
                </div>
              </div>
              <button
                onClick={onCerrar}
                className="w-8 h-8 rounded-lg hover:bg-[#F5F0EB] flex items-center justify-center text-[#8B7A6A] hover:text-[#3D2B1F] transition-colors cursor-pointer"
              >
                <X size={18} strokeWidth={1.5} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {esDueno && (
                <form onSubmit={crearMiembro} className="rounded-xl border border-[#E8DDD2] bg-[#FAF7F2]/60 p-4 space-y-3">
                  <div className="flex items-center gap-2 text-sm font-semibold text-[#3D2B1F]">
                    <UserPlus size={16} strokeWidth={1.5} className="text-amber-600" />
                    Agregar miembro
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={nombre}
                      onChange={(e) => setNombre(e.target.value)}
                      placeholder="Nombre"
                      required
                      className="px-3 py-2 rounded-xl border border-[#E8DDD2] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-200"
                    />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Email"
                      required
                      className="px-3 py-2 rounded-xl border border-[#E8DDD2] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-200"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={rolNuevo}
                      onChange={(e) => setRolNuevo(e.target.value)}
                      className="px-3 py-2 rounded-xl border border-[#E8DDD2] bg-white text-sm text-[#3D2B1F] focus:outline-none focus:ring-2 focus:ring-amber-200 cursor-pointer"
                    >
                      {ROLES_UI.map((r) => (
                        <option key={r.value} value={r.value}>{r.label}</option>
                      ))}
                    </select>
                    <button
                      type="submit"
                      disabled={enviando}
                      className="ml-auto flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 text-white text-sm font-semibold disabled:opacity-50 cursor-pointer"
                    >
                      {enviando && <Loader2 size={14} className="animate-spin" />}
                      Crear usuario
                    </button>
                  </div>
                  {error && (
                    <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>
                  )}
                  {passwordTemporal && (
                    <div className="text-sm bg-emerald-50 rounded-lg border border-emerald-200 px-3 py-2">
                      <p className="font-semibold text-emerald-700 mb-1">
                        Usuario creado. Pasá esta contraseña a la persona:
                      </p>
                      <code className="block bg-white rounded-lg px-3 py-2 border border-emerald-200 font-mono text-emerald-800 tracking-wider">
                        {passwordTemporal}
                      </code>
                      <p className="text-[11px] text-emerald-600 mt-1">
                        Podrá cambiar la contraseña después con "olvidé mi contraseña".
                      </p>
                    </div>
                  )}
                </form>
              )}

              {cargando ? (
                <div className="flex items-center justify-center py-10 text-[#8B7A6A]">
                  <Loader2 size={20} className="animate-spin text-amber-500" />
                </div>
              ) : equipo.length === 0 ? (
                <div className="text-center py-10 text-[#8B7A6A]/60 text-sm">
                  Aún no hay miembros. {esDueno ? "Agregá el primero arriba." : ""}
                </div>
              ) : (
                <div className="space-y-2">
                  {equipo.map((m) => (
                    <div
                      key={m.id}
                      className={`flex items-center gap-3 rounded-xl border border-[#E8DDD2] bg-white p-3 ${
                        m.activo === false ? "opacity-50" : ""
                      }`}
                    >
                      <div className="w-9 h-9 rounded-full bg-[#F5F0EB] border border-[#E8DDD2] flex items-center justify-center text-sm font-bold text-[#8B7A6A]">
                        {(m.nombre || m.email || "?").slice(0, 1).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-[#3D2B1F] truncate">
                          {m.nombre || "Sin nombre"}
                          {m.activo === false && (
                            <span className="ml-2 text-[10px] text-red-500">desactivado</span>
                          )}
                        </p>
                        <p className="text-xs text-[#8B7A6A] truncate">{m.email}</p>
                      </div>
                      <BadgeRol rol={m.rol} />
                      {esDueno && m.rol !== "dueno" && selectRol(m)}
                      {esDueno && m.rol !== "dueno" && (
                        <button
                          onClick={() => cambiarActivo(m, m.activo)}
                          title={m.activo === false ? "Activar" : "Desactivar"}
                          className="w-7 h-7 rounded-lg hover:bg-[#F5F0EB] flex items-center justify-center text-[#8B7A6A] hover:text-red-500 cursor-pointer"
                        >
                          {m.activo === false ? "▶" : "⏸"}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}