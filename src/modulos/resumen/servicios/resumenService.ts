import { supabase } from "@/modulos/nucleo/lib/supabaseClient";
import type { Tables } from "@/modulos/nucleo/lib/supabase";

export type VistaMaestraTotalRow = Tables<"vistamaestratotal">;

export async function getResumenPruebas(): Promise<VistaMaestraTotalRow[]> {
  try {
    let allData: VistaMaestraTotalRow[] = [];
    let from = 0;
    const pageSize = 1000;
    let hasMore = true;

    while (hasMore) {
      const { data, error } = await supabase
        .from("vistamaestratotal")
        .select("*")
        .in("prueba_estado_lab", ["En Curso", "En curso", "Esperando Aprobación"])
        .or("estado_ot.is.null,estado_ot.neq.Cerrada")
        .order("prueba_id", { ascending: false })
        .range(from, from + pageSize - 1);

      if (error) throw error;

      if (data && data.length > 0) {
        allData = [...allData, ...data];
        from += pageSize;
        hasMore = data.length === pageSize;
      } else {
        hasMore = false;
      }
    }

    return allData;
  } catch (error) {
    console.error("Error al obtener resumen de pruebas:", error);
    throw error;
  }
}

export async function updateEstadoProceso(
  pruebaId: number,
  estadoProceso: string | null
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from("pruebas_ordenes_trabajo")
      .update({ prueba_estado_proceso: estadoProceso })
      .eq("prueba_id", pruebaId);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error("Error al actualizar estado proceso:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}
