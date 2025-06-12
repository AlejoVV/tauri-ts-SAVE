import { supabase } from "../lib/supabaseClient"
import type { Tables } from "../lib/supabase"

export type VistaMaestraTotalRow = Tables<"vistamaestratotal">

export interface EditableFields {
  observaciones: string | null
  notas_varias: string | null
  prueba_estado_lab: string | null
  estado_fact: string | null
  estado_ot: string | null
}

// Función para obtener todos los datos de la vista maestra total
export const getVistaMaestraTotal = async (): Promise<VistaMaestraTotalRow[]> => {
  const { data, error } = await supabase
    .from("vistamaestratotal")
    .select("*")
    .order("prueba_id", { ascending: false })

  if (error) {
    console.error("Error al obtener datos de vista maestra total:", error)
    throw error
  }

  return data || []
}

// Función para actualizar campos en la tabla pruebas_ordenes_trabajo
export const updatePruebaOrdenTrabajo = async (
  pruebaId: number,
  data: {
    prueba_obs?: string | null
    prueba_notas_varias?: string | null
    prueba_estado_lab?: string | null
    prueba_estado_facturacion?: string | null
  }
): Promise<void> => {
  const { error } = await supabase
    .from("pruebas_ordenes_trabajo")
    .update(data)
    .eq("prueba_id", pruebaId)

  if (error) {
    console.error("Error al actualizar prueba orden trabajo:", error)
    throw error
  }
}

// Función para actualizar el estado de OT en la tabla ordenes_trabajo
export const updateOrdenTrabajoEstado = async (
  ordenId: number,
  estadoOt: string | null
): Promise<void> => {
  const { error } = await supabase
    .from("ordenes_trabajo")
    .update({ orden_estado_ot: estadoOt })
    .eq("orden_id", ordenId)

  if (error) {
    console.error("Error al actualizar estado de orden trabajo:", error)
    throw error
  }
}

// Función combinada para actualizar tanto la prueba como el estado de OT
export const updateVistaMaestraFields = async (
  pruebaId: number,
  ordenId: number | null,
  updates: {
    observaciones?: string | null
    notas_varias?: string | null
    prueba_estado_lab?: string | null
    estado_fact?: string | null
    estado_ot?: string | null
  }
): Promise<void> => {
  try {
    // Separar las actualizaciones para la tabla de pruebas y la de órdenes
    const { estado_ot, ...pruebaUpdates } = updates

    // Mapear los nombres de campos de la vista a los de la tabla
    const mappedPruebaUpdates: {
      prueba_obs?: string | null
      prueba_notas_varias?: string | null
      prueba_estado_lab?: string | null
      prueba_estado_facturacion?: string | null
    } = {}

    // Mapear todos los campos que vengan en la actualización
    if (pruebaUpdates.observaciones !== undefined) {
      mappedPruebaUpdates.prueba_obs = pruebaUpdates.observaciones
    }
    if (pruebaUpdates.notas_varias !== undefined) {
      mappedPruebaUpdates.prueba_notas_varias = pruebaUpdates.notas_varias
    }
    if (pruebaUpdates.prueba_estado_lab !== undefined) {
      mappedPruebaUpdates.prueba_estado_lab = pruebaUpdates.prueba_estado_lab
    }
    if (pruebaUpdates.estado_fact !== undefined) {
      mappedPruebaUpdates.prueba_estado_facturacion = pruebaUpdates.estado_fact
    }

    // Actualizar la tabla pruebas_ordenes_trabajo si hay cambios
    if (Object.keys(mappedPruebaUpdates).length > 0) {
      await updatePruebaOrdenTrabajo(pruebaId, mappedPruebaUpdates)
    }

    // Actualizar el estado de OT si se proporciona y hay un ordenId válido
    if (estado_ot !== undefined && ordenId !== null) {
      await updateOrdenTrabajoEstado(ordenId, estado_ot)
    }
  } catch (error) {
    console.error("Error al actualizar campos de vista maestra:", error)
    throw error
  }
}





 