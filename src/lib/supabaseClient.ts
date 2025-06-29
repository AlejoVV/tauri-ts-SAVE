import { createClient } from "@supabase/supabase-js"
import type { Database } from "./supabase"

// Estas variables deberían estar en un archivo .env
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Faltan las variables de entorno de Supabase")
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)