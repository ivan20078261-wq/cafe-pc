import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Wallet, Loader2, CheckCircle2, Banknote, CreditCard, Dumbbell, Check } from "lucide-react";
import { supabase } from "../supabase";

const METODOS = [
  { value: "efectivo", label: "Efectivo", icon: Banknote },
  { value: "tarjeta", label: "Tarjeta / Debito", icon: CreditCard },
];

export default function ModalCobro({ abierto, comercioId, numeroMesa, total, onCerrar, onPagado }) {
  const [mesaId, setMesaId] = useState(null);
  const [metodo, setMetodo] = useState("efectivo");
  const [pagando, setPagando] = useState(false);
  const [hecho, setHecho] = useState(false);
  const [historial, setHistorial] = useState([]);
  const [cargandoHistorial, setCargandoHistorial] = useState(false);

  async function cargar() {
    if (!comercioId || !numeroMesa) return;
    const { data: mesa } = await supabase
      .from("mesas")
      .select("id")
      .eq("comercio_id", comercioId)
      .eq("numero_mesa", numeroMesa)
      .single();
    if (mesa) setMesaId(mesa.id);
  }

  async function cargarHistorial() {
    if (!mesaId) return;
    setCargandoHistorial(true);
    const { data } = await supabase
      .from("pagos")
      .select("*")
      .eq("mesa_id", mesaId)
      .order("creado_at", { ascending: false })
      .limit(10);
    setHistorial(data || []);
    setCargandoHistorial(false);
  }

  useEffect(() => {
    setHecho(false);
    if (abierto) {
      cargar();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abierto, comercioId, numeroMesa]);

  useEffect(() => {
    if (abierto) cargarHistorial();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abierto, mesaId]);

  async function registrarPago() {
    if (!mesaId || !total || pagando) return;
    setPagando(true);
    const { error } = await supabase.from("pagos").insert({
      comercio_id: comercioId,
      mesa_id: mesaId,
      monto: total,
      metodo,
      estado: "aprobado",
      external_id: null,
    });
    setPagando(false);
    if (error) {
      console.error(error);
      alert("No se pudo registrar el pago.");
      return;
    }
    setHecho(true);
    await cargarHistorial();
    if (onPagado) onPagado(total);
    setTimeout(() => onCerrar(), 1800);
  }

  return (
    <AnimatePresence>
      {abierto && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50"
            onClick={onCerrar}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed inset-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[440px] z-50 bg-white rounded-2xl border border-[#E8DDD2] shadow-2xl overflow-hidden"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#E8DDD2] bg-gradient-to-r from-amber-50/50 to-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100/80 border border-amber-200/60 flex items-center justify-center text-amber-600">
                  <Wallet size={20} strokeWidth={1.5} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[#3D2B1F]">Cobrar mesa {numeroMesa}</h2>
                  <p className="text-xs text-[#8B7A6A]">Registrá el pago de la mesa</p>
                </div>
              </div>
              <button
                onClick={onCerrar}
                className="w-8 h-8 rounded-lg hover:bg-[#F5F0EB] flex items-center justify-center text-[#8B7A6A] hover:text-[#3D2B1F] transition-colors cursor-pointer"
              >
                <X size={18} strokeWidth={1.5} />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {hecho ? (
                <div className="text-center py-8">
                  <CheckCircle2 size={48} strokeWidth={1.2} className="mx-auto text-emerald-500 mb-3" />
                  <p className="font-bold text-[#3D2B1F]">Pago registrado</p>
                  <p className="text-xs text-[#8B7A6A] mt-1">La mesa {numeroMesa} ya figura como pagada.</p>
                </div>
              ) : (
                <>
                  <div className="rounded-xl border border-[#E8DDD2] bg-[#FAF7F2]/60 p-4 text-center">
                    <p className="text-xs text-[#8B7A6A] uppercase tracking-wider">Total a cobrar</p>
                    <p className="text-3xl font-extrabold text-[#3D2B1F] mt-1">
                      ${Number(total || 0).toLocaleString("es-AR")}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-[#8B7A6A] uppercase tracking-wider">Método de pago</p>
                    {METODOS.map((m) => (
                      <label
                        key={m.value}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-colors ${
                          metodo === m.value
                            ? "border-amber-400 bg-amber-50/60"
                            : "border-[#E8DDD2] bg-white hover:bg-[#FAF7F2]"
                        }`}
                      >
                        <input
                          type="radio"
                          name="metodo"
                          value={m.value}
                          checked={metodo === m.value}
                          onChange={() => setMetodo(m.value)}
                          className="accent-amber-500 cursor-pointer"
                        />
                        <span className="flex items-center gap-2 text-sm font-medium text-[#3D2B1F]">
                          <m.icon size={16} /> {m.label}
                        </span>
                      </label>
                    ))}
                    <div className="flex items-center gap-2 px-4 py-3 rounded-xl border border-dashed border-[#E8DDD2] bg-[#FAF7F2]/40 text-xs text-[#8B7A6A]">
                      <Dumbbell size={14} className="inline" /> Mercado Pago (pagos por QR) próximamente.
                    </div>
                  </div>

                  <button
                    onClick={registrarPago}
                    disabled={!total || pagando}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 disabled:from-[#E8DDD2] disabled:to-[#E8DDD2] disabled:text-[#DCCFC0] text-white font-semibold transition-all cursor-pointer"
                  >
                    {pagando && <Loader2 size={16} className="animate-spin" />}
                    Registrar cobro
                  </button>
                </>
              )}

              {historial.length > 0 && (
                <div className="border-t border-[#E8DDD2] pt-3">
                  <p className="text-xs font-semibold text-[#8B7A6A] uppercase tracking-wider mb-2">
                    Cobros previos de esta mesa
                  </p>
                  {cargandoHistorial ? (
                    <Loader2 size={14} className="animate-spin text-amber-500" />
                  ) : (
                    <div className="space-y-1.5">
                      {historial.map((p) => (
                        <div key={p.id} className="flex items-center justify-between text-xs">
                          <span className="text-[#8B7A6A]">
                            {new Date(p.creado_at).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit" })}{" "}
                            · {METODOS.find((m) => m.value === p.metodo)?.label || p.metodo}
                          </span>
                          <span className={`font-semibold ${p.estado === "aprobado" ? "text-emerald-600" : p.estado === "rechazado" ? "text-red-500" : "text-[#8B7A6A]"}`}>
                            ${Number(p.monto || 0).toLocaleString("es-AR")}{" "}
                            {p.estado === "aprobado" && <Check size={12} className="inline ml-1" />}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}