import { useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

import {
  actualizarFechaEntregaInformeMasivo,
  type VistaMaestraRow,
} from "@/modulos/gestionar/servicios";

interface ChangeFechaEntregaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedPruebas: VistaMaestraRow[];
  onSuccess: () => void;
}

export function ChangeFechaEntregaModal({
  open,
  onOpenChange,
  selectedPruebas,
  onSuccess,
}: ChangeFechaEntregaModalProps) {
  const [fechaSeleccionada, setFechaSeleccionada] = useState<Date | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleClose = (nextOpen: boolean) => {
    if (!isSubmitting) {
      if (!nextOpen) {
        setFechaSeleccionada(undefined);
        setError(null);
        setSuccessMessage(null);
      }
      onOpenChange(nextOpen);
    }
  };

  const handleGuardar = async () => {
    if (!fechaSeleccionada || selectedPruebas.length === 0) return;

    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const ids = selectedPruebas
        .map((p) => p.prueba_id)
        .filter((id): id is number => id !== null);

      const fechaISO = format(fechaSeleccionada, "yyyy-MM-dd");
      const result = await actualizarFechaEntregaInformeMasivo(ids, fechaISO);

      if (!result.success) {
        setError(result.error ?? "Error al actualizar la fecha de entrega");
        return;
      }

      const count = ids.length;
      setSuccessMessage(
        `Fecha actualizada en ${count} ${count === 1 ? "prueba" : "pruebas"}`
      );

      setTimeout(() => {
        setSuccessMessage(null);
        setFechaSeleccionada(undefined);
        onSuccess();
        onOpenChange(false);
      }, 1200);
    } catch (err) {
      console.error("Error al actualizar fecha de entrega:", err);
      setError(err instanceof Error ? err.message : "Error inesperado al actualizar la fecha");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-xs">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <CalendarIcon className="h-4 w-4" />
            Fecha Entrega Informe
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

          <Calendar
            mode="single"
            selected={fechaSeleccionada}
            onSelect={setFechaSeleccionada}
            disabled={isSubmitting}
            captionLayout="dropdown"
            startMonth={new Date(2020, 0)}
            endMonth={new Date(2030, 11)}
            locale={es}
            className="rounded-md border w-full [--cell-size:1.5rem] !p-2"
            classNames={{
              month: "flex w-full flex-col gap-2",
              week: "mt-0.5 flex w-full",
              weekday: "text-muted-foreground flex-1 select-none rounded text-[0.65rem] font-normal",
              dropdowns: "flex h-[--cell-size] w-full items-center justify-center gap-1 text-xs font-medium",
            }}
          />
        </div>

        <DialogFooter className="mt-1">
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
            disabled={isSubmitting || !fechaSeleccionada}
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
