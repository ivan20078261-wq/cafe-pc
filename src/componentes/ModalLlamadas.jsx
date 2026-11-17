import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../supabase'

export default function ModalLlamadas({ abierto, onCerrar, llamadas, onAtender }) {
  if (!abierto) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
        onClick={onCerrar}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="fixed inset-4 md:inset-auto md:top-[8%] md:left-1/2 md:-translate-x-1/2 md:w-[480px] md:max-h-[84vh] z-50 bg-white rounded-2xl border border-[#E8DDD2] shadow-2xl flex flex-col overflow-hidden"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E8DDD2] bg-gradient-to-r from-amber-50/50 to-white">
          <h2 className="text-lg font-bold text-[#3D2B1F]">Llamadas pendientes</h2>
          <button
            onClick={onCerrar}
            className="px-3 py-1.5 rounded-lg border border-[#E8DDD2] bg-white text-[#8B7A6A] text-sm hover:text-[#3D2B1F] cursor-pointer"
          >
            Cerrar
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {llamadas.length === 0 ? (
            <p className="text-center text-[#8B7A6A] py-8">No hay llamadas pendientes.</p>
          ) : (
            <div className="space-y-3">
              {llamadas.map((l) => (
                <div
                  key={l.id}
                  className="flex items-center justify-between p-4 rounded-xl border border-[#E8DDD2] bg-[#FAF7F2]/50"
                >
                  <div>
                    <p className="font-bold text-[#3D2B1F]">Mesa {l.numero_mesa ?? '?'}</p>
                    <p className="text-sm text-[#8B7A6A]">
                      {l.tipo === 'mozo' ? 'Llamar al mozo' : 'Pedir la cuenta'}
                    </p>
                    <p className="text-xs text-[#8B7A6A]">
                      {new Date(l.creado_at).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <button
                    onClick={() => onAtender(l.id)}
                    className="px-4 py-2 rounded-xl bg-amber-600 text-white text-sm font-semibold hover:bg-amber-700 cursor-pointer"
                  >
                    Atendido
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  )
}