import React from "react"
import { cn } from "@/lib/utils"

//set de componentes reutilizables que forman una tarjeta visual, con estilos base definidos y la opción de añadir más clases con className.

//1. react.forwardRef permite que el componente pueda recibir una referencia (ref) desde su padre, lo cual es útil para manipular el DOM directamente si es necesario.
//2. htmldivElement es el tipo de elemento HTML que se va a crear, en este caso un div.
//3. React.HTMLAttributes<HTMLDivElement> permite que el componente acepte todas las propiedades de un div HTML estándar, como className, style, etc.
const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("rounded-lg border bg-card text-card-foreground shadow-sm", className)} {...props} />
))
//displayName es una propiedad que se usa para dar un nombre al componente en las herramientas de desarrollo, facilitando la identificación del componente.
Card.displayName = "Card"

// Un contenedor para la parte superior de la tarjeta, con padding y disposición vertical
const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />
  ),
)
CardHeader.displayName = "CardHeader"

// Un título grande (h3) con fuente seminegrita.
const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3 ref={ref} className={cn("text-2xl font-semibold leading-none tracking-tight", className)} {...props} />
  ),
)
CardTitle.displayName = "CardTitle"

// Una descripción pequeña (p) con un color de texto atenuado.
const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn("text-sm text-muted-foreground", className)} {...props} />
  ),
)
CardDescription.displayName = "CardDescription"

// Un contenedor para el contenido de la tarjeta, con padding y sin padding superior.
const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />,
)
CardContent.displayName = "CardContent"

export { Card, CardHeader, CardTitle, CardDescription, CardContent }
