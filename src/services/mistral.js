const MISTRAL_API_KEY = import.meta.env.VITE_MISTRAL_API_KEY;
const MISTRAL_URL = "https://api.mistral.ai/v1/chat/completions";

async function chat(messages, options = {}) {
  if (!MISTRAL_API_KEY) {
    console.error("Falta VITE_MISTRAL_API_KEY en .env");
    return null;
  }

  try {
    const res = await fetch(MISTRAL_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${MISTRAL_API_KEY}`,
      },
      body: JSON.stringify({
        model: options.model || "mistral-small-latest",
        messages,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.max_tokens ?? 300,
      }),
    });

    if (!res.ok) {
      console.error("Error Mistral:", res.status, await res.text());
      return null;
    }

    const data = await res.json();
    return data.choices[0]?.message?.content?.trim() ?? null;
  } catch (err) {
    console.error("Error de red con Mistral:", err);
    return null;
  }
}

export async function predecirTiempo(
  productos,
  totalItems,
  hora,
  pedidosActivos,
) {
  const lista = productos
    .map((p) => {
      const mods = p.modificadores || [];
      const texto = mods
        .map((m) => (typeof m === "string" ? m : m.nombre))
        .join(", ");
      return `${p.nombre}${mods.length ? ` (${texto})` : ""}`;
    })
    .join(", ");

  const respuesta = await chat(
    [
      {
        role: "system",
        content:
          "Sos un sistema de predicción para una cafetería. Respondé SOLO con un número entero representing minutos estimados de preparación. Nada más.",
      },
      {
        role: "user",
        content: `Pedido: ${lista}. Total items: ${totalItems}. Hora: ${hora}. Pedidos activos: ${pedidosActivos}. ¿Cuántos minutos tarda?`,
      },
    ],
    { temperature: 0.3, max_tokens: 10 },
  );

  const minutos = parseInt(respuesta, 10);
  return isNaN(minutos) ? 5 : Math.max(1, Math.min(20, minutos));
}

export async function chatBarista(mensajesHistorial, menuItems) {
  const menu = menuItems
    .map((m) => `- ${m.nombre}: $${m.precio} — ${m.descripcion}`)
    .join("\n");

  const mensajes = [
    {
      role: "system",
      content: `Sos el barista virtual de Café Central. Recomendás cafés del menú.
Menú disponible:
${menu}

Reglas:
- Solo recomendá cosas del menú
- Sé breve (1-2 oraciones máximo) y amigable
- Si preguntan por precio, incluilo
- Si no sabés algo, decí "preguntale al personal"
- Usá español coloquial argentino`,
    },
    ...mensajesHistorial,
  ];

  return await chat(mensajes, { temperature: 0.8, max_tokens: 150 });
}

export async function generarInsights(datosDelDia) {
  return await chat(
    [
      {
        role: "system",
        content:
          "Sos el analista de Café Central. Generás insights cortos y accionables en español.",
      },
      {
        role: "user",
        content: `Datos de hoy:
- Pedidos totales: ${datosDelDia.pedidosTotales}
- Producto más vendido: ${datosDelDia.masVendido} (${datosDelDia.masVendidoVeces} veces)
- Tiempo promedio de preparación: ${datosDelDia.tiempoPromedio} min
- Total facturado: $${datosDelDia.totalFacturado}
- Ticket promedio: $${datosDelDia.ticketPromedio}
- Pedidos por hora: ${JSON.stringify(datosDelDia.pedidosPorHora)}

Generá exactamente 5 insights cortos (1-2 oraciones cada uno) y accionables. Sin empojis, sin negtrita y sin items.`,
      },
    ],
    { temperature: 0.7, max_tokens: 300 },
  );
}

export async function predecirDemana(promedioHistorico, diaSemana) {
  return await chat(
    [
      {
        role: "system",
        content:
          "Sos un predictor de demanda para una cafetería. Respondé con una estimación concisa.",
      },
      {
        role: "user",
        content: `Promedio histórico de pedidos: ${promedioHistorico}/día. Hoy es ${diaSemana}. ¿Cuántos pedidos estimás para hoy? Respondé con un número y una frase corta explicando por qué.`,
      },
    ],
    { temperature: 0.5, max_tokens: 100 },
  );
}
