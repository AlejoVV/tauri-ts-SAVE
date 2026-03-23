import { useState } from "react";
import { Loader2, CheckCircle2, AlertCircle, FlaskConical } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

import {
  actualizarEstadoLabMasivo,
  ESTADOS_LAB,
  type EstadoLab,
  type VistaMaestraRow,
} from "@/modulos/registrar/servicios/workOrderService";

interface ChangeEstadoLabModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedPruebas: VistaMaestraRow[];
  onSuccess: () => void;
}

const ESTADO_COLORS: Record<EstadoLab, string> = {
  "Esperando Aprobación": "border-amber-300 bg-amber-50 text-amber-800 data-[selected=true]:bg-amber-100 data-[selected=true]:border-amber-500",
  "Aprobado FV":          "border-green-300 bg-green-50 text-green-800 data-[selected=true]:bg-green-100 data-[selected=true]:border-green-500",
  "En Curso":             "border-blue-300 bg-blue-50 text-blue-800 data-[selected=true]:bg-blue-100 data-[selected=true]:border-blue-500",
  "Anulado":              "border-red-300 bg-red-50 text-red-800 data-[selected=true]:bg-red-100 data-[selected=true]:border-red-500",
};

export function ChangeEstadoLabModal({
  open,
  onOpenChange,
  selectedPruebas,
  onSuccess,
}: ChangeEstadoLabModalProps) {
  const [estadoSeleccionado, setEstadoSeleccionado] = useState<EstadoLab | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleClose = (nextOpen: boolean) => {
    if (!isSubmitting) {
      if (!nextOpen) {
        setEstadoSeleccionado(null);
        setError(null);
        setSuccessMessage(null);
      }
      onOpenChange(nextOpen);
    }
  };

  const handleGuardar = async () => {
    if (!estadoSeleccionado || selectedPruebas.length === 0) return;

    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    const ids = selectedPruebas
      .map((p) => p.prueba_id)
      .filter((id): id is number => id !== null);

    const result = await actualizarEstadoLabMasivo(ids, estadoSeleccionado);

    if (!result.success) {
      setError(result.error ?? "Error al actualizar el estado lab");
      setIsSubmitting(false);
      return;
    }

    const count = ids.length;
    setSuccessMessage(
      `Estado lab actualizado en ${count} ${count === 1 ? "prueba" : "pruebas"}`
    );

    setTimeout(() => {
      setSuccessMessage(null);
      setEstadoSeleccionado(null);
      onSuccess();
      onOpenChange(false);
    }, 1200);

    setIsSubmitting(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <FlaskConical className="h-4 w-4" />
            Cambiar Estado LAB
          </DialogTitle>
        </DialogHeader>

        {successMessage && (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              {successMessage}
            </AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Se aplicará a{" "}
            <span className="font-medium text-foreground">
              {selectedPruebas.length}{" "}
              {selectedPruebas.length === 1 ? "prueba seleccionada" : "pruebas seleccionadas"}
            </span>
          </p>

          <div className="grid grid-cols-1 gap-2">
            {ESTADOS_LAB.map((estado) => (
              <button
                key={estado}
                type="button"
                data-selected={estadoSeleccionado === estado}
                onClick={() => setEstadoSeleccionado(estado)}
                disabled={isSubmitting}
                className={cn(
                  "flex items-center gap-2 rounded-md border px-3 py-2.5 text-sm font-medium text-left",
                  "transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  ESTADO_COLORS[estado]
                )}
              >
                <span
                  className={cn(
                    "h-3.5 w-3.5 rounded-full border-2 flex-shrink-0 transition-colors",
                    estadoSeleccionado === estado
                      ? "border-current bg-current"
                      : "border-current bg-transparent"
                  )}
                />
                {estado}
              </button>
            ))}
          </div>
        </div>

        <DialogFooter className="mt-2">
          <Button
            variant="outline"
            onClick={() => handleClose(false)}
            disabled={isSubmitting}
            className="text-sm h-9"
          >
            Cancelar
          </Button>
          <Button
            onClick={() => void handleGuardar()}
            disabled={isSubmitting || !estadoSeleccionado}
            className="h-9 bg-black hover:bg-black/90 text-white text-sm"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              "Guardar"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
