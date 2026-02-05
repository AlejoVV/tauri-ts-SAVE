// Servicio para obtener datos de pruebas asociadas a una orden de trabajo
import { supabase } from "../../nucleo/lib/supabaseClient";
import type { Tables } from "../../nucleo/lib/supabase";

// Type for vistamaestra row
export type VistaMaestraRow = Tables<"vistamaestratotal">;

/**
 * Obtiene todas las pruebas asociadas a una orden de trabajo específica
 * desde la vista vistamaestratotal
 * @param ordenId - ID de la orden de trabajo
 * @returns Array de pruebas de la vista maestra
 */
export async function obtenerPruebasPorOrden(
  ordenId: number
): Promise<VistaMaestraRow[]> {
  const { data, error } = await supabase
    .from("vistamaestratotal")
    .select("*")
    .eq("prueba_orden_id", ordenId)
    .order("prueba_id", { ascending: true });

  if (error) {
    console.error("Error al obtener pruebas por orden:", error);
    throw error;
  }

  return data || [];
}

/**
 * Obtiene el conteo de pruebas para una orden de trabajo
 * @param ordenId - ID de la orden de trabajo
 * @returns Número de pruebas asociadas
 */
export async function contarPruebasPorOrden(
  ordenId: number
): Promise<number> {
  const { count, error } = await supabase
    .from("vistamaestratotal")
    .select("*", { count: "exact", head: true })
    .eq("prueba_orden_id", ordenId);

  if (error) {
    console.error("Error al contar pruebas por orden:", error);
    throw error;
  }

  return count || 0;
}
