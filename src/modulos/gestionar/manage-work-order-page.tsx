"use client";

import { Card, CardContent } from "@/components/ui/card";
import { WorkOrderForm } from "./work-order-form";

export function ManageWorkOrderPage() {
  return (
    <div className="space-y-2">
      {/* Header de la página */}
      <div className="space-y-1 ml-4">
        <h1 className="text-xl font-bold tracking-tight">
          Gestionar Órdenes de Trabajo
        </h1>
      </div>

      {/* Formulario de Orden de Trabajo */}
      <Card>
        <CardContent>
          <WorkOrderForm mode="create-new" disabled={false} />
        </CardContent>
      </Card>
    </div>
  );
}
