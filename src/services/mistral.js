import { supabase } from '../supabase'

const MISTRAL_FUNCTION = 'ask-mistral'

async function chat(messages, options = {}) {
  try {
    const { data, error } = await supabase.functions.invoke(MISTRAL_FUNCTION, {
      body: {
        model: options.model || 'mistral-small-latest',
        messages,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.max_tokens ?? 300,
        requireAuth: true,
      },
    })

    if (error) {
      console.error('Error Mistral:', error)
      return null
    }

    return data.content ?? null
  } catch (err) {
    console.error('Error de red con Mistral:', err)
    return null
  }
}

export async function predecirTiempo(productos, totalItems, hora, pedidosActivos) {
  const lista = productos
    .map((p) => {
      const mods = p.modificadores || []
      const texto = mods
        .map((m) => (typeof m === 'string' ? m : m.nombre))
        .join(', ')
      return `${p.nombre}${mods.length ? ` (${texto})` : ''}`
    })
    .join(', ')

  const respuesta = await chat(
    [
      {
        role: 'system',
        content:
          'Sos un sistema de predicción para una cafetería. Respondé SOLO con un número entero que indica minutos estimados de preparación. Nada más.',
      },
      {
        role: 'user',
        content: `Pedido: ${lista}. Total items: ${totalItems}. Hora: ${hora}. Pedidos activos: ${pedidosActivos}. ¿Cuántos minutos tarda?`,
      },
    ],
    { temperature: 0.3, max_tokens: 10 },
  )

  const minutos = parseInt(respuesta, 10)
  return isNaN(minutos) ? 5 : Math.max(1, Math.min(20, minutos))
}

export async function generarInsights(datosDelDia) {
  const respuesta = await chat(
    [
      {
        role: 'system',
        content:
          'Sos el analista de Café Central. Generás insights cortos y accionables en español.',
      },
      {
        role: 'user',
        content: `Datos de hoy:
- Pedidos totales: ${datosDelDia.pedidosTotales}
- Producto más vendido: ${datosDelDia.masVendido} (${datosDelDia.masVendidoVeces} veces)
- Tiempo promedio de preparación: ${datosDelDia.tiempoPromedio} min
- Total facturado: $${datosDelDia.totalFacturado}
- Ticket promedio: $${datosDelDia.ticketPromedio}
- Pedidos por hora: ${JSON.stringify(datosDelDia.pedidosPorHora)}

Generá exactamente 5 insights cortos (1-2 oraciones cada uno) y accionables. Sin emojis, sin negrita y sin items.`,
      },
    ],
    { temperature: 0.7, max_tokens: 300 },
  )

  return respuesta
}