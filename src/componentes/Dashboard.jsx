import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Sparkles,
  Coffee,
  ShoppingBag,
  Loader2,
  Package,
} from "lucide-react";
import { supabase } from "../supabase";
import { generarInsights } from "../services/mistral";

function StatCard({ icon: Icon, label, value, subtitle, color, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      className="bg-white rounded-2xl border border-[#E8DDD2] p-5 flex items-center gap-4"
    >
      <div
        className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${color}`}
      >
        <Icon size={22} strokeWidth={1.5} />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] uppercase tracking-wider text-[#8B7A6A] font-medium">
          {label}
        </p>
        <p className="text-2xl font-bold text-[#3D2B1F] tabular-nums truncate">
          {value}
        </p>
        {subtitle && (
          <p className="text-[10px] text-[#8B7A6A]/70 mt-0.5 truncate">
            {subtitle}
          </p>
        )}
      </div>
    </motion.div>
  );
}

function GraficoLinea({ data, color, areaColor, formatValor, id }) {
  const W = 560;
  const H = 240;
  const padL = 48;
  const padR = 14;
  const padT = 16;
  const padB = 34;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;
  const n = data.length;
  const max = Math.max(...data, 1);
  const xFor = (i) => padL + (i / (n - 1)) * innerW;
  const yFor = (v) => padT + innerH - (v / max) * innerH;
  const lineD = data
    .map((v, i) => `${i === 0 ? "M" : "L"} ${xFor(i).toFixed(1)} ${yFor(v).toFixed(1)}`)
    .join(" ");
  const areaD =
    `M ${xFor(0).toFixed(1)} ${(padT + innerH).toFixed(1)} ` +
    data.map((v, i) => `L ${xFor(i).toFixed(1)} ${yFor(v).toFixed(1)}`).join(" ") +
    ` L ${xFor(n - 1).toFixed(1)} ${(padT + innerH).toFixed(1)} Z`;

  const peakIdx = data.reduce((best, v, i) => (v > data[best] ? i : best), 0);
  const valleyIdx = data.reduce((best, v, i) => (v < data[best] ? i : best), 0);

  const ticks = [0, max / 2, max];
  const xLabels = [0, 3, 6, 9, 12, 15, 18, 21];

  return (
    <div className="w-full">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-auto"
        role="img"
        aria-label="Gráfico por hora"
      >
        <defs>
          <linearGradient id={`areaGrad-${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={areaColor} stopOpacity="0.35" />
            <stop offset="100%" stopColor={areaColor} stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {ticks.map((t, i) => (
          <g key={i}>
            <line
              x1={padL}
              y1={yFor(t)}
              x2={W - padR}
              y2={yFor(t)}
              stroke="#E8DDD2"
              strokeWidth="1"
              strokeDasharray="3 3"
            />
            <text
              x={padL - 6}
              y={yFor(t) + 3}
              textAnchor="end"
              fontSize="9"
              fill="#8B7A6A"
            >
              {formatValor(t)}
            </text>
          </g>
        ))}
        <line
          x1={padL}
          y1={padT}
          x2={padL}
          y2={padT + innerH}
          stroke="#D6C9B8"
          strokeWidth="1.5"
        />
        <line
          x1={padL}
          y1={padT + innerH}
          x2={W - padR}
          y2={padT + innerH}
          stroke="#D6C9B8"
          strokeWidth="1.5"
        />
        <path d={areaD} fill={`url(#areaGrad-${id})`} />
        <path
          d={lineD}
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {data.map((v, i) => {
          const isPeak = i === peakIdx && max > 0;
          const isValley = i === valleyIdx;
          if (!isPeak && !isValley) return null;
          return (
            <circle
              key={i}
              cx={xFor(i)}
              cy={yFor(v)}
              r={isPeak ? 4.5 : 3.5}
              fill={isPeak ? color : "#fff"}
              stroke={color}
              strokeWidth="2"
            />
          );
        })}
        {xLabels.map((h) => (
          <text
            key={h}
            x={xFor(h)}
            y={H - 12}
            textAnchor="middle"
            fontSize="9"
            fill="#8B7A6A"
          >
            {h}h
          </text>
        ))}
        <text
          x={xFor(23)}
          y={H - 12}
          textAnchor="middle"
          fontSize="9"
          fill="#8B7A6A"
        >
          23h
        </text>
      </svg>
      <div className="flex flex-wrap gap-4 text-xs mt-2 px-1">
        <span className="text-[#3D2B1F] font-semibold">
          Pico: <span style={{ color }}>{peakIdx}h</span> · {formatValor(data[peakIdx])}
        </span>
        <span className="text-[#3D2B1F] font-semibold">
          Valle: <span className="text-sky-600">{valleyIdx}h</span> · {formatValor(data[valleyIdx])}
        </span>
      </div>
    </div>
  );
}

function BarraHorizontal({ label, value, maxValue, color, delay }) {
  const pct = maxValue > 0 ? (value / maxValue) * 100 : 0;
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.3 }}
      className="flex items-center gap-3"
    >
      <span className="text-xs font-medium text-[#8B7A6A] w-8 text-right tabular-nums">
        {label}
      </span>
      <div className="flex-1 h-6 bg-[#F5EDE0] rounded-lg overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ delay: delay + 0.2, duration: 0.5, ease: "easeOut" }}
          className={`h-full rounded-lg ${color}`}
        />
      </div>
      <span className="text-xs font-bold text-[#3D2B1F] w-8 tabular-nums">
        {value}
      </span>
    </motion.div>
  );
}

export default function Dashboard({ comercioId }) {
  const [stats, setStats] = useState(null);
  const [insights, setInsights] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [cargandoInsights, setCargandoInsights] = useState(false);
  const [metrica, setMetrica] = useState("pedidos");

  useEffect(() => {
    if (!comercioId) return;

    async function cargarDatos() {
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      const manana = new Date(hoy);
      manana.setDate(manana.getDate() + 1);
      const ayer = new Date(hoy);
      ayer.setDate(ayer.getDate() - 1);
      const hace7Dias = new Date(hoy);
      hace7Dias.setDate(hace7Dias.getDate() - 7);

      const [hoyRes, ayerRes, semanaRes] = await Promise.all([
        supabase
          .from("pedidos")
          .select("*, mesas(numero_mesa)")
          .eq("comercio_id", comercioId)
          .neq("estado", "cancelado")
          .gte("creado_at", hoy.toISOString())
          .lt("creado_at", manana.toISOString()),
        supabase
          .from("pedidos")
          .select("*")
          .eq("comercio_id", comercioId)
          .neq("estado", "cancelado")
          .gte("creado_at", ayer.toISOString())
          .lt("creado_at", hoy.toISOString()),
        supabase
          .from("pedidos")
          .select("*")
          .eq("comercio_id", comercioId)
          .neq("estado", "cancelado")
          .gte("creado_at", hace7Dias.toISOString()),
      ]);

      const pedidosHoy = hoyRes.data || [];
      const pedidosAyer = ayerRes.data || [];
      const pedidosSemana = semanaRes.data || [];

      // Calcular estadísticas de hoy
      const pedidosPorHora = {};
      const facturadoPorHora = {};
      for (let h = 0; h <= 23; h++) {
        pedidosPorHora[h] = 0;
        facturadoPorHora[h] = 0;
      }
      let totalFacturado = 0;
      let totalItems = 0;
      let pendientes = 0;
      let preparando = 0;
      let entregados = 0;
      const conteoProductos = {};

      for (const p of pedidosHoy) {
        const hora = new Date(p.creado_at).getHours();
        pedidosPorHora[hora]++;
        facturadoPorHora[hora] += p.total || 0;
        totalFacturado += p.total || 0;

        for (const item of p.items || []) {
          const nombre = item.nombre || "Desconocido";
          const cant = item.cantidad || 1;
          conteoProductos[nombre] = (conteoProductos[nombre] || 0) + cant;
          totalItems += cant;
        }

        if (p.estado === "pendiente") pendientes++;
        else if (p.estado === "preparando") preparando++;
        else if (p.estado === "entregado") entregados++;
      }

      const productosOrdenados = Object.entries(conteoProductos)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5);

      const maxPorHora = Math.max(...Object.values(pedidosPorHora), 1);
      const maxFacturadoPorHora = Math.max(...Object.values(facturadoPorHora), 1);
      const maxProducto = productosOrdenados[0]?.[1] || 1;

      // Stats de ayer
      const facturadoAyer = pedidosAyer.reduce(
        (sum, p) => sum + (p.total || 0),
        0,
      );
      const pedidosAyerCount = pedidosAyer.length;
      const vsAyer =
        pedidosAyerCount > 0
          ? Math.round(
              ((pedidosHoy.length - pedidosAyerCount) / pedidosAyerCount) * 100,
            )
          : null;

      // Hora pico
      let horaPico = "-";
      let maxPedidos = 0;
      for (const [h, c] of Object.entries(pedidosPorHora)) {
        if (c > maxPedidos) {
          maxPedidos = c;
          horaPico = `${h}h`;
        }
      }

      const ticketPromedio =
        pedidosHoy.length > 0
          ? Math.round(totalFacturado / pedidosHoy.length)
          : 0;

      setStats({
        pedidosHoy: pedidosHoy.length,
        pedidosSemana: pedidosSemana.length,
        totalFacturado,
        ticketPromedio,
        totalItems,
        masVendido: productosOrdenados[0]?.[0] || "-",
        masVendidoVeces: productosOrdenados[0]?.[1] || 0,
        pendientes,
        preparando,
        entregados,
        horaPico,
        maxPedidos,
        pedidosPorHora,
        facturadoPorHora,
        productosTop: productosOrdenados,
        maxPorHora,
        maxFacturadoPorHora,
        maxProducto,
        vsAyer,
        pedidosAyer: pedidosAyerCount,
        facturadoAyer,
      });

      setCargando(false);

      // Generar insights con IA
      setCargandoInsights(true);
      const insightsTexto = await generarInsights({
        pedidosTotales: pedidosHoy.length,
        masVendido: productosOrdenados[0]?.[0] || "N/A",
        masVendidoVeces: productosOrdenados[0]?.[1] || 0,
        tiempoPromedio: "~5",
        totalFacturado,
        ticketPromedio: ticketPromedio,
        pedidosPorHora:
          Object.entries(pedidosPorHora)
            .filter(([, v]) => v > 0)
            .map(([k, v]) => `${k}h: ${v}`)
            .join(", ") || "Sin datos",
      });
      setInsights(insightsTexto);
      setCargandoInsights(false);
    }

    cargarDatos();
  }, [comercioId]);

  if (cargando) {
    return (
      <div className="flex-1 flex items-center justify-center text-[#8B7A6A]">
        <div className="flex items-center gap-3">
          <Loader2 size={40} className="animate-spin text-amber-500" />
          <span className="text-lg font-medium">Cargando dashboard...</span>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex-1 flex items-center justify-center text-[#8B7A6A]/50">
        <p className="text-sm">No hay datos disponibles</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
      {/* Stats principales */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <StatCard
          icon={ShoppingBag}
          label="Pedidos hoy"
          value={stats.pedidosHoy}
          subtitle={
            stats.vsAyer !== null
              ? `${stats.vsAyer >= 0 ? "↑" : "↓"} ${Math.abs(stats.vsAyer)}% vs ayer (${stats.pedidosAyer})`
              : "Sin datos de ayer"
          }
          color="bg-amber-100 text-amber-600"
          delay={0}
        />
        <StatCard
          icon={DollarSign}
          label="Facturado"
          value={`$${stats.totalFacturado.toLocaleString()}`}
          subtitle={
            stats.facturadoAyer > 0
              ? `Ayer: $${stats.facturadoAyer.toLocaleString()}`
              : "Solo datos de hoy"
          }
          color="bg-emerald-100 text-emerald-600"
          delay={0.1}
        />
        <StatCard
          icon={Coffee}
          label="Ticket promedio"
          value={`$${stats.ticketPromedio.toLocaleString()}`}
          subtitle={`${stats.totalItems} items vendidos`}
          color="bg-sky-100 text-sky-600"
          delay={0.2}
        />
        <StatCard
          icon={BarChart3}
          label="Hora pico"
          value={stats.horaPico}
          subtitle={`${stats.maxPedidos} pedidos en esa hora`}
          color="bg-orange-100 text-orange-600"
          delay={0.3}
        />
        <StatCard
          icon={Package}
          label="En curso"
          value={stats.pendientes + stats.preparando}
          subtitle={`${stats.pendientes} pend. · ${stats.preparando} prep. · ${stats.entregados} listos`}
          color="bg-rose-100 text-rose-600"
          delay={0.4}
        />
        <StatCard
          icon={TrendingUp}
          label="Esta semana"
          value={stats.pedidosSemana}
          subtitle={`${stats.entregados} completados hoy`}
          color="bg-blue-100 text-blue-600"
          delay={0.5}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Pedidos por hora */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-2xl border border-[#E8DDD2] p-5"
        >
          <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <BarChart3 size={16} className="text-amber-500" />
              <h3 className="text-sm font-bold text-[#3D2B1F]">
                Actividad por hora
              </h3>
            </div>
            <div className="flex items-center gap-1 bg-[#F5EDE0] rounded-lg p-1">
              <button
                onClick={() => setMetrica("pedidos")}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors ${
                  metrica === "pedidos"
                    ? "bg-amber-500 text-white"
                    : "text-[#8B7A6A] hover:text-[#3D2B1F]"
                }`}
              >
                Pedidos
              </button>
              <button
                onClick={() => setMetrica("facturado")}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors ${
                  metrica === "facturado"
                    ? "bg-emerald-500 text-white"
                    : "text-[#8B7A6A] hover:text-[#3D2B1F]"
                }`}
              >
                Facturado
              </button>
            </div>
          </div>
          {metrica === "pedidos" ? (
            <GraficoLinea
              id="pedidos"
              data={Array.from({ length: 24 }, (_, h) => stats.pedidosPorHora[h] || 0)}
              color="#f59e0b"
              areaColor="#f59e0b"
              formatValor={(v) => Math.round(v).toString()}
            />
          ) : (
            <GraficoLinea
              id="facturado"
              data={Array.from({ length: 24 }, (_, h) => stats.facturadoPorHora?.[h] || 0)}
              color="#10b981"
              areaColor="#10b981"
              formatValor={(v) => `$${Math.round(v).toLocaleString()}`}
            />
          )}
          {Object.values(
            metrica === "pedidos" ? stats.pedidosPorHora : stats.facturadoPorHora || {},
          ).every((v) => v === 0) && (
            <p className="text-xs text-[#8B7A6A]/50 text-center py-2">
              Sin datos hoy
            </p>
          )}
        </motion.div>

        {/* Top productos */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-2xl border border-[#E8DDD2] p-5"
        >
          <div className="flex items-center gap-2 mb-4">
            <Coffee size={16} className="text-purple-500" />
            <h3 className="text-sm font-bold text-[#3D2B1F]">Top productos</h3>
          </div>
          <div className="space-y-2">
            {stats.productosTop.map(([nombre, cantidad], i) => (
              <BarraHorizontal
                key={nombre}
                label={`#${i + 1}`}
                value={cantidad}
                maxValue={stats.maxProducto}
                color="bg-gradient-to-r from-purple-400 to-purple-300"
                delay={0.6 + i * 0.05}
              />
            ))}
            {stats.productosTop.length === 0 && (
              <p className="text-xs text-[#8B7A6A]/50 text-center py-4">
                Sin productos vendidos hoy
              </p>
            )}
          </div>
        </motion.div>
      </div>

      {/* Insights de IA */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="bg-white rounded-2xl border border-[#E8DDD2] p-5"
      >
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-purple-100/80 border border-purple-200/60 flex items-center justify-center text-purple-500">
            <Sparkles size={16} strokeWidth={1.5} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#3D2B1F]">Insights de IA</h3>
            <p className="text-[10px] text-[#8B7A6A]/60">
              Análisis del día basado en datos
            </p>
          </div>
        </div>
        {cargandoInsights ? (
          <div className="flex items-center justify-center gap-2 py-8 text-purple-500/60">
            <Loader2 size={16} className="animate-spin" />
            <span className="text-sm">Analizando datos...</span>
          </div>
        ) : insights ? (
          <div className="space-y-2">
            {insights
              .split("\n")
              .filter(Boolean)
              .map((linea, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.8 + i * 0.1 }}
                  className="flex items-start gap-3 px-3.5 py-2.5 rounded-xl bg-[#FAF7F2]/80 border border-[#E8DDD2]/60"
                >
                  <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-500 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <p className="text-sm text-[#3D2B1F] leading-relaxed">
                    {linea}
                  </p>
                </motion.div>
              ))}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 py-8 text-[#8B7A6A]/40">
            <Sparkles size={24} strokeWidth={1} />
            <p className="text-xs">No se pudieron generar insights</p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
