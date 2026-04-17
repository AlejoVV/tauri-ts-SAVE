import type React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface CompanyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CompanyModal({ open, onOpenChange, onSuccess }: CompanyModalProps) {
  const [nombre, setNombre] = useState("");
  const [ubicacion, setUbicacion] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Nueva compañía:", { nombre, ubicacion });
    onOpenChange(false);
    setNombre("");
    setUbicacion("");
    onSuccess();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Crear Nueva Compañía</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="company-name">Nombre *</Label>
            <Input id="company-name" value={nombre} onChange={(e) => setNombre(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="company-location">Ubicación</Label>
            <Input id="company-location" value={ubicacion} onChange={(e) => setUbicacion(e.target.value)} />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">Crear Compañía</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
