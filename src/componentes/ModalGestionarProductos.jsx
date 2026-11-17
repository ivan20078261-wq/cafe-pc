import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Package, Trash2, Sparkles } from "lucide-react";
import { supabase } from "../supabase";
import ModalGestionarModificadores from "./ModalGestionarModificadores";
import SubirImagen from "./SubirImagen";

const CATEGORIAS = [
  { value: "cafe", label: "Cafés" },
  { value: "te", label: "Tés" },
  { value: "bebidas", label: "Bebidas" },
  { value: "pasteleria", label: "Pastelería" },
  { value: "facturas", label: "Facturas" },
  { value: "panes", label: "Panes" },
  { value: "comida", label: "Comida" },
  { value: "ensaladas", label: "Ensaladas" },
  { value: "bowls", label: "Bowls" },
  { value: "wraps", label: "Wraps" },
  { value: "principal", label: "Principal" },
  { value: "postre", label: "Postres" },
];

function ProductoCard({
  producto,
  onProductoEliminado,
  onProductoActualizado,
  comercioId,
}) {
  const [editando, setEditando] = useState(false);
  const [formData, setFormData] = useState(producto);
  const [todosModificadores, setTodosModificadores] = useState([]);
  const [asignados, setAsignados] = useState([]);

  useEffect(() => {
    if (!editando) return;
    cargarModificadores();
  }, [editando]);

  async function cargarModificadores() {
    const { data: grupos } = await supabase
      .from("modificadores")
      .select("*")
      .eq("comercio_id", comercioId)
      .order("orden");
    setTodosModificadores(grupos || []);

    const { data: rels } = await supabase
      .from("producto_modificador")
      .select("modificador_id")
      .eq("producto_id", producto.id);
    setAsignados(rels ? rels.map((r) => r.modificador_id) : []);
  }

  async function toggleModificador(modId) {
    const nuevo = asignados.includes(modId)
      ? asignados.filter((id) => id !== modId)
      : [...asignados, modId];
    setAsignados(nuevo);
  }

  async function guardarAsignaciones() {
    await supabase
      .from("producto_modificador")
      .delete()
      .eq("producto_id", producto.id);
    if (asignados.length > 0) {
      await supabase.from("producto_modificador").insert(
        asignados.map((modId) => ({
          producto_id: producto.id,
          modificador_id: modId,
        })),
      );
    }
  }

  const handleGuardar = async () => {
    try {
      const { data, error } = await supabase
        .from("productos")
        .update(formData)
        .eq("id", producto.id)
        .select();

      if (error) {
        console.error("Error actualizando producto:", error);
      } else {
        await guardarAsignaciones();
        onProductoActualizado(data[0]);
        setEditando(false);
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleEliminar = async () => {
    if (confirm("¿Eliminar este producto?")) {
      try {
        const { error } = await supabase
          .from("productos")
          .delete()
          .eq("id", producto.id);

        if (error) {
          console.error("Error eliminando producto:", error);
        } else {
          onProductoEliminado(producto.id);
        }
      } catch (error) {
        console.error("Error:", error);
      }
    }
  };

  if (editando) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-4 rounded-xl border border-[#E8DDD2] bg-[#FAF7F2]/50 space-y-3"
      >
        <div className="grid grid-cols-2 gap-3">
          <input
            type="text"
            value={formData.nombre}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, nombre: e.target.value }))
            }
            placeholder="Nombre"
            className="px-3 py-2 rounded-lg border border-[#E8DDD2] text-sm"
          />
          <input
            type="text"
            value={formData.categoria}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, categoria: e.target.value }))
            }
            placeholder="Categoría"
            className="px-3 py-2 rounded-lg border border-[#E8DDD2] text-sm"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <input
            type="number"
            value={formData.precio_base}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                precio_base: parseFloat(e.target.value) || 0,
              }))
            }
            placeholder="Precio"
            className="px-3 py-2 rounded-lg border border-[#E8DDD2] text-sm"
          />
          <input
            type="text"
            value={formData.descripcion}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, descripcion: e.target.value }))
            }
            placeholder="Descripción"
            className="px-3 py-2 rounded-lg border border-[#E8DDD2] text-sm"
          />
        </div>

        <SubirImagen
          productoId={producto.id}
          imagenActual={formData.imagen_url}
          onImagenSubida={(url) =>
            setFormData((prev) => ({ ...prev, imagen_url: url }))
          }
        />

        {todosModificadores.length > 0 && (
          <div>
            <div className="text-xs font-semibold text-[#8B7A6A] uppercase tracking-wider mb-2">
              Modificadores disponibles
            </div>
            <div className="space-y-1">
              {todosModificadores.map((mod) => (
                <label
                  key={mod.id}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-[#E8DDD2] cursor-pointer hover:border-amber-300 transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={asignados.includes(mod.id)}
                    onChange={() => toggleModificador(mod.id)}
                    className="w-4 h-4 rounded border-[#E8DDD2] text-amber-600 focus:ring-amber-200"
                  />
                  <div className="flex items-center gap-2 min-w-0">
                    <Sparkles size={12} className="text-amber-400 shrink-0" />
                    <span className="text-sm text-[#3D2B1F]">{mod.nombre}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${mod.tipo === "select" ? "bg-blue-50 text-blue-500" : "bg-purple-50 text-purple-500"}`}
                    >
                      {mod.tipo === "select" ? "Elegir uno" : "Varios"}
                    </span>
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.disponible !== false}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, disponible: e.target.checked }))
            }
            className="w-4 h-4 rounded border-[#E8DDD2] text-amber-600 focus:ring-amber-200"
          />
          <span className="text-sm text-[#3D2B1F] font-medium">Disponible</span>
        </label>
        <div className="flex gap-2">
          <button
            onClick={handleGuardar}
            className="px-3 py-2 bg-amber-600 text-white rounded-lg text-sm hover:bg-amber-500 cursor-pointer"
          >
            Guardar
          </button>
          <button
            onClick={() => {
              setEditando(false);
              cargarModificadores();
            }}
            className="px-3 py-2 border border-[#E8DDD2] rounded-lg text-sm hover:bg-[#F5F0EB] cursor-pointer"
          >
            Cancelar
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      className="p-4 rounded-xl border border-[#E8DDD2] bg-white hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => setEditando(true)}
    >
      <div className="flex justify-between items-start mb-2">
        <h3
          className="font-semibold text-[#3D2B1F] text-sm truncate max-w-[60%]"
          title={producto.nombre}
        >
          {producto.nombre}
        </h3>
        <div className="flex items-center gap-1.5">
          {producto.disponible === false && (
            <span className="text-[10px] uppercase tracking-wider text-red-400 bg-red-50 px-1.5 py-0.5 rounded font-semibold">
              agotado
            </span>
          )}
          <span className="text-xs text-[#8B7A6A] bg-[#F5F0EB] px-2 py-1 rounded">
            {producto.categoria}
          </span>
        </div>
      </div>
      <p
        className="text-xs text-[#8B7A6A] line-clamp-2 mb-3"
        title={producto.descripcion}
      >
        {producto.descripcion}
      </p>
      <div className="flex justify-between items-center">
        <span className="text-sm font-bold text-[#3D2B1F] tabular-nums">
          $
          {Number(producto.precio_base).toLocaleString("es-AR", {
            minimumFractionDigits: 2,
          })}
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleEliminar();
          }}
          className="w-6 h-6 rounded-lg hover:bg-red-50 flex items-center justify-center text-red-400 hover:text-red-600"
        >
          <Trash2 size={14} strokeWidth={1.5} />
        </button>
      </div>
    </motion.div>
  );
}

export default function ModalGestionarProductos({
  abierto,
  onCerrar,
  comercioId,
}) {
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [showModales, setShowModales] = useState(false);
  const [nuevoProducto, setNuevoProducto] = useState({
    nombre: "",
    precio_base: 0,
    categoria: "",
    descripcion: "",
    imagen_url: "",
  });
  const [archivoPendiente, setArchivoPendiente] = useState(null);

  useEffect(() => {
    if (!abierto || !comercioId) return;
    async function cargar() {
      setCargando(true);
      try {
        const { data, error } = await supabase
          .from("productos")
          .select("*")
          .eq("comercio_id", comercioId)
          .order("nombre", { ascending: true });

        if (error) {
          console.error("Error cargando productos:", error);
        } else {
          setProductos(data || []);
        }
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setCargando(false);
      }
    }
    cargar();
  }, [abierto, comercioId]);

  const handleCrearProducto = async () => {
    if (
      !nuevoProducto.nombre ||
      nuevoProducto.precio_base <= 0 ||
      !nuevoProducto.categoria
    ) {
      return;
    }

    try {
      const { data, error } = await supabase
        .from("productos")
        .insert({
          nombre: nuevoProducto.nombre,
          precio_base: nuevoProducto.precio_base,
          categoria: nuevoProducto.categoria,
          descripcion: nuevoProducto.descripcion,
          imagen_url: nuevoProducto.imagen_url || null,
          comercio_id: comercioId,
        })
        .select();

      if (error) {
        console.error("Error creando producto:", error);
      } else {
        const creado = data[0];

        if (archivoPendiente) {
          try {
            const ext = archivoPendiente.name.split(".").pop();
            const filePath = `${creado.id}/${Date.now()}.${ext}`;
            const { error: uploadError } = await supabase.storage
              .from("productos")
              .upload(filePath, archivoPendiente, { upsert: true });

            if (uploadError) throw uploadError;

            const { data: publicUrl } = supabase.storage
              .from("productos")
              .getPublicUrl(filePath);

            const { error: updateError } = await supabase
              .from("productos")
              .update({ imagen_url: publicUrl.publicUrl })
              .eq("id", creado.id);

            if (updateError) throw updateError;
          } catch (e) {
            console.error("Error al subir imagen:", e);
            alert("La imagen no se pudo subir. Verificá que el bucket 'productos' exista en Supabase Storage.");
          }
        }

        setArchivoPendiente(null);
        setProductos((prev) => [...prev, creado]);
        setNuevoProducto({
          nombre: "",
          precio_base: 0,
          categoria: "",
          descripcion: "",
          imagen_url: "",
        });
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const actualizarLista = () => {
    if (!comercioId) return;
    supabase
      .from("productos")
      .select("*")
      .eq("comercio_id", comercioId)
      .order("nombre", { ascending: true })
      .then(({ data, error }) => {
        if (!error) setProductos(data || []);
      });
  };

  return (
    <>
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
              className="fixed inset-4 md:inset-auto md:top-[5%] md:left-1/2 md:-translate-x-1/2 md:w-[800px] md:max-h-[90vh] z-50 bg-white rounded-2xl border border-[#E8DDD2] shadow-2xl flex flex-col overflow-hidden"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-[#E8DDD2] bg-gradient-to-r from-amber-50/50 to-white">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-100/80 border border-amber-200/60 flex items-center justify-center text-amber-600">
                    <Package size={18} strokeWidth={1.5} />
                  </div>
                  <h2 className="text-lg font-bold text-[#3D2B1F]">
                    Gestionar menú
                  </h2>
                </div>
                <button
                  onClick={onCerrar}
                  className="w-8 h-8 rounded-lg hover:bg-[#F5F0EB] flex items-center justify-center text-[#8B7A6A] hover:text-[#3D2B1F] transition-colors cursor-pointer"
                >
                  ×
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    value={nuevoProducto.nombre}
                    onChange={(e) =>
                      setNuevoProducto((prev) => ({
                        ...prev,
                        nombre: e.target.value,
                      }))
                    }
                    placeholder="Nombre del producto"
                    className="px-3 py-2 rounded-xl border border-[#E8DDD2] text-sm focus:outline-none focus:ring-2 focus:ring-amber-200"
                  />
                  <select
                    value={nuevoProducto.categoria}
                    onChange={(e) =>
                      setNuevoProducto((prev) => ({
                        ...prev,
                        categoria: e.target.value,
                      }))
                    }
                    className="px-3 py-2 rounded-xl border border-[#E8DDD2] text-sm focus:outline-none focus:ring-2 focus:ring-amber-200 bg-white appearance-none cursor-pointer"
                  >
                    <option value="">Seleccionar categoría...</option>
                    {CATEGORIAS.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    value={nuevoProducto.precio_base}
                    onChange={(e) =>
                      setNuevoProducto((prev) => ({
                        ...prev,
                        precio_base: parseFloat(e.target.value) || 0,
                      }))
                    }
                    placeholder="Precio"
                    className="px-3 py-2 rounded-xl border border-[#E8DDD2] text-sm focus:outline-none focus:ring-2 focus:ring-amber-200"
                  />
                  <input
                    type="text"
                    value={nuevoProducto.descripcion}
                    onChange={(e) =>
                      setNuevoProducto((prev) => ({
                        ...prev,
                        descripcion: e.target.value,
                      }))
                    }
                    placeholder="Descripción (opcional)"
                    className="px-3 py-2 rounded-xl border border-[#E8DDD2] text-sm focus:outline-none focus:ring-2 focus:ring-amber-200"
                  />
                </div>

                <SubirImagen
                  productoId="nuevo"
                  imagenActual={nuevoProducto.imagen_url}
                  onImagenSubida={(url) => {
                    setNuevoProducto((prev) => ({ ...prev, imagen_url: url }))
                  }}
                  onArchivoSeleccionado={setArchivoPendiente}
                />

                <button
                  onClick={handleCrearProducto}
                  disabled={
                    !nuevoProducto.nombre ||
                    !nuevoProducto.precio_base ||
                    !nuevoProducto.categoria
                  }
                  className="w-full px-4 py-3 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 disabled:from-[#E8DDD2] disabled:to-[#E8DDD2] disabled:text-[#DCCFC0] text-white font-semibold transition-all cursor-pointer disabled:cursor-not-allowed"
                >
                  Agregar producto al menú
                </button>

                <button
                  onClick={() => setShowModales(true)}
                  className="w-full px-4 py-3 rounded-xl border-2 border-dashed border-[#E8DDD2] text-sm font-semibold text-[#8B7A6A] hover:border-amber-300 hover:text-amber-600 hover:bg-amber-50/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  Gestionar modificadores
                </button>

                {cargando ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="w-5 h-5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {productos.map((producto) => (
                      <ProductoCard
                        key={producto.id}
                        producto={producto}
                        comercioId={comercioId}
                        onProductoEliminado={actualizarLista}
                        onProductoActualizado={actualizarLista}
                      />
                    ))}
                  </div>
                )}

                {productos.length === 0 && !cargando && (
                  <div className="text-center py-12 text-[#8B7A6A]">
                    <Package size={32} className="mx-auto mb-3 opacity-50" />
                    <p>No hay productos en el menú aún</p>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2.5 px-6 py-4 border-t border-[#E8DDD2] bg-[#FAF7F2]/50">
                <button
                  onClick={onCerrar}
                  className="px-4 py-2.5 rounded-xl border border-[#E8DDD2] bg-white text-[#8B7A6A] text-sm font-semibold hover:text-[#3D2B1F] hover:border-[#DCCFC0] transition-all cursor-pointer"
                >
                  Cerrar
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <ModalGestionarModificadores
        abierto={showModales}
        onCerrar={() => setShowModales(false)}
        comercioId={comercioId}
      />
    </>
  );
}
