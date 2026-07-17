import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Table,
  Timer,
  ChefHat,
  AlertTriangle,
  ArrowRight,
  Check,
  CookingPot,
  PackageCheck,
  Sparkles,
} from "lucide-react";
import ItemProducto from "./ItemProducto";
import NotasEspeciales from "./NotasEspeciales";
import AccionesPedido from "./AccionesPedido";

function formatearTiempo(segundos) {
  if (segundos < 60) return `${segundos}s`;
  const mins = Math.floor(segundos / 60);
  const segs = segundos % 60;
  return `${mins}m ${segs}s`;
}

const UMBRAL_ALERTA = 7 * 60;
const UMBRAL_URGENTE = 10 * 60;

const estados = {
  pendiente: {
    borde: "border-[#E8DDD2]",
    fondo: "bg-white",
    hover: "hover:bg-amber-50/40 hover:border-amber-200/60",
    acento: "text-amber-600",
    barra: "bg-gradient-to-r from-[#E8DDD2] via-[#DCCFC0] to-[#E8DDD2]",
    glow: "rgba(217,119,6,0.06)",
  },
  preparando: {
    borde: "border-amber-300",
    fondo: "bg-amber-50/80",
    hover: "",
    acento: "text-amber-600",
    barra: "bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400",
    glow: "rgba(217,119,6,0.15)",
  },
  entregado: {
    borde: "border-emerald-200",
    fondo: "bg-emerald-50/60",
    hover: "",
    acento: "text-emerald-600",
    barra: "bg-gradient-to-r from-emerald-400 via-emerald-300 to-emerald-400",
    glow: "rgba(16,185,129,0.1)",
  },
};

function BarraTiempo({ segundos }) {
  const pct = Math.min((segundos / UMBRAL_URGENTE) * 100, 100);
  const esAlerta = segundos >= UMBRAL_ALERTA;
  const esUrgente = segundos >= UMBRAL_URGENTE;

  return (
    <div className="mt-3">
      <div className="h-1.5 rounded-full bg-[#E8DDD2] overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className={`h-full rounded-full ${
            esUrgente
              ? "bg-gradient-to-r from-red-500 to-red-400"
              : esAlerta
                ? "bg-gradient-to-r from-amber-500 to-amber-400"
                : "bg-gradient-to-r from-emerald-500 to-emerald-400"
          }`}
        />
      </div>
      <div className="flex justify-between mt-1">
        <span
          className={`text-[10px] font-medium ${esUrgente ? "text-red-600" : esAlerta ? "text-amber-600" : "text-[#8B7A6A]/50"}`}
        >
          {esUrgente ? "Urgente" : esAlerta ? "Próximo a vencer" : "A tiempo"}
        </span>
        <span className="text-[10px] text-[#8B7A6A]/50">
          {formatearTiempo(UMBRAL_URGENTE)}
        </span>
      </div>
    </div>
  );
}

function IndicadorClick({ accion }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.2, y: -10 }}
      transition={{ duration: 0.15 }}
      className="absolute inset-0 rounded-2xl flex items-center justify-center bg-black/5 pointer-events-none z-10"
    >
      <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/90 shadow-lg border border-[#E8DDD2] text-sm font-semibold text-[#3D2B1F]">
        {accion === "preparando" && (
          <>
            <CookingPot size={16} /> A preparar
          </>
        )}
        {accion === "entregado" && (
          <>
            <PackageCheck size={16} className="text-emerald-600" /> Entregado
          </>
        )}
        {accion === "libre" && (
          <>
            <Check size={16} className="text-gray-600" /> Mesa libre
          </>
        )}
      </div>
    </motion.div>
  );
}

function TarjetaPedido({
  pedido,
  tiempoTranscurrido,
  tiempoEstimado,
  onPreparar,
  onEntregar,
  onEliminar,
}) {
  const estaPreparando = pedido.estado === "preparando";
  const estaEntregado = pedido.estado === "entregado";
  const estilo = estados[pedido.estado] || estados.pendiente;
  const badgePendiente = pedido.productos.reduce(
    (sum, p) => sum + (p.cantidad ?? 1),
    0,
  );
  const esUrgente =
    !estaPreparando && !estaEntregado && tiempoTranscurrido >= UMBRAL_ALERTA;
  const [feedback, setFeedback] = useState(null);

  const handleCardClick = (e) => {
    if (e.target.closest("button") || e.target.closest("a")) return;
    if (pedido.estado === "pendiente") {
      setFeedback("preparando");
      setTimeout(() => setFeedback(null), 300);
      onPreparar(pedido.id);
    } else if (pedido.estado === "preparando") {
      setFeedback("entregado");
      setTimeout(() => setFeedback(null), 300);
      onEntregar(pedido.id);
    } else if (pedido.estado === "entregado") {
      setFeedback("libre");
      setTimeout(() => setFeedback(null), 300);
      onEliminar(pedido.id);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9, y: 15 }}
      animate={{
        opacity: 1,
        scale: 1,
        y: 0,
        boxShadow: estaPreparando
          ? [
              `0 4px 20px ${estilo.glow}`,
              `0 4px 30px ${estilo.glow}`,
              `0 4px 20px ${estilo.glow}`,
            ]
          : esUrgente
            ? [
                "0 2px 12px rgba(220,38,38,0.08)",
                "0 2px 18px rgba(220,38,38,0.12)",
                "0 2px 12px rgba(220,38,38,0.08)",
              ]
            : estaEntregado
              ? `0 2px 12px ${estilo.glow}`
              : "0 2px 12px rgba(0,0,0,0.06)",
      }}
      transition={{
        duration: 0.2,
        ease: "easeOut",
        boxShadow:
          estaPreparando || esUrgente
            ? { duration: 1.2, repeat: Infinity, ease: "easeInOut" }
            : undefined,
      }}
      exit={{ opacity: 0, scale: 0.8, x: 60, transition: { duration: 0.15 } }}
      onClick={handleCardClick}
      className={`relative shrink-0 w-[360px] rounded-2xl border overflow-hidden cursor-pointer select-none transition-colors ${
        esUrgente
          ? "border-red-200 bg-red-50/60 hover:bg-red-50/80"
          : `${estilo.borde} ${estilo.fondo} ${estilo.hover}`
      }`}
    >
      <div
        className={`h-1.5 w-full ${esUrgente ? "bg-gradient-to-r from-red-400 via-red-300 to-red-400" : estilo.barra} ${estaPreparando ? "animate-pulse" : ""}`}
      />

      <div className="p-5 relative">
        <AnimatePresence>
          {feedback && <IndicadorClick accion={feedback} />}
        </AnimatePresence>

        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-9 h-9 rounded-xl border flex items-center justify-center ${
                estaEntregado
                  ? "bg-emerald-100/80 border-emerald-200/60 text-emerald-600"
                  : esUrgente
                    ? "bg-red-100/80 border-red-200/60 text-red-600"
                    : `${estilo.acento} bg-amber-100/80 border-amber-200/60`
              }`}
            >
              {estaEntregado ? (
                <PackageCheck size={18} strokeWidth={1.5} />
              ) : esUrgente ? (
                <AlertTriangle size={18} strokeWidth={1.5} />
              ) : (
                <Table size={18} strokeWidth={1.5} />
              )}
            </div>
            <div>
              <h3 className="text-[#3D2B1F] text-xl font-bold tracking-tight leading-tight">
                Mesa {pedido.mesa}
              </h3>
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-[#8B7A6A]/60 font-medium">
                <span className="w-1 h-1 rounded-full bg-[#DCCFC0]" />
                <span>
                  {badgePendiente} {badgePendiente === 1 ? "item" : "items"}
                </span>
              </div>
            </div>
          </div>

          <div
            className={`flex items-center gap-1.5 text-sm font-mono tabular-nums ${
              estaEntregado
                ? "text-emerald-600"
                : esUrgente
                  ? "text-red-600"
                  : estaPreparando
                    ? "text-amber-600"
                    : "text-[#8B7A6A]"
            }`}
          >
            {estaPreparando && (
              <ChefHat
                size={14}
                strokeWidth={1.5}
                className="animate-bounce text-amber-500"
              />
            )}
            {esUrgente && (
              <AlertTriangle
                size={14}
                strokeWidth={1.5}
                className="text-red-500"
              />
            )}
            {estaEntregado && (
              <PackageCheck
                size={14}
                strokeWidth={1.5}
                className="text-emerald-500"
              />
            )}
            {!estaEntregado && <Timer size={14} strokeWidth={1.5} />}
            <span className="font-semibold">
              {estaEntregado ? "Listo" : formatearTiempo(tiempoTranscurrido)}
            </span>
          </div>
        </div>

        {pedido.estado === "pendiente" && tiempoEstimado && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-1.5 mt-2 px-2.5 py-1 rounded-lg bg-purple-50 border border-purple-200/60 w-fit"
          >
            <Sparkles size={12} strokeWidth={1.5} className="text-purple-500" />
            <span className="text-[11px] font-semibold text-purple-700">
              Se estima aproximadamente {tiempoEstimado} min de tardanza
            </span>
          </motion.div>
        )}

        {!estaPreparando && !estaEntregado && (
          <BarraTiempo segundos={tiempoTranscurrido} />
        )}

        <div className="my-3 flex items-center gap-2">
          <div className="flex-1 h-px bg-gradient-to-r from-[#E8DDD2] via-[#DCCFC0] to-transparent" />
          <ArrowRight size={10} className="text-[#DCCFC0]" />
        </div>

        <div>
          {pedido.productos.map((producto, i) => (
            <ItemProducto key={i} producto={producto} />
          ))}
        </div>

        <NotasEspeciales notas={pedido.notas} />

        <AccionesPedido
          estado={pedido.estado}
          onPreparar={() => onPreparar(pedido.id)}
          onEntregar={() => onEntregar(pedido.id)}
          onEliminar={() => onEliminar(pedido.id)}
        />
      </div>
    </motion.div>
  );
}

export default TarjetaPedido;
