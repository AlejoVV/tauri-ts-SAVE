import type React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ProductModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function ProductModal({ open, onOpenChange, onSuccess }: ProductModalProps) {
  const [formData, setFormData] = useState({
    nombre: "",
    unidades: "",
    casaComercial: "",
    tipoProducto: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Nuevo producto:", formData);
    onOpenChange(false);
    setFormData({ nombre: "", unidades: "", casaComercial: "", tipoProducto: "" });
    onSuccess();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Crear Nuevo Producto</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 col-span-2">
              <Label htmlFor="product-name">Nombre</Label>
              <Input
                id="product-name"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Unidades</Label>
              <Select
                value={formData.unidades}
                onValueChange={(value) => setFormData({ ...formData, unidades: value })}
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
              />
            </div>
            <div className="space-y-2 col-span-2">
              <Label>Tipo producto</Label>
              <Select
                value={formData.tipoProducto}
                onValueChange={(value) => setFormData({ ...formData, tipoProducto: value })}
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
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">Crear Producto</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
