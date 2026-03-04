"use client"

import type React from "react"
import { useState } from "react"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { supabase } from "../../../nucleo/lib/supabaseClient"

interface ContactModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  compania?: string
  onSuccess?: (nombreCompleto: string) => void
}

const INITIAL_FORM = {
  nombres: "",
  apellidos: "",
  celular: "",
  email: "",
  profesion: "",
  cargo: "",
  genero: "",
}

export function ContactModal({ open, onOpenChange, compania, onSuccess }: ContactModalProps) {
  const [formData, setFormData] = useState(INITIAL_FORM)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Early-exit validations
    if (!formData.nombres.trim()) {
      setError("El nombre del contacto es obligatorio.")
      return
    }
    if (!compania) {
      setError("Debe seleccionar una compañía antes de crear un contacto.")
      return
    }

    setLoading(true)
    setError(null)

    // Tracks the newly created contacto_id for rollback if a later step fails
    let contactoId: number | null = null

    try {
      // Step 1 — create the contact record
      const { data: contactoCreado, error: contactoError } = await supabase
        .from("contactos")
        .insert({
          contacto_nombres: formData.nombres.trim(),
          contacto_apellidos: formData.apellidos.trim() || null,
          contacto_nombre_completo: `${formData.nombres} ${formData.apellidos}`.trim(),
          contacto_celular_principal: formData.celular.trim() || null,
          contacto_email: formData.email.trim() || null,
          contacto_profesion: formData.profesion.trim() || null,
          contacto_cargo: formData.cargo.trim() || null,
          contacto_genero: formData.genero || null,
        })
        .select("contacto_id")
        .single()

      if (contactoError) {
        throw new Error(
          contactoError.code === "23505"
            ? "Ya existe un contacto con estos datos en el sistema."
            : "Error al crear el contacto. Intente nuevamente."
        )
      }

      contactoId = contactoCreado.contacto_id

      // Step 2 — resolve company ID
      const { data: companiaData, error: companiaLookupError } = await supabase
        .from("companias")
        .select("compania_id")
        .eq("compania_nombre", compania)
        .single()

      if (companiaLookupError || !companiaData) {
        throw new Error(
          `No se encontró la compañía "${compania}". Recargue la página y vuelva a intentar.`
        )
      }

      // Step 3 — create the contact–company relationship
      const { error: relacionError } = await supabase
        .from("contacto_compania")
        .insert({
          contacto_id: contactoId,
          compania_id: companiaData.compania_id,
        })

      if (relacionError) {
        throw new Error(
          relacionError.code === "23505"
            ? "Este contacto ya está vinculado a esta compañía."
            : "Error al vincular el contacto con la compañía."
        )
      }

      // All steps succeeded — close and refresh
      const nombreCompleto = `${formData.nombres} ${formData.apellidos}`.trim()
      resetForm()
      onOpenChange(false)
      onSuccess?.(nombreCompleto)
    } catch (err) {
      // Best-effort rollback: remove orphan contact if the error occurred after step 1
      if (contactoId !== null) {
        supabase
          .from("contactos")
          .delete()
          .eq("contacto_id", contactoId)
          .then(({ error: deleteError }) => {
            if (deleteError) {
              console.error("Error al revertir el contacto creado:", deleteError)
            }
          })
      }

      const message =
        err instanceof Error
          ? err.message
          : "Error inesperado al crear el contacto. Intente nuevamente."
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData(INITIAL_FORM)
    setError(null)
  }

  const handleClose = () => {
    if (loading) return
    resetForm()
    onOpenChange(false)
  }

  const canSubmit = !loading && !!formData.nombres.trim() && !!compania

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Crear Nuevo Contacto</DialogTitle>
          {compania ? (
            <p className="text-sm text-muted-foreground">
              Para la compañía: <strong>{compania}</strong>
            </p>
          ) : (
            <p className="text-sm text-amber-600">
              Seleccione una compañía en el formulario antes de crear un contacto.
            </p>
          )}
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-2 rounded">
              {error}
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contact-nombres">Nombres *</Label>
              <Input
                id="contact-nombres"
                value={formData.nombres}
                onChange={(e) => setFormData({ ...formData, nombres: e.target.value })}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact-apellidos">Apellidos</Label>
              <Input
                id="contact-apellidos"
                value={formData.apellidos}
                onChange={(e) => setFormData({ ...formData, apellidos: e.target.value })}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact-phone">Celular</Label>
              <Input
                id="contact-phone"
                value={formData.celular}
                onChange={(e) => setFormData({ ...formData, celular: e.target.value })}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact-email">Email</Label>
              <Input
                id="contact-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                disabled={loading}
              />
            </div>
            <div className="col-span-2 grid grid-cols-3 gap-4">
              <div className="col-span-2 space-y-2">
                <Label htmlFor="contact-profession">Profesión</Label>
                <Input
                  id="contact-profession"
                  value={formData.profesion}
                  onChange={(e) => setFormData({ ...formData, profesion: e.target.value })}
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label>Género</Label>
                <Select
                  value={formData.genero}
                  onValueChange={(value) => setFormData({ ...formData, genero: value })}
                  disabled={loading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Género" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="F">Femenino</SelectItem>
                    <SelectItem value="M">Masculino</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2 col-span-2">
              <Label htmlFor="contact-position">Cargo</Label>
              <Input
                id="contact-position"
                value={formData.cargo}
                onChange={(e) => setFormData({ ...formData, cargo: e.target.value })}
                disabled={loading}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={!canSubmit}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Crear Contacto
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
