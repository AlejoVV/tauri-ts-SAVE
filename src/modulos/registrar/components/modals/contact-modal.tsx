"use client"

import type React from "react"
import { useState, useEffect } from "react"
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
  onSuccess?: () => void
}

export function ContactModal({ open, onOpenChange, compania, onSuccess }: ContactModalProps) {
  const [formData, setFormData] = useState({
    nombres: "",
    apellidos: "",
    celular: "",
    email: "",
    profesion: "",
    cargo: "",
    genero: "",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Pre-llenar la compañía si viene como prop
  useEffect(() => {
    if (compania) {
      setFormData(prev => ({ ...prev }))
    }
  }, [compania])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // 1. Crear el contacto
      const { data: contactoCreado, error: contactoError } = await supabase
        .from("contactos")
        .insert({
          contacto_nombres: formData.nombres,
          contacto_apellidos: formData.apellidos,
          contacto_nombre_completo: `${formData.nombres} ${formData.apellidos}`.trim(),
          contacto_celular_principal: formData.celular,
          contacto_email: formData.email,
          contacto_profesion: formData.profesion,
          contacto_cargo: formData.cargo,
          contacto_genero: formData.genero,
        })
        .select()
        .single()

      if (contactoError) throw contactoError

      // 2. Relacionar el contacto con la compañía
      if (compania && contactoCreado) {
        // Buscar el ID de la compañía
        const { data: companiaData } = await supabase
          .from("companias")
          .select("compania_id")
          .eq("compania_nombre", compania)
          .single()

        if (companiaData) {
          await supabase
            .from("contacto_compania")
            .insert({
              contacto_id: contactoCreado.contacto_id,
              compania_id: companiaData.compania_id,
            })
        }
      }

      resetForm()
      onOpenChange(false)
      onSuccess?.()
    } catch (err) {
      console.error("Error al crear contacto:", err)
      setError("Error al crear el contacto. Intente nuevamente.")
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      nombres: "",
      apellidos: "",
      celular: "",
      email: "",
      profesion: "",
      cargo: "",
      genero: "",
    })
    setError(null)
  }

  const handleClose = () => {
    resetForm()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Crear Nuevo Contacto</DialogTitle>
          {compania && (
            <p className="text-sm text-muted-foreground">
              Para la compañía: <strong>{compania}</strong>
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
            <div className="space-y-2">
              <Label htmlFor="contact-profession">Profesión</Label>
              <Input
                id="contact-profession"
                value={formData.profesion}
                onChange={(e) => setFormData({ ...formData, profesion: e.target.value })}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact-position">Cargo</Label>
              <Input
                id="contact-position"
                value={formData.cargo}
                onChange={(e) => setFormData({ ...formData, cargo: e.target.value })}
                disabled={loading}
              />
            </div>
            <div className="space-y-2 col-span-2">
              <Label>Género</Label>
              <Select 
                value={formData.genero} 
                onValueChange={(value) => setFormData({ ...formData, genero: value })}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar género" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="F">Femenino</SelectItem>
                  <SelectItem value="M">Masculino</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || !formData.nombres.trim()}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Crear Contacto
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
