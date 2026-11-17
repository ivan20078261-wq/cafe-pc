import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Store, Loader2, Save, Image as ImageIcon } from "lucide-react";
import { supabase } from "../supabase";

export default function ModalConfiguracionComercio({ abierto, comercioId, onCerrar }) {
  const [form, setForm] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [guardado, setGuardado] = useState("");
  const [subiendoLogo, setSubiendoLogo] = useState(false);
  const inputLogoRef = useRef(null);

  async function cargar() {
    if (!comercioId) return;
    const { data } = await supabase.from("comercios").select("*").eq("id", comercioId).single();
    if (data) setForm(data);
  }

  useEffect(() => {
    if (abierto && comercioId) cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abierto, comercioId]);

  function set(key, value) {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  async function subirLogo(e) {
    const file = e.target.files?.[0];
    if (!file || !form) return;
    setSubiendoLogo(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${form.id}/logo_${Date.now()}.${ext}`;
      const { error: up } = await supabase.storage.from("productos").upload(path, file, {
        cacheControl: "3600",
        upsert: true,
      });
      if (up) throw up;
      const { data: publicUrl } = supabase.storage.from("productos").getPublicUrl(path);
      set("logo_url", publicUrl.publicUrl);
    } catch (err) {
      console.error("Error subiendo logo:", err);
      alert("No se pudo subir el logo.");
    } finally {
      setSubiendoLogo(false);
    }
  }

  async function guardar() {
    if (!form) return;
    setGuardando(true);
    const { error } = await supabase.from("comercios").update({
      nombre: form.nombre,
      slug: form.slug,
      telefono: form.telefono || null,
      direccion: form.direccion || null,
      horario: form.horario || null,
      descripcion: form.descripcion || null,
      color_primario: form.color_primario || "#2C1810",
      logo_url: form.logo_url || null,
      activo: form.activo,
    }).eq("id", form.id);

    setGuardando(false);
    if (error) {
      if (error.code === "23505") {
        alert("Ese slug ya está en uso. Elegí otro.");
      } else {
        console.error(error);
        alert("No se pudo guardar la configuración.");
      }
      return;
    }
    setGuardado("Configuración guardada");
    setTimeout(() => setGuardado(""), 2500);
  }

  const Input = ({ label, field, type = "text", placeholder = "" }) => (
    <label className="block">
      <span className="block text-xs font-semibold text-[#8B7A6A] mb-1 uppercase tracking-wider">{label}</span>
      <input
        type={type}
        value={form?.[field] ?? ""}
        onChange={(e) => set(field, type === "number" ? Number(e.target.value) : e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2.5 rounded-xl border border-[#E8DDD2] bg-white text-sm text-[#3D2B1F] focus:outline-none focus:ring-2 focus:ring-amber-200"
      />
    </label>
  );

  return (
    <AnimatePresence>
      {abierto && form && (
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
            className="fixed inset-4 md:inset-auto md:top-[5%] md:left-1/2 md:-translate-x-1/2 md:w-[560px] md:max-h-[88vh] z-50 bg-white rounded-2xl border border-[#E8DDD2] shadow-2xl flex flex-col overflow-hidden"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#E8DDD2] bg-gradient-to-r from-amber-50/50 to-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100/80 border border-amber-200/60 flex items-center justify-center text-amber-600">
                  <Store size={20} strokeWidth={1.5} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[#3D2B1F]">Configuración del comercio</h2>
                  <p className="text-xs text-[#8B7A6A]">Datos de tu negocio para la carta y el panel</p>
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
              <div className="flex items-start gap-4">
                <div
                  className="w-20 h-20 rounded-2xl border border-[#E8DDD2] overflow-hidden flex items-center justify-center shrink-0"
                >
                  {form.logo_url ? (
                    <img src={form.logo_url} alt="logo" className="w-full h-full object-cover" />
                  ) : (
                    <Store size={24} className="text-[#8B7A6A]" />
                  )}
                </div>
                <div className="flex-1 space-y-2">
                  <input
                    ref={inputLogoRef}
                    type="file"
                    accept="image/*"
                    onChange={subirLogo}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => inputLogoRef.current?.click()}
                    disabled={subiendoLogo}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl border border-[#E8DDD2] bg-white text-sm text-[#8B7A6A] hover:bg-[#F5F0EB] disabled:opacity-50 cursor-pointer"
                  >
                    {subiendoLogo ? <Loader2 size={14} className="animate-spin" /> : <ImageIcon size={14} strokeWidth={1.5} />}
                    {form.logo_url ? "Cambiar logo" : "Subir logo"}
                  </button>
                  <div className="flex items-center gap-2 text-xs text-[#8B7A6A]">
                    <input type="color" value={form.color_primario || "#2C1810"}
                      onChange={(e) => set("color_primario", e.target.value)}
                      className="w-8 h-8 rounded-lg border border-[#E8DDD2] cursor-pointer" />
                    Color de marca
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="Nombre" field="nombre" />
                <Input label="Slug (URL)" field="slug" />
                <Input label="Teléfono" field="telefono" />
                <Input label="Horario" field="horario" placeholder="8:00 a 20:00" />
                <Input label="Dirección" field="direccion" />
                <label className="block">
                  <span className="block text-xs font-semibold text-[#8B7A6A] mb-1 uppercase tracking-wider">Plan</span>
                  <span className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-[#E8DDD2] bg-[#FAF7F2] text-sm text-[#8B7A6A] capitalize">
                    {form.plan || "basic"}
                  </span>
                </label>
              </div>

              <label className="block">
                <span className="block text-xs font-semibold text-[#8B7A6A] mb-1 uppercase tracking-wider">Descripción</span>
                <textarea
                  value={form.descripcion || ""}
                  onChange={(e) => set("descripcion", e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#E8DDD2] bg-white text-sm text-[#3D2B1F] focus:outline-none focus:ring-2 focus:ring-amber-200"
                />
              </label>

              <label className="flex items-center gap-3 p-3 rounded-xl border border-[#E8DDD2] bg-[#FAF7F2]/50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!form.activo}
                  onChange={(e) => set("activo", e.target.checked)}
                  className="w-4 h-4 accent-amber-500 cursor-pointer"
                />
                <span className="text-sm font-medium text-[#3D2B1F]">Comercio activo</span>
                <span className="text-xs text-[#8B7A6A]">(un comercio inactivo no aparece en la carta)</span>
              </label>
            </div>

            <div className="flex items-center justify-between px-6 py-4 border-t border-[#E8DDD2] bg-[#FAF7F2]/50">
              {guardado ? (
                <span className="text-sm font-semibold text-emerald-600">{guardado}</span>
              ) : (
                <span className="text-xs text-[#8B7A6A]">Los cambios se reflejan en la carta al instante</span>
              )}
              <button
                onClick={guardar}
                disabled={guardando}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 text-white text-sm font-semibold disabled:opacity-50 cursor-pointer"
              >
                {guardando ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} strokeWidth={1.5} />}
                Guardar
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}