import { supabase } from "@/modulos/nucleo/lib/supabaseClient";
import type { Tables } from "@/modulos/nucleo/lib/supabase";
import {
  obtenerObjetivoIdPorNombre,
  obtenerProductoIdPorNombre,
  obtenerEspecieIdPorNombre,
  obtenerFincaIdPorNombre,
} from "@/modulos/registrar/servicios/registroService";

export type VistaMaestraRow = Tables<"vistamaestratotal">;

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

export interface OTData {
  numeroOT: number;
  facturarA: string; // Nombre de la compañía (para mostrar y usar como value)
  contacto: string; // Nombre del contacto (para mostrar y usar como value)
  finca: string; // Nombre de la finca (para mostrar y usar como value)
  descuento: string;
  estadoOT: string | null;
  estadoFactura: string | null;
  numeroFactura: number | null;
}

export async function buscarOTPorNumero(numeroOT: number): Promise<OTData> {
  // async-parallel - Fetch order and first test data in parallel
  const [ordenResult, pruebaResult] = await Promise.all([
    supabase
      .from("ordenes_trabajo")
      .select("orden_id, orden_descuento, orden_estado_ot, orden_numero_factura")
      .eq("orden_id", numeroOT)
      .single(),
    supabase
      .from("pruebas_ordenes_trabajo")
      .select(
        `
        prueba_compania,
        prueba_contacto,
        prueba_finca_id,
        prueba_estado_facturacion,
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

  if (ordenResult.error || !ordenResult.data) {
    throw new Error(
      `No se encontró la OT #${numeroOT}. Verifique el número e intente nuevamente.`
    );
  }

  if (pruebaResult.error || !pruebaResult.data) {
    throw new Error(
      `La OT #${numeroOT} no tiene pruebas registradas. No se pueden obtener datos de facturación.`
    );
  }

  const prueba = pruebaResult.data;
  const orden = ordenResult.data;

  // Los comboboxes usan NOMBRES como values, no IDs
  return {
    numeroOT: orden.orden_id,
    facturarA: prueba.prueba_compania || "",
    contacto: prueba.prueba_contacto || "",
    finca:
      (prueba.fincas as { finca_nombre?: string } | null)?.finca_nombre || "",
    descuento: orden.orden_descuento || "0",
    estadoOT: orden.orden_estado_ot ?? null,
    estadoFactura: prueba.prueba_estado_facturacion ?? null,
    numeroFactura: orden.orden_numero_factura ?? null,
  };
}

export type PruebaDatos = Tables<"pruebas_ordenes_trabajo">;

// Incluye prueba_inst y prueba_notas_varias que no están expuestos en la vista
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

export async function actualizarPrueba(
  pruebaId: number,
  datos: DatosActualizarPrueba
): Promise<{ success: boolean; error?: string }> {
  try {
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
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("Error al actualizar prueba:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

export type EstadoLab =
  | "Esperando Aprobación"
  | "Aprobado FV"
  | "En Curso"
  | "Anulado";

export const ESTADOS_LAB: EstadoLab[] = [
  "Esperando Aprobación",
  "Aprobado FV",
  "En Curso",
  "Anulado",
];

export async function actualizarFechaEntregaInformeMasivo(
  pruebaIds: number[],
  fecha: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from("pruebas_ordenes_trabajo")
      .update({ prueba_fecha_entrega_informe: fecha })
      .in("prueba_id", pruebaIds);

    if (error) {
      console.error("Error al actualizar fecha entrega informe:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("Error al actualizar fecha entrega informe masivo:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

export async function actualizarNumeroFactura(
  otId: number,
  numeroFactura: number | null
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from("ordenes_trabajo")
      .update({ orden_numero_factura: numeroFactura })
      .eq("orden_id", otId);

    if (error) {
      console.error("Error al actualizar número de factura:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("Error al actualizar número de factura:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

export async function actualizarEstadoOT(
  otId: number,
  estadoOT: "Cerrada" | null
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from("ordenes_trabajo")
      .update({ orden_estado_ot: estadoOT })
      .eq("orden_id", otId);

    if (error) {
      console.error("Error al actualizar estado OT:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("Error al actualizar estado OT:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

export async function actualizarEstadoLabMasivo(
  pruebaIds: number[],
  estadoLab: EstadoLab
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from("pruebas_ordenes_trabajo")
      .update({ prueba_estado_lab: estadoLab })
      .in("prueba_id", pruebaIds);

    if (error) {
      console.error("Error al actualizar estado lab:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("Error al actualizar estado lab masivo:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

/**
 * Elimina una prueba de la orden de trabajo por su ID
 */
export async function eliminarPrueba(pruebaId: number): Promise<void> {
  const { error } = await supabase
    .from("pruebas_ordenes_trabajo")
    .delete()
    .eq("prueba_id", pruebaId);

  if (error) {
    console.error("Error al eliminar prueba:", error);
    throw new Error(error.message || "Error al eliminar la prueba");
  }
}
