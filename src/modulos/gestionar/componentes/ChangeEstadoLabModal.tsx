import { useState } from "react";
import { Loader2, CheckCircle2, AlertCircle, FlaskConical, ShieldAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

import {
  actualizarEstadoLabMasivo,
  ESTADOS_LAB,
  type EstadoLab,
  type VistaMaestraRow,
} from "@/modulos/gestionar/servicios";

interface ChangeEstadoLabModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedPruebas: VistaMaestraRow[];
  onSuccess: () => void;
}

const ESTADO_DOT: Record<EstadoLab, string> = {
  "Esperando Aprobación": "bg-amber-400",
  "Aprobado FV":          "bg-green-500",
  "En Curso":             "bg-blue-500",
  "Anulado":              "bg-red-500",
};

const ESTADO_BADGE: Record<EstadoLab, string> = {
  "Esperando Aprobación": "bg-amber-50 text-amber-800 border-amber-200",
  "Aprobado FV":          "bg-green-50 text-green-800 border-green-200",
  "En Curso":             "bg-blue-50 text-blue-800 border-blue-200",
  "Anulado":              "bg-red-50 text-red-800 border-red-200",
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

  const pruebasAprobadas = selectedPruebas.filter(
    (p) => p.prueba_estado_lab === "Aprobado FV"
  );
  const bloqueadoPorAprobacion = pruebasAprobadas.length > 0;

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
      <DialogContent className="sm:max-w-xs">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <FlaskConical className="h-4 w-4" />
            Cambiar Estado LAB
          </DialogTitle>
        </DialogHeader>

        {successMessage && (
          <Alert className="bg-green-50 border-green-200 py-2">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800 text-xs">
              {successMessage}
            </AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive" className="py-2">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs">{error}</AlertDescription>
          </Alert>
        )}

        {bloqueadoPorAprobacion && (
          <Alert className="bg-green-50 border-green-200 py-2">
            <ShieldAlert className="h-4 w-4 text-green-700" />
            <AlertDescription className="text-green-800 text-xs">
              {pruebasAprobadas.length === selectedPruebas.length
                ? "Todas las pruebas seleccionadas están en "
                : `${pruebasAprobadas.length} de ${selectedPruebas.length} pruebas están en `}
              <span className="font-semibold">Aprobado FV</span>
              {" "}— no se puede cambiar el estado LAB.
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">
            Se aplicará a{" "}
            <span className="font-medium text-foreground">
              {selectedPruebas.length}{" "}
              {selectedPruebas.length === 1 ? "prueba seleccionada" : "pruebas seleccionadas"}
            </span>
          </p>

          <Select
            value={estadoSeleccionado ?? ""}
            onValueChange={(v) => setEstadoSeleccionado(v as EstadoLab)}
            disabled={isSubmitting || bloqueadoPorAprobacion}
          >
            <SelectTrigger className="h-9 text-sm w-full">
              {estadoSeleccionado ? (
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium",
                    ESTADO_BADGE[estadoSeleccionado]
                  )}
                >
                  <span className={cn("h-1.5 w-1.5 rounded-full", ESTADO_DOT[estadoSeleccionado])} />
                  {estadoSeleccionado}
                </span>
              ) : (
                <SelectValue placeholder="Seleccionar estado…" />
              )}
            </SelectTrigger>
            <SelectContent>
              {ESTADOS_LAB.map((estado) => (
                <SelectItem key={estado} value={estado} className="text-sm">
                  <span className="flex items-center gap-2">
                    <span className={cn("h-2 w-2 rounded-full flex-shrink-0", ESTADO_DOT[estado])} />
                    {estado}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <DialogFooter className="mt-1">
          <Button
            variant="outline"
            onClick={() => handleClose(false)}
            disabled={isSubmitting}
            className="text-sm h-8"
          >
            Cancelar
          </Button>
          <Button
            onClick={() => void handleGuardar()}
            disabled={isSubmitting || !estadoSeleccionado || bloqueadoPorAprobacion}
            className="h-8 bg-black hover:bg-black/90 text-white text-sm"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                Guardando…
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
