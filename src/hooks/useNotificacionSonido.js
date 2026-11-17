import { useEffect, useRef } from 'react'

// Genera un beep simple sin archivo externo
function crearBeep() {
  try {
    const ctx = new AudioContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.frequency.value = 880
    gain.gain.value = 0.15
    osc.start()
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4)
    osc.stop(ctx.currentTime + 0.4)
  } catch {}
}

export default function useNotificacionSonido(pedidos) {
  const prevCount = useRef(pedidos.length)

  useEffect(() => {
    if (pedidos.length > prevCount.current) {
      crearBeep()
      // Segundo beep más agudo
      setTimeout(() => crearBeep(), 200)
    }
    prevCount.current = pedidos.length
  }, [pedidos.length])
}
