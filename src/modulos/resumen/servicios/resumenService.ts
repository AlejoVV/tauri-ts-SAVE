import { supabase } from "../../nucleo/lib/supabaseClient"
import type { Tables } from "../../nucleo/lib/supabase"
import { updatePruebaOrdenTrabajo } from "../../ordenes-trabajo/servicios/vistaMaestraService"

export type VistaMaestraTotalRow = Tables<"vistamaestratotal">

// Filtro: prueba_estado_lab IN ('En Curso','En curso','Esperando Aprobación')
// y estado_ot IS NULL OR estado_ot != 'Cerrada'
export const getResumenPruebas = async (): Promise<VistaMaestraTotalRow[]> => {
  let allData: VistaMaestraTotalRow[] = []
  let from = 0
  const pageSize = 1000
  let hasMore = true

  while (hasMore) {
    const { data, error } = await supabase
      .from("vistamaestratotal")
      .select("*")
      .in("prueba_estado_lab", ["En Curso", "En curso", "Esperando Aprobación"])
      .or("estado_ot.is.null,estado_ot.neq.Cerrada")
      .order("prueba_id", { ascending: false })
      .range(from, from + pageSize - 1)

    if (error) throw error

    if (data && data.length > 0) {
      allData = [...allData, ...data]
      from += pageSize
      hasMore = data.length === pageSize
    } else {
      hasMore = false
    }
  }

  return allData
}

// Reutiliza updatePruebaOrdenTrabajo (ya acepta prueba_estado_proceso)
export const updateEstadoProceso = async (
  pruebaId: number,
  estadoProceso: string | null
): Promise<void> => {
  await updatePruebaOrdenTrabajo(pruebaId, { prueba_estado_proceso: estadoProceso })
}
