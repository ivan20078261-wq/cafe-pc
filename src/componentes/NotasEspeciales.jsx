import { StickyNote } from 'lucide-react'

function NotasEspeciales({ notas }) {
  if (!notas) return null

  return (
    <div className="mt-3 flex items-start gap-2.5 bg-gradient-to-r from-amber-50 to-[#F5F0EB] rounded-xl p-3 border border-amber-200/50">
      <div className="mt-0.5 shrink-0 w-7 h-7 rounded-lg bg-amber-100/80 flex items-center justify-center">
        <StickyNote size={14} strokeWidth={1.5} className="text-amber-600/70" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[#6B5A4A] text-xs leading-relaxed italic font-medium">
          &ldquo;{notas}&rdquo;
        </p>
      </div>
    </div>
  )
}

export default NotasEspeciales
