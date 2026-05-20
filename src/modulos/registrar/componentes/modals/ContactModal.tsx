import type React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ContactModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  compania: string;
  onSuccess: () => void;
}

export function ContactModal({ open, onOpenChange, compania, onSuccess }: ContactModalProps) {
  const [formData, setFormData] = useState({
    nombre: "",
    celular: "",
    email: "",
    profesion: "",
    cargo: "",
    genero: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Nuevo contacto:", { facturarA: compania, ...formData });
    onOpenChange(false);
    setFormData({ nombre: "", celular: "", email: "", profesion: "", cargo: "", genero: "" });
    onSuccess();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Crear Nuevo Contacto</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 col-span-2">
              <Label>Compañía</Label>
              <Input value={compania} readOnly className="bg-muted" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact-name">Nombre</Label>
              <Input
                id="contact-name"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact-phone">Celular</Label>
              <Input
                id="contact-phone"
                value={formData.celular}
                onChange={(e) => setFormData({ ...formData, celular: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact-email">Email</Label>
              <Input
                id="contact-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact-profession">Profesión</Label>
              <Input
                id="contact-profession"
                value={formData.profesion}
                onChange={(e) => setFormData({ ...formData, profesion: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact-position">Cargo</Label>
              <Input
                id="contact-position"
                value={formData.cargo}
                onChange={(e) => setFormData({ ...formData, cargo: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Género</Label>
              <Select value={formData.genero} onValueChange={(value) => setFormData({ ...formData, genero: value })}>
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
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">Crear Contacto</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
