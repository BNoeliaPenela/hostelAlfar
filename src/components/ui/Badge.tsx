import type React from "react"
import { cn } from "@/lib/utils"

// Props que recibe el componente Badge
// variant es opcional y puede ser uno de los cuatro valores.
interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "destructive" | "outline"
}


function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <div
    //cn es una función que combina clases de Tailwind CSS.
    //Aquí se usan clases base para el badge y luego se agregan clases específicas según el variant.
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        {
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80": variant === "default",
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80": variant === "secondary",
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80":
            variant === "destructive",
          "text-foreground": variant === "outline",
        },
        className,//classname permite agregar clases adicionales al badge desde donde se use el componente.
      )}
      {...props} //permite pasar cualquier otro atributo de HTML (onClick, title, etc.).
    />
  )
}

export { Badge }
