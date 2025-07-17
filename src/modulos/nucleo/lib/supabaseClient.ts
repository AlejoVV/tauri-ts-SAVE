import { createClient } from "@supabase/supabase-js"
import type { Database } from "./supabase"

// Función para obtener configuración según el entorno
export const getSupabaseConfig = (environment: 'production' | 'test' = 'production') => {
  if (environment === 'test') {
    return {
      url: import.meta.env.VITE_SUPABASE_TEST_URL,
      key: import.meta.env.VITE_SUPABASE_TEST_ANON_KEY
    }
  }
  
  return {
    url: import.meta.env.VITE_SUPABASE_URL,
    key: import.meta.env.VITE_SUPABASE_ANON_KEY
  }
}

// Determinar qué base de datos usar como principal
const testConfig = getSupabaseConfig('test')
const prodConfig = getSupabaseConfig('production')

// Si existe configuración de prueba, usarla como principal
// Si no, usar la configuración de producción
const mainConfig = (testConfig.url && testConfig.key) ? testConfig : prodConfig

if (!mainConfig.url || !mainConfig.key) {
  throw new Error("Faltan las variables de entorno de Supabase")
}

// Cliente principal (ahora apunta a prueba si está configurada)
export const supabase = createClient<Database>(mainConfig.url, mainConfig.key)

// Cliente específico para pruebas (mismo que el principal si se usa config de prueba)
export const supabaseTest = testConfig.url && testConfig.key 
  ? createClient<Database>(testConfig.url, testConfig.key)
  : null

// Cliente específico para producción
export const supabaseProduction = createClient<Database>(prodConfig.url, prodConfig.key)