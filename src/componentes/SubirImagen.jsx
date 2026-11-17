import { useState, useRef } from "react";
import { Upload } from "lucide-react";
import { supabase } from "../supabase";

export default function SubirImagen({
  productoId,
  imagenActual,
  onImagenSubida,
  onArchivoSeleccionado,
}) {
  const [subiendo, setSubiendo] = useState(false);
  const [preview, setPreview] = useState(null);
  const inputRef = useRef(null);

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);

    if (onArchivoSeleccionado) {
      onArchivoSeleccionado(file);
      return;
    }

    setSubiendo(true);
    try {
      const ext = file.name.split(".").pop();
      const filePath = `${productoId}/${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("productos")
        .upload(filePath, file, {
          cacheControl: "0",
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const { data: publicUrl } = supabase.storage
        .from("productos")
        .getPublicUrl(filePath);

      onImagenSubida(publicUrl.publicUrl);
    } catch (err) {
      console.error("Error al subir imagen:", err);
      alert("Error al subir la imagen. Verificá que el bucket 'productos' exista en Supabase Storage.");
    } finally {
      setSubiendo(false);
    }
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFile}
        className="hidden"
      />

      <button
        type="button"
        disabled={subiendo}
        onClick={() => inputRef.current?.click()}
        className={`w-full p-4 rounded-xl border-2 border-dashed border-[#E8DDD2] flex flex-col items-center gap-2 transition-all cursor-pointer ${
          subiendo ? "opacity-60 cursor-not-allowed" : "hover:border-amber-300 hover:bg-[#F5F0EB]"
        }`}
      >
        {preview || imagenActual ? (
          <img
            src={preview || imagenActual}
            alt="Preview"
            className="w-full max-h-40 object-cover rounded-lg"
          />
        ) : (
          <>
            <Upload size={32} className="text-[#8B7A6A]" />
            <span className="text-sm font-medium text-[#8B7A6A]">
              {subiendo ? "Subiendo…" : "Tocar para subir foto"}
            </span>
          </>
        )}
      </button>
    </div>
  );
}
