"use client"

import type React from "react"
import { useState } from "react"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { supabase } from "../../../nucleo/lib/supabaseClient"

interface SpeciesModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function SpeciesModal({ open, onOpenChange, onSuccess }: SpeciesModalProps) {
  const [nombre, setNombre] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { error: insertError } = await supabase
        .from("especie_vegetal")
        .insert({ especie_nombre: nombre })

      if (insertError) throw insertError

      setNombre("")
      onOpenChange(false)
      onSuccess?.()
    } catch (err) {
      console.error("Error al crear especie:", err)
      setError("Error al crear la especie. Intente nuevamente.")
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setNombre("")
    setError(null)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Crear Nueva Especie Vegetal</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-2 rounded">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="species-name">Nombre *</Label>
            <Input 
              id="species-name" 
              value={nombre} 
              onChange={(e) => setNombre(e.target.value)} 
              required 
              disabled={loading}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || !nombre.trim()}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Crear Especie
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
