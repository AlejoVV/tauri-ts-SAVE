import { useState, useEffect } from "react";
import { Loader2, Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

import { actualizarNumeroFactura } from "@/modulos/gestionar/servicios";

interface ChangeNumeroFacturaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  otId: number;
  numeroFacturaActual: number | null;
  onSuccess: (nuevoNumero: number | null) => void;
}

export function ChangeNumeroFacturaModal({
  open,
  onOpenChange,
  otId,
  numeroFacturaActual,
  onSuccess,
}: ChangeNumeroFacturaModalProps) {
  const [valor, setValor] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setValor(numeroFacturaActual != null ? String(numeroFacturaActual) : "");
      setError(null);
      setSaved(false);
    }
  }, [open, numeroFacturaActual]);

  const handleClose = (nextOpen: boolean) => {
    if (!isSubmitting) onOpenChange(nextOpen);
  };

  const handleGuardar = async () => {
    const trimmed = valor.trim();
    const nuevoNumero = trimmed === "" ? null : parseInt(trimmed, 10);

    if (trimmed !== "" && (isNaN(nuevoNumero!) || nuevoNumero! <= 0)) {
      setError("Número inválido");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const result = await actualizarNumeroFactura(otId, nuevoNumero);

    if (!result.success) {
      setError(result.error ?? "Error al guardar");
      setIsSubmitting(false);
      return;
    }

    setSaved(true);
    setIsSubmitting(false);

    setTimeout(() => {
      onSuccess(nuevoNumero);
      onOpenChange(false);
    }, 800);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") void handleGuardar();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="w-fit max-w-[200px] p-4 gap-3">
        <DialogHeader className="space-y-0.5">
          <DialogTitle className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground leading-none">
            N° Factura
          </DialogTitle>
          <p className="text-base font-semibold leading-none tabular-nums">
            OT {otId}
          </p>
        </DialogHeader>

        <div className="space-y-1">
          <Input
            type="number"
            min="1"
            placeholder="—"
            value={valor}
            onChange={(e) => { setValor(e.target.value); setError(null); }}
            onKeyDown={handleKeyDown}
            disabled={isSubmitting || saved}
            className="h-8 text-sm tabular-nums w-full"
            autoFocus
          />
          {error ? (
            <p className="text-[10px] text-destructive leading-none">{error}</p>
          ) : (
            <p className="text-[10px] text-muted-foreground leading-none">
              En blanco para eliminar
            </p>
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
            onClick={() => void handleGuardar()}
            disabled={isSubmitting || saved}
            className="h-7 text-xs px-3 bg-black hover:bg-black/90 text-white flex-1"
          >
            {isSubmitting ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : saved ? (
              <Check className="h-3 w-3" />
            ) : (
              "Guardar"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
