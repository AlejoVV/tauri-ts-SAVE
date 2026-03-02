// Servicio para obtener datos de pruebas asociadas a una orden de trabajo
import { supabase } from "../../nucleo/lib/supabaseClient";
import type { Tables } from "../../nucleo/lib/supabase";
import {
  obtenerObjetivoIdPorNombre,
  obtenerProductoIdPorNombre,
  obtenerEspecieIdPorNombre,
  obtenerFincaIdPorNombre,
} from "./registroService";

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
  facturarA: string; // Nombre de la compañía (para mostrar y usar como value)
  contacto: string; // Nombre del contacto (para mostrar y usar como value)
  finca: string; // Nombre de la finca (para mostrar y usar como value)
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

  // Construir objeto con los datos
  // Los comboboxes usan NOMBRES como values, no IDs
  const otData: OTData = {
    numeroOT: orden.orden_id,
    facturarA: prueba.prueba_compania || "",
    contacto: prueba.prueba_contacto || "",
    finca:
      (prueba.fincas as { finca_nombre?: string } | null)?.finca_nombre || "",
    descuento: orden.orden_descuento || "0",
  };

  return otData;
}

/**
 * Tipo para los datos completos de una prueba (desde pruebas_ordenes_trabajo)
 */
export type PruebaDatos = Tables<"pruebas_ordenes_trabajo">;

/**
 * Obtiene los datos completos de una prueba por su ID
 * Incluye campos como prueba_inst, prueba_notas_varias que no están en la vista
 */
export async function obtenerPruebaPorId(
  pruebaId: number
): Promise<PruebaDatos> {
  const { data, error } = await supabase
    .from("pruebas_ordenes_trabajo")
    .select("*")
    .eq("prueba_id", pruebaId)
    .single();

  if (error || !data) {
    console.error("Error al obtener prueba por ID:", error);
    throw new Error(`No se encontró la prueba #${pruebaId}`);
  }

  return data;
}

/**
 * Datos editables de una prueba existente
 */
export interface DatosActualizarPrueba {
  objetivo_nombre?: string | null;
  finca_nombre?: string | null;
  especie_nombre?: string | null;
  producto_nombre?: string | null;
  dosis_producto?: string | null;
  producto_unid?: string | null;
  cantidad?: string | null;
  observaciones?: string | null;
  notas_varias?: string | null;
  analisis_solicitado?: string | null;
  numero_muestra?: string | null;
  fecha_recibido?: string | null;
}

/**
 * Actualiza los datos editables de una prueba existente
 */
export async function actualizarPrueba(
  pruebaId: number,
  datos: DatosActualizarPrueba
): Promise<void> {
  // Resolver nombres a IDs en paralelo
  const [objetivoId, fincaId, especieId, productoId] = await Promise.all([
    datos.objetivo_nombre
      ? obtenerObjetivoIdPorNombre(datos.objetivo_nombre)
      : Promise.resolve(undefined),
    datos.finca_nombre
      ? obtenerFincaIdPorNombre(datos.finca_nombre)
      : Promise.resolve(undefined),
    datos.especie_nombre
      ? obtenerEspecieIdPorNombre(datos.especie_nombre)
      : Promise.resolve(undefined),
    datos.producto_nombre
      ? obtenerProductoIdPorNombre(datos.producto_nombre)
      : Promise.resolve(undefined),
  ]);

  // Construir objeto de actualización solo con campos definidos
  const updateData: Record<string, unknown> = {};

  if (objetivoId !== undefined) updateData.prueba_objetivo_id = objetivoId;
  if (fincaId !== undefined) updateData.prueba_finca_id = fincaId;
  if (especieId !== undefined) updateData.prueba_especie_id = especieId;
  if (productoId !== undefined) updateData.prueba_producto_id = productoId;
  if (datos.dosis_producto !== undefined)
    updateData.prueba_dosis_producto = datos.dosis_producto ?? "0";
  if (datos.producto_unid !== undefined)
    updateData.prueba_producto_unid = datos.producto_unid;
  if (datos.cantidad !== undefined) updateData.prueba_cantidad = datos.cantidad;
  if (datos.observaciones !== undefined)
    updateData.prueba_obs = datos.observaciones;
  if (datos.notas_varias !== undefined)
    updateData.prueba_notas_varias = datos.notas_varias;
  if (datos.analisis_solicitado !== undefined)
    updateData.prueba_inst = datos.analisis_solicitado;
  if (datos.numero_muestra !== undefined)
    updateData.prueba_numero_muestra = datos.numero_muestra;
  if (datos.fecha_recibido !== undefined)
    updateData.prueba_fecha_recibido = datos.fecha_recibido;

  const { error } = await supabase
    .from("pruebas_ordenes_trabajo")
    .update(updateData)
    .eq("prueba_id", pruebaId);

  if (error) {
    console.error("Error al actualizar prueba:", error);
    throw new Error(error.message || "Error al actualizar la prueba");
  }
}
