// src/features/objetivos/hooks/useObjetivosConPrecios.ts

import { useState, useEffect } from "react"
import { getObjetivosConPrecios, type ObjetivoConPrecios } from "../services/objetivosService"

export function useObjetivosConPrecios() {
  const [objetivos, setObjetivos] = useState<ObjetivoConPrecios[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const fetchData = async () => {
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
    }

    fetchData()
  }, [])

  return { objetivos, loading, error }
}