"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { WorkOrderForm } from "./work-order-form"
import { RegisterTestsTable } from "./register-tests-table"

export function RegisterWorkOrderPage() {
  return (
    <div className="space-y-2">
      {/* Header de la página */}
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Registro de Órdenes de Trabajo</h1>
      </div>

      {/* Formulario de Orden de Trabajo */}
      <Card>
        <CardContent>
          <WorkOrderForm mode="create-new" disabled={false} />
        </CardContent>
      </Card>

      {/* Botón de Guardar y Continuar */}
      <div className="flex justify-center">
        <Button size="lg" className="px-8 py-3 text-lg">
          Guardar y Continuar
        </Button>
      </div>

      <Separator />

      {/* Tabla de Registro de Pruebas */}
      <Card>
        <CardContent>
          <RegisterTestsTable mode="all-tests" />
        </CardContent>
      </Card>
    </div>
  )
}
