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
    .select("*")
    .order("objetivo_nombre")

  if (error) {
    console.error("Error al obtener objetivos:", error)
    throw error
  }

  return data || []
}

/**
 * Obtiene el listado de productos para el campo "Producto"
 */
export async function obtenerProductos(): Promise<Producto[]> {
  const { data, error } = await supabase
    .from("productos")
    .select("*")
    .order("producto_nombre")

  if (error) {
    console.error("Error al obtener productos:", error)
    throw error
  }

  return data || []
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
      .select("*")
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
    .select("*")
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
    .select("*")
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
  }))
}

export function productosACombobox(productos: Producto[]): ComboboxItem[] {
  return productos.map((p) => ({
    value: p.producto_nombre,
    label: p.producto_nombre,
    id: p.producto_id,
    unidades: p.producto_unidades || "cc/lt", // Valor por defecto si no hay unidades
  }))
}

export function especiesACombobox(especies: EspecieVegetal[]): ComboboxItem[] {
  return especies.map((e) => ({
    value: e.especie_nombre,
    label: e.especie_nombre,
    id: e.especie_id,
  }))
}
