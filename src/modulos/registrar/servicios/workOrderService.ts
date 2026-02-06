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

/**
 * Tipo para los datos de una OT al cargarla para adicionar pruebas
 */
export interface OTData {
  numeroOT: number;
  facturarA: string;
  facturarAId: string;
  contacto: string;
  contactoId: string;
  finca: string;
  fincaId: string;
  descuento: string;
}

/**
 * Busca una orden de trabajo por su número y retorna los datos necesarios
 * para adicionar nuevas pruebas manteniendo la información de facturación
 * @param numeroOT - Número de la orden de trabajo a buscar
 * @returns Datos de la OT para cargar en el formulario
 */
export async function buscarOTPorNumero(numeroOT: number): Promise<OTData> {
  // async-parallel - Fetch order and first test data in parallel
  const [ordenResult, pruebaResult] = await Promise.all([
    supabase
      .from("ordenes_trabajo")
      .select("orden_id, orden_descuento")
      .eq("orden_id", numeroOT)
      .single(),
    supabase
      .from("pruebas_ordenes_trabajo")
      .select(
        `
        prueba_compania,
        prueba_contacto,
        prueba_finca_id,
        fincas (
          finca_id,
          finca_nombre
        )
      `
      )
      .eq("prueba_orden_id", numeroOT)
      .limit(1)
      .single(),
  ]);

  // Validar que la orden existe
  if (ordenResult.error || !ordenResult.data) {
    throw new Error(
      `No se encontró la OT #${numeroOT}. Verifique el número e intente nuevamente.`
    );
  }

  // Validar que la orden tiene al menos una prueba
  if (pruebaResult.error || !pruebaResult.data) {
    throw new Error(
      `La OT #${numeroOT} no tiene pruebas registradas. No se pueden obtener datos de facturación.`
    );
  }

  const prueba = pruebaResult.data;
  const orden = ordenResult.data;

  // Los nombres de compañía y contacto están guardados como strings
  // Necesitamos buscar sus IDs correspondientes
  // async-parallel - Fetch company and contact IDs in parallel
  const [companiaResult, contactoResult] = await Promise.all([
    prueba.prueba_compania
      ? supabase
          .from("companias")
          .select("compania_id, compania_nombre")
          .eq("compania_nombre", prueba.prueba_compania)
          .single()
      : Promise.resolve({ data: null, error: null }),
    prueba.prueba_contacto
      ? supabase
          .from("contactos")
          .select("contacto_id, contacto_nombre_completo")
          .eq("contacto_nombre_completo", prueba.prueba_contacto)
          .single()
      : Promise.resolve({ data: null, error: null }),
  ]);

  // Construir objeto con los datos
  const otData: OTData = {
    numeroOT: orden.orden_id,
    facturarA: prueba.prueba_compania || "",
    facturarAId: companiaResult.data?.compania_id?.toString() || "",
    contacto: prueba.prueba_contacto || "",
    contactoId: contactoResult.data?.contacto_id?.toString() || "",
    finca:
      (prueba.fincas as { finca_nombre?: string } | null)?.finca_nombre || "",
    fincaId: prueba.prueba_finca_id?.toString() || "",
    descuento: orden.orden_descuento || "0",
  };

  return otData;
}
