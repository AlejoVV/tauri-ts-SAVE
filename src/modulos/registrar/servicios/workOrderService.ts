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

export interface DatosOT {
  numeroOT: number;
  // Strings planos, no FKs — se usan como values en los selects del formulario
  facturarA: string;
  contacto: string;
  finca: string;
  descuento: string;
  estadoOT: string | null;
  estadoFactura: string | null;
  numeroFactura: number | null;
}

export async function buscarOTPorNumero(numeroOT: number): Promise<DatosOT> {
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
    console.error("Error al buscar OT:", ordenResult.error);
    throw new Error(
      `No se encontró la OT #${numeroOT}. Verifique el número e intente nuevamente.`
    );
  }

  if (pruebaResult.error || !pruebaResult.data) {
    console.error("Error al obtener pruebas de OT:", pruebaResult.error);
    throw new Error(
      `La OT #${numeroOT} no tiene pruebas registradas. No se pueden obtener datos de facturación.`
    );
  }

  const prueba = pruebaResult.data;
  const orden = ordenResult.data;

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
  objetivoNombre?: string | null;
  fincaNombre?: string | null;
  especieNombre?: string | null;
  productoNombre?: string | null;
  dosisProducto?: string | null;
  productoUnid?: string | null;
  cantidad?: string | null;
  observaciones?: string | null;
  notasVarias?: string | null;
  analisisSolicitado?: string | null;
  numeroMuestra?: string | null;
  fechaRecibido?: string | null;
}

export async function actualizarPrueba(
  pruebaId: number,
  datos: DatosActualizarPrueba
): Promise<{ success: boolean; error?: string }> {
  try {
    const [objetivoId, fincaId, especieId, productoId] = await Promise.all([
      datos.objetivoNombre
        ? obtenerObjetivoIdPorNombre(datos.objetivoNombre)
        : Promise.resolve(undefined),
      datos.fincaNombre
        ? obtenerFincaIdPorNombre(datos.fincaNombre)
        : Promise.resolve(undefined),
      datos.especieNombre
        ? obtenerEspecieIdPorNombre(datos.especieNombre)
        : Promise.resolve(undefined),
      datos.productoNombre
        ? obtenerProductoIdPorNombre(datos.productoNombre)
        : Promise.resolve(undefined),
    ]);

    const updateData: Record<string, unknown> = {};

    if (objetivoId !== undefined) updateData.prueba_objetivo_id = objetivoId;
    if (fincaId !== undefined) updateData.prueba_finca_id = fincaId;
    if (especieId !== undefined) updateData.prueba_especie_id = especieId;
    if (productoId !== undefined) updateData.prueba_producto_id = productoId;
    if (datos.dosisProducto !== undefined)
      updateData.prueba_dosis_producto = datos.dosisProducto ?? "0";
    if (datos.productoUnid !== undefined)
      updateData.prueba_producto_unid = datos.productoUnid;
    if (datos.cantidad !== undefined) updateData.prueba_cantidad = datos.cantidad;
    if (datos.observaciones !== undefined)
      updateData.prueba_obs = datos.observaciones;
    if (datos.notasVarias !== undefined)
      updateData.prueba_notas_varias = datos.notasVarias;
    if (datos.analisisSolicitado !== undefined)
      updateData.prueba_inst = datos.analisisSolicitado;
    if (datos.numeroMuestra !== undefined)
      updateData.prueba_numero_muestra = datos.numeroMuestra;
    if (datos.fechaRecibido !== undefined)
      updateData.prueba_fecha_recibido = datos.fechaRecibido;

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

export async function eliminarPrueba(pruebaId: number): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from("pruebas_ordenes_trabajo")
      .delete()
      .eq("prueba_id", pruebaId);

    if (error) {
      console.error("Error al eliminar prueba:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("Error al eliminar prueba:", error);
    return { success: false, error: error instanceof Error ? error.message : "Error desconocido" };
  }
}

