"use client"

import { useState } from "react"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { WorkOrderForm } from "./work-order-form"
import { RegisterTestsTable } from "./register-tests-table"

export function RegisterWorkOrderPage() {
  // Estado para controlar el modo de la página
  const [isAddToExisting, setIsAddToExisting] = useState(false)

  // Función para manejar el cambio de modo
  const handleModeChange = (checked: boolean) => {
    setIsAddToExisting(checked)
  }

  return (
    <div className="space-y-8">
      {/* Header de la página */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Registro de Órdenes de Trabajo</h1>
        <p className="text-muted-foreground">Cree nuevas órdenes de trabajo o adicione pruebas a órdenes existentes.</p>
      </div>

      {/* Selector de modo */}
      <Card>
        <CardHeader>
          <CardTitle>Modo de Registro</CardTitle>
          <CardDescription>
            Seleccione si desea crear una nueva orden de trabajo o adicionar pruebas a una existente.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="mode-switch"
                checked={isAddToExisting}
                onCheckedChange={handleModeChange}
                aria-describedby="mode-description"
              />
              <Label htmlFor="mode-switch" className="text-sm font-medium">
                {isAddToExisting ? "Adicionar a OT existente" : "Crear OT Nueva"}
              </Label>
            </div>
            <div className="text-sm text-muted-foreground" id="mode-description">
              {isAddToExisting
                ? "Se adicionarán pruebas a una orden de trabajo existente"
                : "Se creará una nueva orden de trabajo completa"}
            </div>
          </div>

          {/* Indicador visual del modo activo */}
          <div className="mt-4 p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${isAddToExisting ? "bg-blue-500" : "bg-green-500"}`} />
              <span className="text-sm font-medium">
                Modo activo: {isAddToExisting ? "Adicionar a OT existente" : "Crear OT Nueva"}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Formulario de Orden de Trabajo */}
      <Card>
        <CardHeader>
          <CardTitle>{isAddToExisting ? "Información de OT Existente" : "Nueva Orden de Trabajo"}</CardTitle>
          <CardDescription>
            {isAddToExisting
              ? "Los campos principales están deshabilitados. Solo se pueden modificar los datos específicos de la nueva prueba."
              : "Complete todos los campos para crear una nueva orden de trabajo."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* 
            Aquí se pasa el estado del modo al WorkOrderForm
            El formulario debería recibir una prop para saber si está en modo "adicionar"
          */}
          <WorkOrderForm mode={isAddToExisting ? "add-to-existing" : "create-new"} disabled={isAddToExisting} />
        </CardContent>
      </Card>

      {/* Botón de Guardar y Continuar */}
      <div className="flex justify-center">
        <Button size="lg" className="px-8 py-3 text-lg">
          {isAddToExisting ? "Adicionar Prueba y Continuar" : "Guardar y Continuar"}
        </Button>
      </div>

      <Separator />

      {/* Tabla de Registro de Pruebas */}
      <Card>
        <CardHeader>
          <CardTitle>Pruebas Registradas</CardTitle>
          <CardDescription>
            {isAddToExisting
              ? "Pruebas existentes en la OT seleccionada y nuevas pruebas adicionadas."
              : "Historial de todas las pruebas registradas en el sistema."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RegisterTestsTable mode={isAddToExisting ? "existing-ot" : "all-tests"} />
        </CardContent>
      </Card>
    </div>
  )
}
