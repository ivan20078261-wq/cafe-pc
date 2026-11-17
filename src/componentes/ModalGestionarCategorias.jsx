import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ListChecks, Plus, Trash2, ArrowUp, ArrowDown, Loader2 } from "lucide-react";
import { supabase } from "../supabase";

export default function ModalGestionarCategorias({ abierto, comercioId, onCerrar }) {
  const [categorias, setCategorias] = useState([]);
  const [clave, setClave] = useState("");
  const [etiqueta, setEtiqueta] = useState("");
  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  async function cargar() {
    if (!comercioId) return;
    setCargando(true);
    const { data, error } = await supabase
      .from("categorias")
      .select("*")
      .eq("comercio_id", comercioId)
      .order("orden");
    if (error) {
      console.error(error);
      alert("No se pudieron cargar las categorías.");
    } else {
      setCategorias(data || []);
    }
    setCargando(false);
  }

  useEffect(() => {
    if (abierto && comercioId) cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abierto, comercioId]);

  async function agregar(e) {
    e.preventDefault();
    setError("");
    const claveLimpia = clave.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "");
    const etiquetaLimpia = etiqueta.trim();
    if (!claveLimpia || !etiquetaLimpia) {
      setError("Completá la clave y la etiqueta.");
      return;
    }
    if (categorias.some((c) => c.clave === claveLimpia)) {
      setError("Esa clave ya existe.");
      return;
    }
    setGuardando(true);
    const { error } = await supabase.from("categorias").insert({
      comercio_id: comercioId,
      clave: claveLimpia,
      etiqueta: etiquetaLimpia,
      orden: categorias.length,
    });
    setGuardando(false);
    if (error) {
      setError(`No se pudo crear: ${error.message}`);
      return;
    }
    setClave("");
    setEtiqueta("");
    await cargar();
  }

  async function borrar(cat) {
    if (!confirm(`¿Eliminar la categoría "${cat.etiqueta}"? Los productos que la usen pasarán a "Sin categoría".`)) return;
    const { error } = await supabase.from("categorias").delete().eq("id", cat.id);
    if (error) {
      console.error(error);
      alert("No se pudo eliminar.");
      return;
    }
    await cargar();
  }

  async function mover(cat, dir) {
    const idx = categorias.findIndex((c) => c.id === cat.id);
    const otro = categorias[idx + dir];
    if (!otro) return;
    await supabase.from("categorias").update({ orden: otro.orden }).eq("id", cat.id);
    await supabase.from("categorias").update({ orden: cat.orden }).eq("id", otro.id);
    await cargar();
  }

  async function guardarEtiqueta(cat, nueva) {
    const limpia = nueva.trim();
    if (!limpia || limpia === cat.etiqueta) return;
    await supabase.from("categorias").update({ etiqueta: limpia }).eq("id", cat.id);
    await cargar();
  }

  function CategoriaRow({ cat }) {
    const [editando, setEditando] = useState(false);
    const [valor, setValor] = useState(cat.etiqueta);
    const idx = categorias.findIndex((c) => c.id === cat.id);

    return (
      <div className="flex items-center gap-2 rounded-xl border border-[#E8DDD2] bg-white px-3 py-2">
        <div className="flex flex-col">
          <button
            onClick={() => mover(cat, -1)}
            disabled={idx === 0}
            className="text-[#8B7A6A] hover:text-[#3D2B1F] disabled:opacity-30 cursor-pointer"
          >
            <ArrowUp size={12} />
          </button>
          <button
            onClick={() => mover(cat, +1)}
            disabled={idx === categorias.length - 1}
            className="text-[#8B7A6A] hover:text-[#3D2B1F] disabled:opacity-30 cursor-pointer"
          >
            <ArrowDown size={12} />
          </button>
        </div>

        <span className="px-2 py-0.5 rounded-md bg-[#F5F0EB] text-[11px] font-mono text-[#8B7A6A]">
          {cat.clave}
        </span>

        {editando ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              guardarEtiqueta(cat, valor);
              setEditando(false);
            }}
            className="flex-1 flex gap-1"
          >
            <input
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              autoFocus
              className="flex-1 px-2 py-1 rounded-lg border border-amber-300 text-sm focus:outline-none"
            />
            <button type="submit" className="text-xs text-amber-600 font-semibold cursor-pointer">OK</button>
          </form>
        ) : (
          <span
            className="flex-1 text-sm font-medium text-[#3D2B1F] cursor-pointer hover:text-amber-600"
            onClick={() => {
              setValor(cat.etiqueta);
              setEditando(true);
            }}
            title="Editar etiqueta"
          >
            {cat.etiqueta}
          </span>
        )}

        <button
          onClick={() => borrar(cat)}
          className="w-7 h-7 rounded-lg hover:bg-red-50 flex items-center justify-center text-[#8B7A6A] hover:text-red-500 cursor-pointer"
        >
          <Trash2 size={14} strokeWidth={1.5} />
        </button>
      </div>
    );
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
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
            onClick={onCerrar}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed inset-4 md:inset-auto md:top-[10%] md:left-1/2 md:-translate-x-1/2 md:w-[480px] md:max-h-[80vh] z-50 bg-white rounded-2xl border border-[#E8DDD2] shadow-2xl flex flex-col overflow-hidden"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#E8DDD2] bg-gradient-to-r from-amber-50/50 to-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100/80 border border-amber-200/60 flex items-center justify-center text-amber-600">
                  <ListChecks size={20} strokeWidth={1.5} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[#3D2B1F]">Categorías</h2>
                  <p className="text-xs text-[#8B7A6A]">Secciones que aparecen en tu carta</p>
                </div>
              </div>
              <button
                onClick={onCerrar}
                className="w-8 h-8 rounded-lg hover:bg-[#F5F0EB] flex items-center justify-center text-[#8B7A6A] hover:text-[#3D2B1F] transition-colors cursor-pointer"
              >
                <X size={18} strokeWidth={1.5} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <form onSubmit={agregar} className="rounded-xl border border-[#E8DDD2] bg-[#FAF7F2]/60 p-4 space-y-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-[#3D2B1F]">
                  <Plus size={16} strokeWidth={1.5} className="text-amber-600" />
                  Nueva categoría
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={clave}
                    onChange={(e) => setClave(e.target.value)}
                    placeholder="clave (ej: cafe)"
                    className="px-3 py-2 rounded-xl border border-[#E8DDD2] bg-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-amber-200"
                  />
                  <input
                    type="text"
                    value={etiqueta}
                    onChange={(e) => setEtiqueta(e.target.value)}
                    placeholder="Etiqueta (ej: Cafés)"
                    className="px-3 py-2 rounded-xl border border-[#E8DDD2] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-200"
                  />
                </div>
                <button
                  type="submit"
                  disabled={guardando}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 text-white text-sm font-semibold disabled:opacity-50 cursor-pointer"
                >
                  {guardando && <Loader2 size={13} className="animate-spin" />}
                  Agregar
                </button>
                {error && <p className="text-xs text-red-500">{error}</p>}
              </form>

              {cargando ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 size={20} className="animate-spin text-amber-500" />
                </div>
              ) : categorias.length === 0 ? (
                <div className="text-center py-10 text-[#8B7A6A]/60 text-sm">
                  Todavía no hay categorías. Agregá la primera para personalizar tu carta.
                </div>
              ) : (
                <div className="space-y-2">
                  {categorias.map((cat) => (
                    <CategoriaRow key={cat.id} cat={cat} />
                  ))}
                </div>
              )}

              <p className="text-[11px] text-[#8B7A6A]/70 leading-relaxed">
                Los productos usan la <b>clave</b> de la categoría. Asigná la misma clave en
                "Gestionar menú". Si no hay categorías configuradas se usan las estándar de la plataforma.
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}