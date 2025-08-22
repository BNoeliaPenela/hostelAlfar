import type React from "react"
import { createContext, useContext, useState } from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

//Se crea un contexto para que todos los subcomponentes (DialogContent, DialogHeader, etc.) puedan saber si el modal está abierto (open) y tener acceso a la función que lo abre/cierra (onOpenChange).
interface DialogContextType {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const DialogContext = createContext<DialogContextType | undefined>(undefined)

// Props que recibe el componente Dialog
interface DialogProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children: React.ReactNode
}

// Componente principal que maneja el estado de apertura/cierre del modal
function Dialog({ open: controlledOpen, onOpenChange, children }: DialogProps) {
  const [internalOpen, setInternalOpen] = useState(false)

  const open = controlledOpen !== undefined ? controlledOpen : internalOpen
  const handleOpenChange = onOpenChange || setInternalOpen

  return <DialogContext.Provider value={{ open, onOpenChange: handleOpenChange }}>{children}</DialogContext.Provider>
}

// Componente que representa el contenido del modal
//Usa el contexto para saber si el modal está abierto.
//Si open es false, directamente no renderiza nada (return null).
function DialogContent({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  const context = useContext(DialogContext)
  if (!context) throw new Error("DialogContent must be used within Dialog")

  const { open, onOpenChange } = context

  if (!open) return null

  // Renderiza el fondo oscuro y el contenido del modal
  //Renderizar significa que se muestra en pantalla el componente.
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={() => onOpenChange(false)} />
      <div
        className={cn("relative z-50 w-full max-w-lg mx-4 bg-background rounded-lg shadow-lg bg-gray-50 ", className)}
        {...props}
      >
        <button
          onClick={() => onOpenChange(false)}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          <X className="h-4 w-4" />
        </button>
        {children}
      </div>
    </div>
  )
}

function DialogHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-col space-y-1.5 text-center sm:text-left p-6 pb-0 bg-gray-50 ", className)} {...props} />
}

function DialogTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={cn("text-lg font-semibold leading-none tracking-tight", className)} {...props} />
}

export { Dialog, DialogContent, DialogHeader, DialogTitle }
