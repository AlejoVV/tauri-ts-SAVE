"use client";

import { useState } from "react";
import { Search, Loader2, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/modulos/registrar/components/ui/dialog";
import { Button } from "@/modulos/registrar/components/ui/button";
import { Input } from "@/modulos/registrar/components/ui/input";
import { Label } from "@/modulos/registrar/components/ui/label";
import { Alert, AlertDescription } from "@/modulos/registrar/components/ui/alert";
import { buscarOTPorNumero, type OTData } from "@/modulos/registrar/servicios/workOrderService";

interface SearchOTDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOTSelected: (otData: OTData) => void;
  numeroOTMaximo: number;
}

/**
 * Diálogo de búsqueda de OT con validación previa
 * Valida que el número no sea mayor al máximo actual antes de buscar
 * Al encontrar la OT, cierra automáticamente y carga los datos
 */
export function SearchOTDialog({
  open,
  onOpenChange,
  onOTSelected,
  numeroOTMaximo,
}: SearchOTDialogProps) {
  const [numeroOT, setNumeroOT] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Valida el número de OT antes de buscar en BD
   * rerender-functional-setstate - Stable callback
   */
  const validateNumeroOT = (): boolean => {
    // js-early-exit - Return early from functions
    if (!numeroOT.trim()) {
      setError("Por favor ingrese un número de OT");
      return false;
    }

    const numero = Number(numeroOT);

    if (isNaN(numero) || numero <= 0) {
      setError("El número de OT debe ser mayor a 0");
      return false;
    }

    // Validación crítica: no permitir números mayores al máximo actual
    if (numero > numeroOTMaximo) {
      setError(
        `El número de OT no puede ser mayor a ${numeroOTMaximo} (OT máxima actual)`
      );
      return false;
    }

    return true;
  };

  /**
   * Busca la OT en la base de datos
   * async-defer-await - Defer await to where result is used
   */
  const handleSearch = async () => {
    // js-early-exit - Return early if already searching
    if (isSearching) return;

    // Validar antes de buscar
    if (!validateNumeroOT()) return;

    setIsSearching(true);
    setError(null);

    try {
      const numero = Number(numeroOT);
      const otData = await buscarOTPorNumero(numero);

      // Carga directa: cerrar modal y llamar callback
      handleClose();
      onOTSelected(otData);
    } catch (err) {
      console.error("Error al buscar OT:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Error al buscar la orden de trabajo. Intente nuevamente."
      );
    } finally {
      setIsSearching(false);
    }
  };

  /**
   * Limpia el estado y cierra el diálogo
   */
  const handleClose = () => {
    setNumeroOT("");
    setError(null);
    onOpenChange(false);
  };

  /**
   * Maneja el evento Enter para buscar
   */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !isSearching) {
      handleSearch();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="h-5 w-5 text-blue-600" />
            Buscar Orden de Trabajo
          </DialogTitle>
          <DialogDescription>
            Ingrese el número de OT para adicionar una nueva prueba
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Campo de búsqueda */}
          <div className="flex items-end gap-2">
            <div className="flex-1 space-y-2">
              <Label htmlFor="numero-ot">Número de OT *</Label>
              <Input
                id="numero-ot"
                type="number"
                value={numeroOT}
                onChange={(e) => {
                  setNumeroOT(e.target.value);
                  // Limpiar error al escribir
                  if (error) setError(null);
                }}
                onKeyDown={handleKeyDown}
                placeholder="Ej: 1234"
                disabled={isSearching}
                className="h-10"
                autoFocus
              />
              {numeroOTMaximo > 0 && (
                <p className="text-xs text-muted-foreground">
                  OT máxima actual: {numeroOTMaximo}
                </p>
              )}
            </div>
            <Button
              type="button"
              onClick={handleSearch}
              disabled={isSearching || !numeroOT.trim()}
              className="h-10 bg-blue-600 hover:bg-blue-700"
            >
              {isSearching ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Buscando...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  Buscar
                </>
              )}
            </Button>
          </div>

          {/* Error */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isSearching}
          >
            Cancelar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
