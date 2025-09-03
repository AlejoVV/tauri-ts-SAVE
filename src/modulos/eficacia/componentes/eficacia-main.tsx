import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { MontagesInProgressTable } from "./montages-in-progress-table";
import { TestSelectionTable } from "./test-selection-table";
import { CompletedTestsTable } from "./completed-tests-table";
import { Calculator, FlaskConical, Plus } from "lucide-react";
import type { EfficacyTestData } from "../tipos/index";
import type { MRT_RowSelectionState } from "material-react-table";
import {
  createMontajeBasico,
  generatePruebasCompletadasReport,
} from "../servicios/index";
import type { MontajeBasico } from "../tipos/index";

export function EficaciaMain() {
  const [activeTab, setActiveTab] = useState("montajes");
  const [rowSelection, setRowSelection] = useState<MRT_RowSelectionState>({});
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
      description: "Crear nuevos montajes de eficacia",
    },
    {
      id: "completados",
      title: "Pruebas Completadas",
      icon: Calculator,
      description: "Ver pruebas individuales y generar informes",
    },
  ];

  // Función para manejar selección de pruebas desde TestSelectionTable
  const handleTestsSelected = (_tests: EfficacyTestData[]) => {
    // Esta función ya no es necesaria pero se mantiene para compatibilidad
  };

  // Crear montaje básico directamente desde selección de pruebas
  const handleCreateBasicMontage = async (tests: EfficacyTestData[]) => {
    if (tests.length === 0) {
      alert("Debe seleccionar al menos una prueba para crear un montaje");
      return;
    }

    try {
      const montajeBasico: MontajeBasico = {
        pruebasSeleccionadas: tests,
      };

      const result = await createMontajeBasico(montajeBasico);

      if (result.success) {
        // Limpiar estado y mostrar mensaje de éxito
        setRowSelection({});
        setActiveTab("montajes"); // Cambiar a la pestaña de montajes para ver el resultado

        // Forzar actualización de la tabla de selección de pruebas
        setRefreshTestSelection((prev) => prev + 1);

        alert(
          `¡Montaje creado exitosamente!\n\nID: ${result.montajeId}\nNombre: ${result.nombreGenerado}\nPruebas asociadas: ${tests.length}\n\nPuede configurar el montaje desde la tabla de "Montajes en Curso".`
        );
      } else {
        alert(`Error al crear el montaje: ${result.error}`);
      }
    } catch (error) {
      console.error("Error al crear montaje:", error);
      alert(
        "Error inesperado al crear el montaje. Por favor, inténtelo de nuevo."
      );
    }
  };

  const handleGenerateReport = async (selectedCompletedTests: any[]) => {
    if (selectedCompletedTests.length === 0) {
      alert("No hay pruebas seleccionadas para generar el informe");
      return;
    }

    try {
      console.log("Generando informe para:", selectedCompletedTests);
      const result = await generatePruebasCompletadasReport(
        selectedCompletedTests
      );

      if (result.success) {
        alert(
          `¡Informe generado exitosamente!\n\nArchivo: ${result.fileName}\nPruebas incluidas: ${selectedCompletedTests.length}\n\nEl archivo se ha descargado automáticamente.`
        );
      } else {
        alert(`Error al generar el informe: ${result.error}`);
      }
    } catch (error) {
      console.error("Error inesperado al generar informe:", error);
      alert(
        "Error inesperado al generar el informe. Por favor, inténtelo de nuevo."
      );
    }
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
                    <span className="hidden sm:inline text-base">
                      {tab.title}
                    </span>
                  </TabsTrigger>
                ))}
              </TabsList>
            </CardContent>
          </Card>

          {/* Contenido de cada sección */}
          <TabsContent value="montajes" className="space-y-6">
            <MontagesInProgressTable
              onMontageConfigured={() => {
                // Forzar actualización de la tabla de selección de pruebas cuando se configure un montaje
                setRefreshTestSelection((prev) => prev + 1);
              }}
            />
          </TabsContent>

          <TabsContent value="nuevo" className="space-y-6">
            <TestSelectionTable
              key={refreshTestSelection}
              onTestsSelected={handleTestsSelected}
              rowSelection={rowSelection}
              onRowSelectionChange={setRowSelection}
              onCreateBasicMontage={handleCreateBasicMontage}
            />
          </TabsContent>

          <TabsContent value="completados" className="space-y-6">
            <CompletedTestsTable onGenerateReport={handleGenerateReport} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
