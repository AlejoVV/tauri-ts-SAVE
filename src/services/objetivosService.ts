// src/features/objetivos/services/objetivosService.ts

import { supabase } from "../lib/supabaseClient"

export interface ObjetivoConPrecios {
  objetivo_id: number
  objetivo_nombre: string
  objetivo_descripcion: string | null
  objetivo_procedimiento: string | null
  objetivo_dias_entrega_resultados: number | null
  objetivo_general: string | null
  objetivo_tipo_prueba: string | null
  precio_quimico: number | null
  precio_biologico: number | null
}

export const getObjetivosConPrecios = async (): Promise<ObjetivoConPrecios[]> => {
  // Primero, obtenemos todos los objetivos
  const { data: objetivos, error: objetivosError } = await supabase
    .from("objetivos")
    .select("objetivo_id, objetivo_nombre, objetivo_descripcion, objetivo_procedimiento,objetivo_dias_entrega_resultados, objetivo_general, objetivo_tipo_prueba")
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
    objetivo_procedimiento: objetivo.objetivo_procedimiento,
    objetivo_dias_entrega_resultados: objetivo.objetivo_dias_entrega_resultados,
    objetivo_general: objetivo.objetivo_general,
    objetivo_tipo_prueba: objetivo.objetivo_tipo_prueba,
    precio_quimico: preciosPorObjetivo[objetivo.objetivo_id]?.quimico || null,
    precio_biologico: preciosPorObjetivo[objetivo.objetivo_id]?.biologico || null
  }))

  return objetivosConPrecios
}

// Nueva función para actualizar un objetivo
export const updateObjetivo = async (
  objetivoId: number, 
  data: {
    objetivo_nombre?: string
    objetivo_descripcion?: string | null
    objetivo_general?: string | null
    objetivo_procedimiento?: string | null
    objetivo_tipo_prueba?: string | null
    objetivo_dias_entrega_resultados?: number | null
  }
): Promise<void> => {
  const { error } = await supabase
    .from("objetivos")
    .update(data)
    .eq("objetivo_id", objetivoId)
  
  if (error) {
    console.error("Error al actualizar objetivo:", error)
    throw error
  }
}
// Nueva función para actualizar un precio
export const updatePrecio = async (
  objetivoId: number,
  tipoProducto: string,
  precio: number | null
): Promise<void> => {
  // Primero verificamos si ya existe un precio para este objetivo y tipo
  const { data: existingPrices, error: fetchError } = await supabase
    .from("precios_objetivo_tipo")
    .select("precio_id")
    .eq("precio_objetivo_id", objetivoId)
    .eq("precio_tipo_producto", tipoProducto)
  
  if (fetchError) {
    console.error("Error al verificar precio existente:", fetchError)
    throw fetchError
  }
  
  if (existingPrices && existingPrices.length > 0) {
    // Si existe, actualizamos
    const { error } = await supabase
      .from("precios_objetivo_tipo")
      .update({ precio })
      .eq("precio_id", existingPrices[0].precio_id)
    
    if (error) {
      console.error("Error al actualizar precio:", error)
      throw error
    }
  } else if (precio !== null) {
    // Si no existe y el precio no es nulo, lo creamos
    const { error } = await supabase
      .from("precios_objetivo_tipo")
      .insert({
        precio_objetivo_id: objetivoId,
        precio_tipo_producto: tipoProducto,
        precio
      })
    
    if (error) {
      console.error("Error al crear precio:", error)
      throw error
    }
  }
  // Si no existe y el precio es nulo, no hacemos nada
}

// Función para actualizar un objetivo con sus precios
export const updateObjetivoConPrecios = async (
  objetivo: ObjetivoConPrecios
): Promise<void> => {
  try {
    // Actualizamos el objetivo
    const { objetivo_id, precio_quimico, precio_biologico, ...objetivoData } = objetivo
    
    await updateObjetivo(objetivo_id, objetivoData)
    
    // Actualizamos los precios
    if (precio_quimico !== undefined) {
      await updatePrecio(objetivo_id, "Químico", precio_quimico)
    }
    
    if (precio_biologico !== undefined) {
      await updatePrecio(objetivo_id, "Biológico", precio_biologico)
    }
  } catch (error) {
    console.error("Error al actualizar objetivo con precios:", error)
    throw error
  }
}

// Función para crear un objetivo con sus precios
export const createObjetivoConPrecios = async (
  objetivo: Omit<ObjetivoConPrecios, 'objetivo_id'>
): Promise<ObjetivoConPrecios> => {
  try {
    // Extraer los precios del objeto
    const { precio_quimico, precio_biologico, ...objetivoData } = objetivo
    
    // Crear el objetivo
    const { data: newObjetivo, error: objetivoError } = await supabase
      .from("objetivos")
      .insert(objetivoData)
      .select()
      .single()
    
    if (objetivoError) throw objetivoError
    
    if (!newObjetivo) {
      throw new Error("No se pudo crear el objetivo")
    }
    
    const objetivo_id = newObjetivo.objetivo_id
    
    // Crear precio químico si existe
    if (precio_quimico !== null && precio_quimico !== undefined) {
      const { error: quimicoError } = await supabase
        .from("precios_objetivo_tipo")
        .insert({
          precio_objetivo_id: objetivo_id,
          precio_tipo_producto: "Químico",
          precio: precio_quimico
        })
      
      if (quimicoError) throw quimicoError
    }
    
    // Crear precio biológico si existe
    if (precio_biologico !== null && precio_biologico !== undefined) {
      const { error: biologicoError } = await supabase
        .from("precios_objetivo_tipo")
        .insert({
          precio_objetivo_id: objetivo_id,
          precio_tipo_producto: "Biológico",
          precio: precio_biologico
        })
      
      if (biologicoError) throw biologicoError
    }
    
    // Devolver el nuevo objetivo con sus precios
    return {
      ...newObjetivo,
      precio_quimico,
      precio_biologico
    }
  } catch (error) {
    console.error("Error al crear objetivo con precios:", error)
    throw error
  }
}