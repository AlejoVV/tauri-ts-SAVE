"use client";

import { useState, useRef } from "react";
import { Search, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

import { WorkOrderTestsTable } from "./components/work-order-tests-table";
import { EditTestModal } from "./components/edit-test-modal";
import {
  buscarOTPorNumero,
  type OTData,
  type VistaMaestraRow,
} from "@/modulos/registrar/servicios/workOrderService";

export function ManageWorkOrderPage() {
  const otInputRef = useRef<HTMLInputElement>(null);
  const [otBuscada, setOtBuscada] = useState<number | null>(null);
  const [otInfo, setOtInfo] = useState<Pick<OTData, "facturarA" | "contacto"> | null>(null);
  const [buscandoInfo, setBuscandoInfo] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [pruebaAEditar, setPruebaAEditar] = useState<VistaMaestraRow | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);

  const handleBuscar = async () => {
    const value = otInputRef.current?.value?.trim();
    const num = value ? parseInt(value, 10) : NaN;
    if (!isNaN(num) && num > 0) {
      setOtBuscada(num);
      setOtInfo(null);
      setBuscandoInfo(true);
      try {
        const data = await buscarOTPorNumero(num);
        setOtInfo({ facturarA: data.facturarA, contacto: data.contacto });
      } catch {
        setOtInfo(null);
      } finally {
        setBuscandoInfo(false);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      void handleBuscar();
    }
  };

  const handleEdit = (prueba: VistaMaestraRow) => {
    setPruebaAEditar(prueba);
    setEditModalOpen(true);
  };

  const handleEditSuccess = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="space-y-1 ml-4">
        <h1 className="text-xl font-bold tracking-tight">
          Gestionar Órdenes de Trabajo
        </h1>
      </div>

      {/* Búsqueda de OT */}
      <Card>
        <CardContent className="pt-3 pb-3">
          <div className="flex items-end gap-3 flex-wrap">
            {/* Campo OT + botón */}
            <div className="flex items-end gap-2">
              <div className="space-y-0.5">
                <Label htmlFor="ot-buscar" className="text-xs">
                  OT
                </Label>
                <Input
                  ref={otInputRef}
                  id="ot-buscar"
                  type="number"
                  min="1"
                  className="h-8 w-28 text-sm"
                  placeholder="Número..."
                  onKeyDown={handleKeyDown}
                />
              </div>
              <Button
                onClick={() => void handleBuscar()}
                disabled={buscandoInfo}
                className="h-8 text-xs bg-black hover:bg-black/90 text-white"
              >
                {buscandoInfo ? (
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                ) : (
                  <Search className="h-3 w-3 mr-1" />
                )}
                Buscar
              </Button>
            </div>

            {/* Separador vertical */}
            {otInfo && (
              <div className="hidden sm:block h-8 w-px bg-border self-end" />
            )}

            {/* Facturar a */}
            {otInfo && (
              <div className="space-y-0.5">
                <Label className="text-xs text-muted-foreground">
                  Facturar a
                </Label>
                <div className="h-8 flex items-center">
                  <span className="text-sm font-medium">{otInfo.facturarA || "—"}</span>
                </div>
              </div>
            )}

            {/* Contacto */}
            {otInfo && (
              <div className="space-y-0.5">
                <Label className="text-xs text-muted-foreground">
                  Contacto
                </Label>
                <div className="h-8 flex items-center">
                  <span className="text-sm font-medium">{otInfo.contacto || "—"}</span>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tabla de pruebas */}
      <WorkOrderTestsTable
        ordenTrabajo={otBuscada}
        refreshTrigger={refreshTrigger}
        onEdit={handleEdit}
      />

      {/* Panel inferior: grupos de botones de acciones */}
      <Card>
        <CardContent className="pt-3 pb-3">
          <div className="grid grid-cols-3 gap-3">
            {/* Columna 1 */}
            <div className="flex flex-col gap-1.5">
              <Button disabled variant="outline" className="h-8 text-xs justify-start">
                Cliente Nuevo
              </Button>
              <Button disabled variant="outline" className="h-8 text-xs justify-start">
                Cliente Ant.
              </Button>
              <Button disabled variant="outline" className="h-8 text-xs justify-start">
                Monitoreo
              </Button>
              <Button disabled variant="outline" className="h-8 text-xs justify-start">
                Taxonomía
              </Button>
            </div>
            {/* Columna 2 */}
            <div className="flex flex-col gap-1.5">
              <Button disabled variant="outline" className="h-8 text-xs justify-start">
                Fecha Ent. Inf.
              </Button>
              <Button disabled variant="outline" className="h-8 text-xs justify-start">
                Num. Factura
              </Button>
              <Button disabled variant="outline" className="h-8 text-xs justify-start">
                Cierre OT
              </Button>
            </div>
            {/* Columna 3 */}
            <div className="flex flex-col gap-1.5">
              <Button disabled variant="outline" className="h-8 text-xs justify-start">
                Imprimir OT
              </Button>
              <Button disabled variant="outline" className="h-8 text-xs justify-start">
                B. Datos Tot.
              </Button>
              <Button disabled variant="outline" className="h-8 text-xs justify-start">
                BD a la Fecha
              </Button>
              <Button disabled variant="outline" className="h-8 text-xs justify-start">
                Paq. Remisión
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modal de edición */}
      <EditTestModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        prueba={pruebaAEditar}
        onSuccess={handleEditSuccess}
      />
    </div>
  );
}
