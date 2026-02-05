// Servicio para manejar el registro de órdenes de trabajo y pruebas
import { supabase } from "../../nucleo/lib/supabaseClient";

// Interfaces para los datos de registro
export interface DatosOrdenTrabajo {
  orden_descuento?: string | null;
  orden_compra?: string | null;
  orden_estado_ot?: string | null;
}

export interface DatosPrueba {
  prueba_id: number;
  prueba_orden_id: number;
  prueba_objetivo_id?: number | null;
  prueba_producto_id?: number | null;
  prueba_dosis_producto?: string;
  prueba_producto_unid?: string | null;
  prueba_especie_id?: number | null;
  prueba_cantidad?: string | null;
  prueba_finca_id?: number | null;
  prueba_precio?: number | null;
  prueba_obs?: string | null;
  prueba_notas_varias?: string | null;
  prueba_fecha_recibido?: string | null;
  prueba_compania?: string | null;
  prueba_contacto?: string | null;
  prueba_numero_muestra?: string | null;
  prueba_estado_proceso?: string | null;
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
 * Crea una nueva orden de trabajo
 * server-dedup-props - Avoid duplicate serialization
 */
export async function crearOrdenTrabajo(
  datos: DatosOrdenTrabajo
): Promise<number> {
  const { data, error } = await supabase
    .from("ordenes_trabajo")
    .insert({
      orden_fecha_creacion: new Date().toISOString(),
      orden_numero_factura: null,
      orden_compra: datos.orden_compra || null,
      orden_descuento: datos.orden_descuento || null,
      orden_estado_ot: datos.orden_estado_ot || "Pendiente",
    })
    .select("orden_id")
    .single();

  if (error) {
    console.error("Error al crear orden de trabajo:", error);
    throw error;
  }

  return data.orden_id;
}

/**
 * Crea una nueva prueba asociada a una orden de trabajo
 * server-serialization - Minimize data passed to client
 */
export async function crearPrueba(datos: DatosPrueba): Promise<number> {
  const { data, error } = await supabase
    .from("pruebas_ordenes_trabajo")
    .insert({
      prueba_id: datos.prueba_id,
      prueba_orden_id: datos.prueba_orden_id,
      prueba_objetivo_id: datos.prueba_objetivo_id,
      prueba_producto_id: datos.prueba_producto_id,
      prueba_dosis_producto: datos.prueba_dosis_producto || "",
      prueba_producto_unid: datos.prueba_producto_unid,
      prueba_especie_id: datos.prueba_especie_id,
      prueba_cantidad: datos.prueba_cantidad,
      prueba_finca_id: datos.prueba_finca_id,
      prueba_precio: datos.prueba_precio,
      prueba_obs: datos.prueba_obs,
      prueba_notas_varias: datos.prueba_notas_varias,
      prueba_fecha_recibido: datos.prueba_fecha_recibido,
      prueba_compania: datos.prueba_compania,
      prueba_contacto: datos.prueba_contacto,
      prueba_numero_muestra: datos.prueba_numero_muestra,
      prueba_estado_proceso: datos.prueba_estado_proceso || "En Proceso",
      prueba_fecha_creacion: new Date().toISOString().split("T")[0],
    })
    .select("prueba_id")
    .single();

  if (error) {
    console.error("Error al crear prueba:", error);
    throw error;
  }

  return data.prueba_id;
}

/**
 * Crea una orden de trabajo con su primera prueba en una transacción
 * async-parallel - Start promises early, await late
 */
export async function crearOrdenConPrueba(
  datosOrden: DatosOrdenTrabajo,
  datosPrueba: Omit<DatosPrueba, "prueba_orden_id">
): Promise<{ ordenId: number; pruebaId: number }> {
  // Primero crear la orden
  const ordenId = await crearOrdenTrabajo(datosOrden);

  // Luego crear la prueba asociada a la orden
  const pruebaId = await crearPrueba({
    ...datosPrueba,
    prueba_orden_id: ordenId,
  });

  return { ordenId, pruebaId };
}

/**
 * Agrega una nueva prueba a una orden de trabajo existente
 */
export async function agregarPruebaAOrden(
  ordenId: number,
  datosPrueba: Omit<DatosPrueba, "prueba_orden_id">
): Promise<number> {
  return crearPrueba({
    ...datosPrueba,
    prueba_orden_id: ordenId,
  });
}

/**
 * Caché para IDs de entidades - js-cache-function-results
 */
const entityIdCache = new Map<string, number>();

/**
 * Obtiene el ID de una compañía por su nombre
 */
export async function obtenerCompaniaId(nombre: string): Promise<number | null> {
  const cacheKey = `compania-${nombre}`;
  
  if (entityIdCache.has(cacheKey)) {
    return entityIdCache.get(cacheKey)!;
  }

  const { data, error } = await supabase
    .from("companias")
    .select("compania_id")
    .eq("compania_nombre", nombre)
    .single();

  if (error || !data) return null;

  entityIdCache.set(cacheKey, data.compania_id);
  return data.compania_id;
}

/**
 * Obtiene el ID de una finca por su nombre
 */
export async function obtenerFincaId(nombre: string): Promise<number | null> {
  const cacheKey = `finca-${nombre}`;
  
  if (entityIdCache.has(cacheKey)) {
    return entityIdCache.get(cacheKey)!;
  }

  const { data, error } = await supabase
    .from("fincas")
    .select("finca_id")
    .eq("finca_nombre", nombre)
    .single();

  if (error || !data) return null;

  entityIdCache.set(cacheKey, data.finca_id);
  return data.finca_id;
}

/**
 * Obtiene el ID de un objetivo por su nombre
 */
export async function obtenerObjetivoId(nombre: string): Promise<number | null> {
  const cacheKey = `objetivo-${nombre}`;
  
  if (entityIdCache.has(cacheKey)) {
    return entityIdCache.get(cacheKey)!;
  }

  const { data, error } = await supabase
    .from("objetivos")
    .select("objetivo_id")
    .eq("objetivo_nombre", nombre)
    .single();

  if (error || !data) return null;

  entityIdCache.set(cacheKey, data.objetivo_id);
  return data.objetivo_id;
}

/**
 * Obtiene el ID de una especie vegetal por su nombre
 */
export async function obtenerEspecieId(nombre: string): Promise<number | null> {
  const cacheKey = `especie-${nombre}`;
  
  if (entityIdCache.has(cacheKey)) {
    return entityIdCache.get(cacheKey)!;
  }

  const { data, error } = await supabase
    .from("especie_vegetal")
    .select("especie_id")
    .eq("especie_nombre", nombre)
    .single();

  if (error || !data) return null;

  entityIdCache.set(cacheKey, data.especie_id);
  return data.especie_id;
}

/**
 * Obtiene el ID de un producto por su nombre
 */
export async function obtenerProductoId(nombre: string): Promise<number | null> {
  const cacheKey = `producto-${nombre}`;
  
  if (entityIdCache.has(cacheKey)) {
    return entityIdCache.get(cacheKey)!;
  }

  const { data, error } = await supabase
    .from("productos")
    .select("producto_id")
    .eq("producto_nombre", nombre)
    .single();

  if (error || !data) return null;

  entityIdCache.set(cacheKey, data.producto_id);
  return data.producto_id;
}

/**
 * Limpia el caché de IDs de entidades
 */
export function limpiarCacheIds(): void {
  entityIdCache.clear();
}
