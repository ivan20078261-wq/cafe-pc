import { useState, useEffect } from "react";
import { History, Loader2, Printer, Search } from "lucide-react";
import { supabase } from "../supabase";
import ComandaImpresion from "./ComandaImpresion";

const ESTADOS = {
  pendiente: "text-amber-600 bg-amber-50 border-amber-200",
  preparando: "text-sky-600 bg-sky-50 border-sky-200",
  entregado: "text-emerald-600 bg-emerald-50 border-emerald-200",
  cancelado: "text-red-500 bg-red-50 border-red-200",
  archivado: "text-[#8B7A6A] bg-[#F5F0EB] border-[#E8DDD2]",
};

function itemPrecioUnitario(item) {
  if (item.precio != null) return Number(item.precio) || 0;
  if (item.total != null && item.cantidad)
    return Math.round((Number(item.total) || 0) / item.cantidad);
  return 0;
}

function totalPedido(p) {
  return (p.items || []).reduce(
    (sum, item) => sum + itemPrecioUnitario(item) * (Number(item.cantidad) || 1),
    0,
  );
}

export default function HistorialPedidos({ comercioId, comercio }) {
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [estado, setEstado] = useState("");
  const [pedidos, setPedidos] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [impresion, setImpresion] = useState(null);

  useEffect(() => {
    const hoy = new Date();
    const hace15dias = new Date(hoy);
    hace15dias.setDate(hoy.getDate() - 14);
    setDesde(hace15dias.toISOString().slice(0, 10));
    setHasta(hoy.toISOString().slice(0, 10));
  }, []);

  async function buscar() {
    if (!comercioId) return;
    setCargando(true);
    let query = supabase
      .from("pedidos")
      .select("*, mesas(numero_mesa)")
      .eq("comercio_id", comercioId)
      .order("creado_at", { ascending: false })
      .limit(300);

    if (desde) query = query.gte("creado_at", `${desde}T00:00:00`);
    if (hasta) query = query.lte("creado_at", `${hasta}T23:59:59`);
    if (estado) query = query.eq("estado", estado);

    const { data, error } = await query;
    if (error) {
      console.error(error);
      alert("No se pudo consultar el historial.");
    } else {
      setPedidos(
        (data || []).map((p) => ({
          ...p,
          id: p.id,
          mesa: p.mesas?.numero_mesa ?? "?",
          productos: p.items,
          creadoEn: new Date(p.creado_at).getTime(),
        })),
      );
    }
    setCargando(false);
  }

  const contar = (estadoFiltro) => pedidos.filter((p) => p.estado === estadoFiltro).length;

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-4">
      {impresion && (
        <ComandaImpresion
          pedido={impresion}
          comercio={comercio}
          onCerrar={() => setImpresion(null)}
        />
      )}

      <div className="flex flex-col md:flex-row md:items-end gap-3 bg-white rounded-2xl border border-[#E8DDD2] p-4">
        <div className="flex items-center gap-2 text-[#3D2B1F]">
          <History size={18} strokeWidth={1.5} className="text-amber-600" />
          <h2 className="font-bold">Historial de pedidos</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 flex-1">
          <label className="block">
            <span className="block text-[10px] font-semibold text-[#8B7A6A] uppercase tracking-wider mb-1">Desde</span>
            <input
              type="date"
              value={desde}
              onChange={(e) => setDesde(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-[#E8DDD2] text-sm focus:outline-none focus:ring-2 focus:ring-amber-200"
            />
          </label>
          <label className="block">
            <span className="block text-[10px] font-semibold text-[#8B7A6A] uppercase tracking-wider mb-1">Hasta</span>
            <input
              type="date"
              value={hasta}
              onChange={(e) => setHasta(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-[#E8DDD2] text-sm focus:outline-none focus:ring-2 focus:ring-amber-200"
            />
          </label>
          <label className="block">
            <span className="block text-[10px] font-semibold text-[#8B7A6A] uppercase tracking-wider mb-1">Estado</span>
            <select
              value={estado}
              onChange={(e) => setEstado(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-[#E8DDD2] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-200 cursor-pointer"
            >
              <option value="">Todos</option>
              <option value="pendiente">Pendiente</option>
              <option value="preparando">Preparando</option>
              <option value="entregado">Entregado</option>
              <option value="cancelado">Cancelado</option>
              <option value="archivado">Archivado</option>
            </select>
          </label>
          <button
            onClick={buscar}
            className="flex items-center justify-center gap-2 px-4 py-2 h-[42px] rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 text-white text-sm font-semibold cursor-pointer"
          >
            <Search size={15} strokeWidth={1.5} />
            Buscar
          </button>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap text-xs">
        <span className="px-2.5 py-1 rounded-full bg-[#F5F0EB] text-[#8B7A6A]">
          Total: <b>{pedidos.length}</b>
        </span>
        <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-600 border border-amber-200">
          Pendientes: <b>{contar("pendiente")}</b>
        </span>
        <span className="px-2.5 py-1 rounded-full bg-sky-50 text-sky-600 border border-sky-200">
          Preparando: <b>{contar("preparando")}</b>
        </span>
        <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">
          Entregados: <b>{contar("entregado")}</b>
        </span>
        <span className="px-2.5 py-1 rounded-full bg-red-50 text-red-500 border border-red-200">
          Cancelados: <b>{contar("cancelado")}</b>
        </span>
      </div>

      {cargando ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={22} className="animate-spin text-amber-500" />
        </div>
      ) : pedidos.length === 0 ? (
        <div className="text-center py-16 text-[#8B7A6A]/60 text-sm bg-white rounded-2xl border border-[#E8DDD2]">
          Aún no hay pedidos en este rango. Hacé clic en Buscar.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {pedidos.map((p) => (
            <div key={p.id} className="bg-white rounded-2xl border border-[#E8DDD2] p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-lg bg-[#F5F0EB] flex items-center justify-center font-bold text-sm text-[#3D2B1F]">
                    {p.mesa}
                  </span>
                  <div>
                    <p className="text-xs text-[#8B7A6A]">
                      {new Date(p.creadoEn).toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" })}{" "}
                      · {new Date(p.creadoEn).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${ESTADOS[p.estado] || ESTADOS.archivado}`}>
                  {p.estado}
                </span>
              </div>

              <div className="space-y-1 text-sm text-[#3D2B1F]">
                {(p.items || []).slice(0, 4).map((item, i) => (
                  <div key={i} className="flex justify-between gap-2">
                    <span className="truncate">
                      {item.cantidad} × {item.nombre}
                    </span>
                    <span className="shrink-0 text-[#8B7A6A]">
                      ${itemPrecioUnitario(item).toLocaleString("es-AR")}
                    </span>
                  </div>
                ))}
                {(p.items || []).length > 4 && (
                  <p className="text-xs text-[#8B7A6A]">+{(p.items || []).length - 4} items más</p>
                )}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-[#E8DDD2]">
                <span className="font-bold text-[#3D2B1F]">
                  ${(p.total ?? totalPedido(p)).toLocaleString("es-AR")}
                </span>
                <button
                  onClick={() => setImpresion(p)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E8DDD2] text-xs text-[#8B7A6A] hover:bg-[#F5F0EB] cursor-pointer"
                >
                  <Printer size={13} strokeWidth={1.5} />
                  Reimprimir
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}