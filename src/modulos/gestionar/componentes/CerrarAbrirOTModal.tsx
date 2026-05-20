import { useState } from "react";
import { Loader2, Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

import { actualizarEstadoOT } from "@/modulos/gestionar/servicios";

interface CerrarAbrirOTModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  otId: number;
  esCerrada: boolean;
  onSuccess: (nuevoEstado: "Cerrada" | null) => void;
}

export function CerrarAbrirOTModal({
  open,
  onOpenChange,
  otId,
  esCerrada,
  onSuccess,
}: CerrarAbrirOTModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClose = (nextOpen: boolean) => {
    if (!isSubmitting) {
      setSaved(false);
      setError(null);
      onOpenChange(nextOpen);
    }
  };

  const handleConfirmar = async () => {
    setIsSubmitting(true);
    setError(null);

    const nuevoEstado: "Cerrada" | null = esCerrada ? null : "Cerrada";
    const result = await actualizarEstadoOT(otId, nuevoEstado);

    if (!result.success) {
      setError(result.error ?? "Error al actualizar");
      setIsSubmitting(false);
      return;
    }

    setSaved(true);
    setIsSubmitting(false);

    setTimeout(() => {
      onSuccess(nuevoEstado);
      handleClose(false);
    }, 800);
  };

  const accion = esCerrada ? "Abrir" : "Cerrar";
  const descripcion = esCerrada
    ? "Se limpiará el estado de la OT."
    : 'Se marcará la OT como "Cerrada".';

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="w-fit max-w-[240px] p-4 gap-3">
        <DialogHeader className="space-y-0.5">
          <DialogTitle className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground leading-none">
            {accion} OT
          </DialogTitle>
          <p className="text-base font-semibold leading-none tabular-nums">
            OT {otId}
          </p>
        </DialogHeader>

        <div className="space-y-1">
          <p className="text-sm text-muted-foreground leading-snug">
            {descripcion}
          </p>
          <p className="text-sm leading-snug">
            ¿Desea continuar?
          </p>
          {error && (
            <p className="text-[10px] text-destructive leading-none">{error}</p>
          )}
        </div>

        <DialogFooter className="gap-1.5 sm:gap-1.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleClose(false)}
            disabled={isSubmitting}
            className="h-7 text-xs px-2 flex-1"
          >
            Cancelar
          </Button>
          <Button
            size="sm"
            onClick={() => void handleConfirmar()}
            disabled={isSubmitting || saved}
            className="h-7 text-xs px-3 bg-black hover:bg-black/90 text-white flex-1"
          >
            {isSubmitting ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : saved ? (
              <Check className="h-3 w-3" />
            ) : (
              `Sí, ${accion.toLowerCase()} OT`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
