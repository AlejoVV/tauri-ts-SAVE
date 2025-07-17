"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { CardDescription } from "@/components/ui/card"
import { CardTitle } from "@/components/ui/card"
import { CardHeader } from "@/components/ui/card"
import { CardContent } from "@/components/ui/card"
import { Card } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { MontagesInProgressTable } from "./montages-in-progress-table"
import { TestSelectionTable } from "./test-selection-table"
import { MontageSetupForm } from "./montage-setup-form"
import { CompletedTestsTable } from "./completed-tests-table"
import { Calculator, FlaskConical, FileText, Plus } from "lucide-react"

export function EficaciaMain() {
  const [selectedTests, setSelectedTests] = useState([])
  const [showNewMontageForm, setShowNewMontageForm] = useState(false)
  const [activeTab, setActiveTab] = useState("montajes")

  // Update the 'tabs' array to include the correct icons and descriptions
  const tabs = [
    {
      id: "montajes",
      title: "Montajes en Curso",
      icon: FlaskConical,
      description: "Gestionar montajes activos y registrar resultados",
    },
    {
      id: "nuevo",
      title: "Nuevo Montaje",
      icon: Plus,
      description: "Crear un nuevo montaje de eficacia",
    },
    {
      id: "calculo",
      title: "Cálculo de Eficacia",
      icon: Calculator,
      description: "Calcular eficacia de montajes completados",
    },
    {
      id: "informes",
      title: "Informes",
      icon: FileText,
      description: "Generar informes de montajes completados",
    },
  ]

  const handleTestsSelected = (tests) => {
    setSelectedTests(tests)
    setShowNewMontageForm(true)
  }

  const handleMontageCreated = (montage) => {
    setShowNewMontageForm(false)
    setSelectedTests([])
    // Aquí se guardaría el montaje en la base de datos
    console.log("Montaje creado:", montage)
    alert("Montaje creado exitosamente")
  }

  const handleGenerateReport = (selectedCompletedTests) => {
    console.log("Generando informe para:", selectedCompletedTests)
    alert(`Generando informe DOCX para ${selectedCompletedTests.length} montaje(s)`)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2"></div>

      {/* Tabs principales */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-6">
            {/* Update the TabsList className to occupy the full width */}
            <TabsList className="grid w-full grid-cols-4">
              {tabs.map((tab) => (
                <TabsTrigger key={tab.id} value={tab.id} className="flex items-center gap-2">
                  {tab.icon && <tab.icon className="h-4 w-4" />}
                  <span className="hidden sm:inline">{tab.title}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </CardContent>
        </Card>

        {/* Contenido de cada sección */}
        <TabsContent value="montajes" className="space-y-6">
          <MontagesInProgressTable />
        </TabsContent>

        <TabsContent value="nuevo" className="space-y-6">
          {!showNewMontageForm ? (
            <TestSelectionTable onTestsSelected={handleTestsSelected} />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Configuración del Nuevo Montaje</CardTitle>
                <CardDescription>
                  Configure los parámetros para el montaje con las pruebas seleccionadas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <h4 className="text-sm font-medium mb-2">Pruebas Seleccionadas:</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedTests.map((test) => (
                      <Badge key={test.id} variant="secondary">
                        {test.prueba} - {test.producto}
                      </Badge>
                    ))}
                  </div>
                </div>
                <MontageSetupForm
                  selectedTests={selectedTests}
                  onMontageCreated={handleMontageCreated}
                  onBack={() => setShowNewMontageForm(false)}
                />
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="calculo" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Cálculo de Eficacia</CardTitle>
              <CardDescription>
                Seleccione un montaje completado para calcular su eficacia. Los montajes deben tener todas sus lecturas
                registradas.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Calculator className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Esta sección estará disponible cuando tenga montajes con todas las lecturas completadas.</p>
                <p className="text-sm mt-2">
                  Complete el registro de resultados en la sección "Montajes en Curso" para habilitar el cálculo.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="informes" className="space-y-6">
          <CompletedTestsTable onGenerateReport={handleGenerateReport} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
