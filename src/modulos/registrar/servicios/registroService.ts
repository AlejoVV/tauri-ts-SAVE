// Servicio para manejar el registro de órdenes de trabajo y pruebas
import { supabase } from "../../nucleo/lib/supabaseClient";

// Interface para los datos de registro de prueba
export interface DatosRegistroPrueba {
  // IDs
  prueba_orden_id: number;
  prueba_id: number;

  // Datos de la orden
  orden_descuento?: string | null;

  // Nombres de entidades (se convierten a IDs)
  objetivo_nombre: string;
  producto_nombre?: string | null;
  especie_nombre?: string | null;
  finca_nombre?: string | null;

  // Datos de la prueba
  dosis_producto?: string | null;
  producto_unid?: string | null;
  cantidad?: string | null;
  observaciones?: string | null;
  notas_varias?: string | null;
  fecha_recibido?: string | null;
  compania_nombre: string;
  contacto_nombre?: string | null;
  estado_lab?: string | null;
  numero_muestra?: string | null;
  inst?: string | null;
}

/**
 * Obtiene el siguiente número de orden de trabajo disponible
 * async-defer-await - Defer await to where result is used
 */
export async function obtenerSiguienteOrdenId(): Promise<number> {
  const { data, error } = await supabase
    .from("ordenes_trabajo")
    .select("orden_id")
    .order("orden_id", { ascending: false })
    .limit(1)
    .single();

  if (error) {
    // Si no hay órdenes, empezar desde 1
    if (error.code === "PGRST116") {
      return 1;
    }
    console.error("Error al obtener siguiente orden_id:", error);
    throw error;
  }

  return (data?.orden_id || 0) + 1;
}

/**
 * Obtiene el siguiente número de prueba disponible
 * async-defer-await - Defer await to where result is used
 */
export async function obtenerSiguientePruebaId(): Promise<number> {
  const { data, error } = await supabase
    .from("pruebas_ordenes_trabajo")
    .select("prueba_id")
    .order("prueba_id", { ascending: false })
    .limit(1)
    .single();

  if (error) {
    // Si no hay pruebas, empezar desde 1
    if (error.code === "PGRST116") {
      return 1;
    }
    console.error("Error al obtener siguiente prueba_id:", error);
    throw error;
  }

  return (data?.prueba_id || 0) + 1;
}

/**
 * Obtiene los próximos IDs de orden y prueba en paralelo
 * async-parallel - Use Promise.all() for independent operations
 */
export async function obtenerProximosIds(): Promise<{
  siguienteOrdenId: number;
  siguientePruebaId: number;
}> {
  const [siguienteOrdenId, siguientePruebaId] = await Promise.all([
    obtenerSiguienteOrdenId(),
    obtenerSiguientePruebaId(),
  ]);

  return { siguienteOrdenId, siguientePruebaId };
}

/**
 * Obtiene el ID de un objetivo por su nombre
 */
export async function obtenerObjetivoIdPorNombre(
  nombre: string
): Promise<number | null> {
  const { data, error } = await supabase
    .from("objetivos")
    .select("objetivo_id")
    .eq("objetivo_nombre", nombre)
    .single();

  if (error || !data) {
    console.error("Error al obtener objetivo_id:", error);
    return null;
  }

  return data.objetivo_id;
}

/**
 * Obtiene el ID de un producto por su nombre
 */
export async function obtenerProductoIdPorNombre(
  nombre: string
): Promise<number | null> {
  if (!nombre) return null;

  const { data, error } = await supabase
    .from("productos")
    .select("producto_id")
    .eq("producto_nombre", nombre)
    .single();

  if (error || !data) {
    console.error("Error al obtener producto_id:", error);
    return null;
  }

  return data.producto_id;
}

/**
 * Obtiene el ID de una especie vegetal por su nombre
 */
export async function obtenerEspecieIdPorNombre(
  nombre: string
): Promise<number | null> {
  if (!nombre) return null;

  const { data, error } = await supabase
    .from("especie_vegetal")
    .select("especie_id")
    .eq("especie_nombre", nombre)
    .single();

  if (error || !data) {
    console.error("Error al obtener especie_id:", error);
    return null;
  }

  return data.especie_id;
}

/**
 * Obtiene el ID de una finca por su nombre
 */
export async function obtenerFincaIdPorNombre(
  nombre: string
): Promise<number | null> {
  if (!nombre) return null;

  const { data, error } = await supabase
    .from("fincas")
    .select("finca_id")
    .eq("finca_nombre", nombre)
    .single();

  if (error || !data) {
    console.error("Error al obtener finca_id:", error);
    return null;
  }

  return data.finca_id;
}

/**
 * Registra una prueba usando la función de base de datos insertar_prueba_por_ids
 * Esta función maneja automáticamente:
 * - Crear la orden si no existe
 * - Validar que los IDs de entidades existan
 * - Insertar la prueba
 * 
 * @param datos - Datos completos de la prueba (usa nombres que se convierten a IDs)
 * @returns Promise con el resultado de la operación y el siguiente prueba_id
 */
export async function registrarPrueba(
  datos: DatosRegistroPrueba
): Promise<{ ordenId: number; pruebaId: number; siguientePruebaId: number }> {
  try {
    // Obtener IDs de las entidades en paralelo
    // async-parallel - Fetch IDs in parallel
    const [objetivoId, productoId, especieId, fincaId] = await Promise.all([
      obtenerObjetivoIdPorNombre(datos.objetivo_nombre),
      datos.producto_nombre
        ? obtenerProductoIdPorNombre(datos.producto_nombre)
        : Promise.resolve(null),
      datos.especie_nombre
        ? obtenerEspecieIdPorNombre(datos.especie_nombre)
        : Promise.resolve(null),
      datos.finca_nombre
        ? obtenerFincaIdPorNombre(datos.finca_nombre)
        : Promise.resolve(null),
    ]);

    // Validar que se encontró el objetivo (obligatorio)
    if (!objetivoId) {
      throw new Error(
        `No se encontró el objetivo: ${datos.objetivo_nombre}`
      );
    }

    // Llamar a la función RPC de Supabase
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.rpc as any)(
      "insertar_prueba_por_ids",
      {
        p_prueba_orden_id: datos.prueba_orden_id,
        p_orden_descuento: parseFloat(datos.orden_descuento || "0"),
        p_prueba_id: datos.prueba_id,
        p_prueba_objetivo_id: objetivoId,
        p_prueba_producto_id: productoId,
        p_prueba_dosis_producto: datos.dosis_producto || null,
        p_prueba_producto_unid: datos.producto_unid || null,
        p_prueba_especie_id: especieId,
        p_prueba_cantidad: parseFloat(datos.cantidad || "1"),
        p_prueba_finca_id: fincaId,
        p_prueba_obs: datos.observaciones || null,
        p_prueba_notas_varias: datos.notas_varias || null,
        p_prueba_fecha_recibido: datos.fecha_recibido || null,
        p_prueba_compania_nombre: datos.compania_nombre,
        p_prueba_contacto_nombre: datos.contacto_nombre || null,
        p_prueba_estado_lab: datos.estado_lab || "Pendiente",
        p_prueba_numero_muestra: datos.numero_muestra || null,
        p_prueba_inst: datos.inst || null,
      }
    );

    if (error) {
      console.error("Error al registrar prueba:", error);
      throw new Error(error.message || "Error al registrar la prueba");
    }

    // Después de insertar, obtener el siguiente prueba_id de la BD
    const siguientePruebaId = await obtenerSiguientePruebaId();

    return {
      ordenId: datos.prueba_orden_id,
      pruebaId: datos.prueba_id,
      siguientePruebaId, // Retornar el siguiente ID consultado de la BD
    };
  } catch (error) {
    console.error("Error en registrarPrueba:", error);
    throw error;
  }
}
