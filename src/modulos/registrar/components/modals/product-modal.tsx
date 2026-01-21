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

interface ProductModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function ProductModal({ open, onOpenChange, onSuccess }: ProductModalProps) {
  const [formData, setFormData] = useState({
    nombre: "",
    unidades: "",
    casaComercial: "",
    tipoProducto: "",
    ingredienteActivo: "",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { error: insertError } = await supabase
        .from("productos")
        .insert({
          producto_nombre: formData.nombre,
          producto_unidades: formData.unidades || null,
          producto_casa_comercial: formData.casaComercial || null,
          producto_tipo: formData.tipoProducto || null,
          producto_ingrediente_activo: formData.ingredienteActivo || null,
        })

      if (insertError) throw insertError

      resetForm()
      onOpenChange(false)
      onSuccess?.()
    } catch (err) {
      console.error("Error al crear producto:", err)
      setError("Error al crear el producto. Intente nuevamente.")
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      nombre: "",
      unidades: "",
      casaComercial: "",
      tipoProducto: "",
      ingredienteActivo: "",
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
          <DialogTitle>Crear Nuevo Producto</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-2 rounded">
              {error}
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 col-span-2">
              <Label htmlFor="product-name">Nombre *</Label>
              <Input
                id="product-name"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label>Unidades</Label>
              <Select
                value={formData.unidades}
                onValueChange={(value) => setFormData({ ...formData, unidades: value })}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar unidad" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cc/lt">cc/lt</SelectItem>
                  <SelectItem value="gr/lt">gr/lt</SelectItem>
                  <SelectItem value="cc/lt + cc/lt">cc/lt + cc/lt</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="commercial-house">Casa comercial</Label>
              <Input
                id="commercial-house"
                value={formData.casaComercial}
                onChange={(e) => setFormData({ ...formData, casaComercial: e.target.value })}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label>Tipo producto</Label>
              <Select
                value={formData.tipoProducto}
                onValueChange={(value) => setFormData({ ...formData, tipoProducto: value })}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Biológico">Biológico</SelectItem>
                  <SelectItem value="Químico">Químico</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ingrediente-activo">Ingrediente activo</Label>
              <Input
                id="ingrediente-activo"
                value={formData.ingredienteActivo}
                onChange={(e) => setFormData({ ...formData, ingredienteActivo: e.target.value })}
                disabled={loading}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || !formData.nombre.trim()}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Crear Producto
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
