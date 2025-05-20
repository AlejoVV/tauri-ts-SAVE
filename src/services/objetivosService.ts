// src/features/objetivos/services/objetivosService.ts

import { supabase } from "../lib/supabaseClient"

export interface ObjetivoConPrecios {
  objetivo_id: number
  objetivo_nombre: string
  objetivo_descripcion: string | null
  objetivo_general: string | null
  objetivo_tipo_prueba: string | null
  precio_quimico: number | null
  precio_biologico: number | null
}

export const getObjetivosConPrecios = async (): Promise<ObjetivoConPrecios[]> => {
  // Primero, obtenemos todos los objetivos
  const { data: objetivos, error: objetivosError } = await supabase
    .from("objetivos")
    .select("*")
    .order("objetivo_id", { ascending: true })

  if (objetivosError) {
    console.error("Error al obtener objetivos:", objetivosError)
    throw objetivosError
  }

  // Luego, obtenemos todos los precios
  const { data: precios, error: preciosError } = await supabase
    .from("precios_objetivo_tipo")
    .select("*")

  if (preciosError) {
    console.error("Error al obtener precios:", preciosError)
    throw preciosError
  }

  // Organizamos los precios por objetivo_id y tipo_producto
  const preciosPorObjetivo: Record<number, { quimico: number | null; biologico: number | null }> = {}
  
  precios.forEach(precio => {
    if (!precio.precio_objetivo_id) return
    
    if (!preciosPorObjetivo[precio.precio_objetivo_id]) {
      preciosPorObjetivo[precio.precio_objetivo_id] = {
        quimico: null,
        biologico: null
      }
    }
    
    // Asumiendo que precio_tipo_producto puede ser "Químico" o "Biológico"
    if (precio.precio_tipo_producto?.toLowerCase() === "químico" || 
        precio.precio_tipo_producto?.toLowerCase() === "quimico") {
      preciosPorObjetivo[precio.precio_objetivo_id].quimico = precio.precio
    } else if (precio.precio_tipo_producto?.toLowerCase() === "biológico" || 
               precio.precio_tipo_producto?.toLowerCase() === "biologico") {
      preciosPorObjetivo[precio.precio_objetivo_id].biologico = precio.precio
    }
  })

  // Combinamos los datos
  const objetivosConPrecios: ObjetivoConPrecios[] = objetivos.map(objetivo => ({
    objetivo_id: objetivo.objetivo_id,
    objetivo_nombre: objetivo.objetivo_nombre,
    objetivo_descripcion: objetivo.objetivo_descripcion,
    objetivo_general: objetivo.objetivo_general,
    objetivo_tipo_prueba: objetivo.objetivo_tipo_prueba,
    precio_quimico: preciosPorObjetivo[objetivo.objetivo_id]?.quimico || null,
    precio_biologico: preciosPorObjetivo[objetivo.objetivo_id]?.biologico || null
  }))

  return objetivosConPrecios
}