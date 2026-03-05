// Servicio para obtener datos de las tablas para el formulario de registro
import { supabase } from "../../nucleo/lib/supabaseClient"
import type { Tables } from "../../nucleo/lib/supabase"

// Tipos para los datos del formulario
export type Compania = Tables<"companias">
export type Contacto = Tables<"vistacontactoscompanias">
export type Finca = Tables<"fincas">
export type Objetivo = Tables<"objetivos">
export type Producto = Tables<"productos">
export type EspecieVegetal = Tables<"especie_vegetal">

// Interfaces para los items de los comboboxes
export interface ComboboxItem {
  value: string
  label: string
  id: number
  unidades?: string // Para productos - valor de producto_unidades
  casaComercial?: string // Para productos - valor de producto_casa_comercial
  tipo?: string // Para productos - valor de producto_tipo
  tipoPrueba?: string // Para objetivos - valor de objetivo_tipo_prueba
}

/**
 * Obtiene el listado de compañías para el campo "Facturar a"
 */
export async function obtenerCompanias(): Promise<Compania[]> {
  const { data, error } = await supabase
    .from("companias")
    .select("*")
    .order("compania_nombre")

  if (error) {
    console.error("Error al obtener compañías:", error)
    throw error
  }

  return data || []
}

/**
 * Obtiene los contactos de una compañía específica usando la vista vistacontactoscompanias
 * @param nombreCompania - Nombre de la compañía para filtrar contactos
 */
export async function obtenerContactosPorCompania(nombreCompania: string): Promise<Contacto[]> {
  const { data, error } = await supabase
    .from("vistacontactoscompanias")
    .select("*")
    .eq("compania", nombreCompania)
    .order("nombre_completo")

  if (error) {
    console.error("Error al obtener contactos:", error)
    throw error
  }

  return data || []
}

/**
 * Obtiene el listado de fincas para el campo "Finca de la cepa"
 */
export async function obtenerFincas(): Promise<Finca[]> {
  const { data, error } = await supabase
    .from("fincas")
    .select("*")
    .order("finca_nombre")

  if (error) {
    console.error("Error al obtener fincas:", error)
    throw error
  }

  return data || []
}

/**
 * Obtiene el listado de objetivos para el campo "Objetivo"
 */
export async function obtenerObjetivos(): Promise<Objetivo[]> {
  const { data, error } = await supabase
    .from("objetivos")
    .select("objetivo_id, objetivo_nombre, objetivo_tipo_prueba")
    .order("objetivo_nombre")

  if (error) {
    console.error("Error al obtener objetivos:", error)
    throw error
  }

  return data || []
}

/**
 * Obtiene el listado completo de productos para el campo "Producto".
 * Supabase/PostgREST corta en 1000 filas por defecto; esta función
 * obtiene el conteo total y descarga todas las páginas en paralelo.
 *
 * async-parallel: Promise.all sobre todas las páginas concurrentemente.
 * js-combine-iterations: un solo bucle para construir el array final.
 */
export async function obtenerProductos(): Promise<Producto[]> {
  const PAGE_SIZE = 1000

  // 1. Obtener el total para calcular cuántas páginas necesitamos
  const { count, error: countError } = await supabase
    .from("productos")
    .select("*", { count: "exact", head: true })

  if (countError) {
    console.error("Error al obtener conteo de productos:", countError)
    throw countError
  }

  if (!count || count === 0) return []

  const pages = Math.ceil(count / PAGE_SIZE)

  // 2. async-parallel: descargar todas las páginas simultáneamente
  const results = await Promise.all(
    Array.from({ length: pages }, (_, i) =>
      supabase
        .from("productos")
        .select("*")
        .order("producto_nombre")
        .range(i * PAGE_SIZE, (i + 1) * PAGE_SIZE - 1)
    )
  )

  // 3. js-combine-iterations: construir resultado en un solo paso
  const allData: Producto[] = []
  for (const { data, error } of results) {
    if (error) {
      console.error("Error al obtener página de productos:", error)
      throw error
    }
    if (data) allData.push(...data)
  }

  return allData
}

/**
 * Busca productos por nombre con paginación
 * Optimizado para manejar grandes cantidades de productos (1500+)
 * @param searchQuery - Término de búsqueda
 * @param limit - Número máximo de resultados (default: 100)
 */
export async function buscarProductos(
  searchQuery: string,
  limit: number = 100
): Promise<Producto[]> {
  // Si no hay búsqueda, devolver los primeros N productos
  if (!searchQuery.trim()) {
    const { data, error } = await supabase
      .from("productos")
      .select("producto_id, producto_nombre, producto_unidades, producto_casa_comercial, producto_tipo")
      .order("producto_nombre")
      .limit(limit)

    if (error) {
      console.error("Error al buscar productos:", error)
      throw error
    }

    return data || []
  }

  // Buscar productos que coincidan con el término de búsqueda
  // Usando ilike para búsqueda case-insensitive
  const { data, error } = await supabase
    .from("productos")
    .select("producto_id, producto_nombre, producto_unidades, producto_casa_comercial, producto_tipo")
    .ilike("producto_nombre", `%${searchQuery}%`)
    .order("producto_nombre")
    .limit(limit)

  if (error) {
    console.error("Error al buscar productos:", error)
    throw error
  }

  return data || []
}

/**
 * Obtiene un producto específico por su nombre
 * Útil para mantener el producto seleccionado cuando se carga el formulario
 */
export async function obtenerProductoPorNombre(
  nombreProducto: string
): Promise<Producto | null> {
  const { data, error } = await supabase
    .from("productos")
    .select("producto_id, producto_nombre, producto_unidades, producto_casa_comercial, producto_tipo")
    .eq("producto_nombre", nombreProducto)
    .single()

  if (error) {
    console.error("Error al obtener producto:", error)
    return null
  }

  return data
}

/**
 * Obtiene el listado de especies vegetales para el campo "Especie vegetal"
 */
export async function obtenerEspeciesVegetales(): Promise<EspecieVegetal[]> {
  const { data, error } = await supabase
    .from("especie_vegetal")
    .select("*")
    .order("especie_nombre")

  if (error) {
    console.error("Error al obtener especies vegetales:", error)
    throw error
  }

  return data || []
}

// Funciones helper para convertir datos a formato de combobox

export function companiasACombobox(companias: Compania[]): ComboboxItem[] {
  return companias.map((c) => ({
    value: c.compania_nombre,
    label: c.compania_nombre,
    id: c.compania_id,
  }))
}

export function contactosACombobox(contactos: Contacto[]): ComboboxItem[] {
  return contactos.map((c) => ({
    value: c.nombre_completo || "",
    label: c.nombre_completo || "Sin nombre",
    id: 0, // La vista no tiene ID, usamos el nombre como identificador
  }))
}

export function fincasACombobox(fincas: Finca[]): ComboboxItem[] {
  return fincas.map((f) => ({
    value: f.finca_nombre,
    label: f.finca_nombre,
    id: f.finca_id,
  }))
}

export function objetivosACombobox(objetivos: Objetivo[]): ComboboxItem[] {
  return objetivos.map((o) => ({
    value: o.objetivo_nombre,
    label: o.objetivo_nombre,
    id: o.objetivo_id,
    tipoPrueba: o.objetivo_tipo_prueba || undefined,
  }))
}

export function productosACombobox(productos: Producto[]): ComboboxItem[] {
  return productos.map((p) => ({
    value: p.producto_nombre,
    label: p.producto_nombre,
    id: p.producto_id,
    unidades: p.producto_unidades || "",
    casaComercial: p.producto_casa_comercial || undefined,
    tipo: p.producto_tipo || undefined,
  }))
}

export function especiesACombobox(especies: EspecieVegetal[]): ComboboxItem[] {
  return especies.map((e) => ({
    value: e.especie_nombre,
    label: e.especie_nombre,
    id: e.especie_id,
  }))
}
