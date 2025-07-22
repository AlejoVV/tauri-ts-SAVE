import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { CardDescription } from "@/components/ui/card";
import { CardTitle } from "@/components/ui/card";
import { CardHeader } from "@/components/ui/card";
import { CardContent } from "@/components/ui/card";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { MontagesInProgressTable } from "./montages-in-progress-table";
import { TestSelectionTable } from "./test-selection-table";
import { MontageSetupForm } from "./montage-setup-form";
import { CompletedTestsTable } from "./completed-tests-table";
import { Calculator, FlaskConical, FileText, Plus } from "lucide-react";
import type { EfficacyTestData, MontageData } from "../tipos/index";
import type { MRT_RowSelectionState } from "material-react-table";
import { createMontaje } from "../servicios/index";

export function EficaciaMain() {
  const [selectedTests, setSelectedTests] = useState<EfficacyTestData[]>([]);
  const [showNewMontageForm, setShowNewMontageForm] = useState(false);
  const [activeTab, setActiveTab] = useState("montajes");
  const [rowSelection, setRowSelection] = useState<MRT_RowSelectionState>({});
  const [isCreatingMontage, setIsCreatingMontage] = useState(false);
  const [refreshTestSelection, setRefreshTestSelection] = useState(0);

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
  ];

  const handleTestsSelected = (tests: EfficacyTestData[]) => {
    setSelectedTests(tests);
    setShowNewMontageForm(true);
  };

  const handleBackToSelection = () => {
    // Reconstruir rowSelection basado en selectedTests
    const newRowSelection: MRT_RowSelectionState = {};
    selectedTests.forEach((test) => {
      newRowSelection[test.id.toString()] = true;
    });
    setRowSelection(newRowSelection);
    setShowNewMontageForm(false);
  };

  const handleMontageCreated = async (montageData: MontageData) => {
    setIsCreatingMontage(true);

    try {
      const result = await createMontaje(montageData, selectedTests);

      if (result.success) {
        // Limpiar estado y mostrar mensaje de éxito
        setShowNewMontageForm(false);
        setSelectedTests([]);
        setRowSelection({});
        setActiveTab("montajes"); // Cambiar a la pestaña de montajes para ver el resultado

        // Forzar actualización de la tabla de selección de pruebas
        setRefreshTestSelection((prev) => prev + 1);

        alert(
          `¡Montaje creado exitosamente!\n\nID: ${result.montajeId}\nNombre: ${montageData.nombreMontaje}\nPruebas asociadas: ${selectedTests.length}`
        );
      } else {
        alert(`Error al crear el montaje: ${result.error}`);
      }
    } catch (error) {
      console.error("Error al crear montaje:", error);
      alert(
        "Error inesperado al crear el montaje. Por favor, inténtelo de nuevo."
      );
    } finally {
      setIsCreatingMontage(false);
    }
  };

  const handleGenerateReport = (selectedCompletedTests: any[]) => {
    console.log("Generando informe para:", selectedCompletedTests);
    alert(
      `Generando informe DOCX para ${selectedCompletedTests.length} montaje(s)`
    );
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="space-y-1 p-6">
        {/* Header */}
        <div className="space-y-2"></div>

        {/* Tabs principales */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-3"
        >
          <Card>
            <CardContent className="flex flex-col items-center justify-center p-2">
              {/* Update the TabsList className to occupy the full width */}
              <TabsList className="grid w-full grid-cols-4">
                {tabs.map((tab) => (
                  <TabsTrigger
                    key={tab.id}
                    value={tab.id}
                    className="flex items-center gap-2"
                  >
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
              <TestSelectionTable
                key={refreshTestSelection}
                onTestsSelected={handleTestsSelected}
                rowSelection={rowSelection}
                onRowSelectionChange={setRowSelection}
              />
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Configuración del Nuevo Montaje</CardTitle>
                  <CardDescription>
                    Configure los parámetros para el montaje con las pruebas
                    seleccionadas
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <MontageSetupForm
                    selectedTests={selectedTests}
                    onMontageCreated={handleMontageCreated}
                    onBack={handleBackToSelection}
                    isCreatingMontage={isCreatingMontage}
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
                  Seleccione un montaje completado para calcular su eficacia.
                  Los montajes deben tener todas sus lecturas registradas.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <Calculator className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>
                    Esta sección estará disponible cuando tenga montajes con
                    todas las lecturas completadas.
                  </p>
                  <p className="text-sm mt-2">
                    Complete el registro de resultados en la sección "Montajes
                    en Curso" para habilitar el cálculo.
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
    </div>
  );
}
