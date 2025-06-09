// src/features/objetivos/hooks/useObjetivosConPrecios.ts

import { useState, useEffect, useCallback } from "react"
import { getObjetivosConPrecios, updateObjetivoConPrecios, createObjetivoConPrecios, type ObjetivoConPrecios } from "../services/objetivosService"

export function useObjetivosConPrecios() {
  const [objetivos, setObjetivos] = useState<ObjetivoConPrecios[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [saving, setSaving] = useState(false)
  const [creating, setCreating] = useState(false)

  const fetchObjetivos = useCallback(async () => {
    try {
      setLoading(true)
      const data = await getObjetivosConPrecios()
      setObjetivos(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Error desconocido al cargar objetivos con precios"))
      console.error("Error fetching objetivos con precios:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  const updateObjetivo = useCallback(async (objetivo: ObjetivoConPrecios) => {
    try {
      setSaving(true)
      await updateObjetivoConPrecios(objetivo)
      
      // Actualización optimista del estado
      setObjetivos(prev => 
        prev.map(item => 
          item.objetivo_id === objetivo.objetivo_id ? objetivo : item
        )
      )
      
      return true
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Error al actualizar objetivo"))
      console.error("Error updating objetivo:", err)
      return false
    } finally {
      setSaving(false)
    }
  }, [])
  // Nueva función para crear un objetivo
  const createObjetivo = useCallback(async (objetivo: Omit<ObjetivoConPrecios, 'objetivo_id'>) => {
    try {
      setCreating(true)
      const newObjetivo = await createObjetivoConPrecios(objetivo)
      
      // Actualización optimista del estado
      setObjetivos(prev => [newObjetivo, ...prev])
      
      return true
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Error al crear objetivo"))
      console.error("Error creating objetivo:", err)
      return false
    } finally {
      setCreating(false)
    }
  }, [])

  useEffect(() => {
    fetchObjetivos()
  }, [fetchObjetivos])

  return { 
    objetivos, 
    loading, 
    error, 
    saving,
    creating,
    updateObjetivo,
    createObjetivo,
    refreshObjetivos: fetchObjetivos
  }
}