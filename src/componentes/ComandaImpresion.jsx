import { useEffect } from "react";
import { X, Printer } from "lucide-react";

function itemPrecioUnitario(item) {
  if (item.precio != null) return Number(item.precio) || 0;
  if (item.total != null && item.cantidad)
    return Math.round((Number(item.total) || 0) / item.cantidad);
  return 0;
}

function totalPedido(pedido) {
  return (pedido.productos || []).reduce(
    (sum, item) => sum + itemPrecioUnitario(item) * (Number(item.cantidad) || 1),
    0,
  );
}

export default function ComandaImpresion({ pedido, comercio, onCerrar }) {
  useEffect(() => {
    const t = setTimeout(() => {
      window.print();
    }, 120);
    return () => clearTimeout(t);
  }, []);

  const total = pedido?.total ?? totalPedido(pedido);
  const fecha = new Date(pedido?.creadoEn || Date.now());

  return (
    <div className="fixed inset-0 z-[70]">
      <div
        className="absolute inset-0 bg-black/60 print-hide"
        onClick={onCerrar}
      />
      <div className="absolute inset-0 flex items-center justify-center p-4 print-hide pointer-events-none">
        <div className="pointer-events-auto bg-white rounded-2xl shadow-2xl border border-[#E8DDD2] p-6 max-w-xs text-center">
          <Printer size={32} strokeWidth={1.5} className="mx-auto text-amber-500 mb-2" />
          <h3 className="font-bold text-[#3D2B1F]">Comanda enviada a imprimir</h3>
          <p className="text-xs text-[#8B7A6A] mt-1">
            Si no abrió el diálogo de impresión, revisá que tu navegador permita ventanas emergentes.
          </p>
          <button
            onClick={onCerrar}
            className="mt-4 px-5 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 text-white text-sm font-semibold cursor-pointer"
          >
            Listo
          </button>
        </div>
      </div>

      <div className="print-area bg-white text-black font-mono p-6 text-sm leading-relaxed absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 shadow-2xl w-[360px] print:shadow-none print:relative print:left-auto print:top-auto print:transform-none print:mx-auto">
        <div className="text-center mb-3">
          <p className="text-base font-bold tracking-wide">
            {comercio?.nombre || "Comandera"}
          </p>
          <p className="text-xs">
            {fecha.toLocaleDateString("es-AR")} · {fecha.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}
          </p>
          {comercio?.telefono && <p className="text-xs">{comercio.telefono}</p>}
          {comercio?.direccion && <p className="text-xs">{comercio.direccion}</p>}
        </div>

        <p className="text-center font-bold tracking-widest border-y border-black py-1 my-2">
          COMENDA · MESA {pedido?.mesa}
        </p>

        <div className="mt-2">
          {(pedido?.productos || []).map((item, i) => (
            <div key={i} className="mb-2">
              <div className="flex justify-between gap-2">
                <span className="flex-1">
                  {Number(item.cantidad) || 1} × {item.nombre}
                </span>
                <span>
                  ${(itemPrecioUnitario(item) * (Number(item.cantidad) || 1)).toLocaleString("es-AR")}
                </span>
              </div>
              {item.modificadores && item.modificadores.length > 0 && (
                <div className="text-xs text-black/60 pl-3">
                  {Array.isArray(item.modificadores)
                    ? item.modificadores.map((m, j) => <div key={j}>· {m}</div>)
                    : <div>· {item.modificadores}</div>}
                </div>
              )}
            </div>
          ))}
        </div>

        {(pedido?.notas || pedido?.motivoCancelacion) && (
          <p className="text-xs mt-1">
            {pedido.notas ? `Notas: ${pedido.notas}` : ""}
            {pedido.motivoCancelacion ? `Motivo cancelación: ${pedido.motivoCancelacion}` : ""}
          </p>
        )}

        <p className="flex justify-between font-bold border-t border-black pt-1 mt-3">
          <span>TOTAL</span>
          <span>${total.toLocaleString("es-AR")}</span>
        </p>

        <p className="text-center text-xs mt-4">¡Gracias por tu pedido!</p>
      </div>
    </div>
  );
}