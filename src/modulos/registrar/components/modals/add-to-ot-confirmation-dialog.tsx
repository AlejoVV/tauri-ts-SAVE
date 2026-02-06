"use client";

import { AlertCircle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/modulos/registrar/components/ui/alert-dialog";

interface AddToOTConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

/**
 * Diálogo de confirmación para adicionar pruebas a una OT existente
 * Pregunta al usuario si desea continuar con el proceso de adición
 */
export function AddToOTConfirmationDialog({
  open,
  onOpenChange,
  onConfirm,
}: AddToOTConfirmationDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-[500px]">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-blue-600" />
            Adicionar Prueba a OT Existente
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-2 text-sm">
            <p>¿Desea adicionar una prueba a una orden de trabajo anterior?</p>
            <p className="text-muted-foreground">
              Si selecciona "Continuar", podrá buscar una OT existente y
              agregar nuevas pruebas manteniendo los datos de facturación.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Continuar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
