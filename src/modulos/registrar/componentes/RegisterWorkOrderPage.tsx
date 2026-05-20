import { Card, CardContent } from "@/components/ui/card";
import { WorkOrderForm } from "@/modulos/registrar/componentes/WorkOrderForm";

export function RegisterWorkOrderPage() {
  return (
    <div className="space-y-2">
      <div className="space-y-1 ml-4">
        <h1 className="text-xl font-bold tracking-tight">
          Registro de Órdenes de Trabajo
        </h1>
      </div>
      <Card>
        <CardContent>
          <WorkOrderForm mode="create-new" disabled={false} />
        </CardContent>
      </Card>
    </div>
  );
}
