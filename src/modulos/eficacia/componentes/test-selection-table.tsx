import { useMemo, useState, useEffect } from "react";
import {
  MaterialReactTable,
  useMaterialReactTable,
  type MRT_ColumnDef,
  type MRT_RowSelectionState,
} from "material-react-table";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, RefreshCw, Info } from "lucide-react";
import type { EfficacyTestData } from "../tipos/index";
import {
  getEfficacyTestsForMontage,
  getEfficacyTestsStats,
} from "../servicios/index";

interface TestSelectionTableProps {
  onTestsSelected: (tests: EfficacyTestData[]) => void;
  rowSelection: MRT_RowSelectionState;
  onRowSelectionChange: (selection: MRT_RowSelectionState) => void;
}

export function TestSelectionTable({
  onTestsSelected,
  rowSelection: externalRowSelection,
  onRowSelectionChange: externalOnRowSelectionChange,
}: TestSelectionTableProps) {
  const [data, setData] = useState<EfficacyTestData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalPruebas: 0,
    pruebasDisponibles: 0,
    pruebasEnMontajes: 0,
  });

  // Función para cargar datos
  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [pruebasData, statsData] = await Promise.all([
        getEfficacyTestsForMontage(),
        getEfficacyTestsStats(),
      ]);

      setData(pruebasData);
      setStats(statsData);
    } catch (err) {
      console.error("Error al cargar pruebas:", err);
      setError("Error al cargar las pruebas. Por favor, intente de nuevo.");
      setData([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Cargar datos al montar el componente
  useEffect(() => {
    loadData();
  }, []);

  // Usar props externas si están disponibles, sino usar estado interno
  const rowSelection = externalRowSelection;
  const setRowSelection = (
    updaterOrValue:
      | MRT_RowSelectionState
      | ((old: MRT_RowSelectionState) => MRT_RowSelectionState)
  ) => {
    if (typeof updaterOrValue === "function") {
      externalOnRowSelectionChange(updaterOrValue(rowSelection));
    } else {
      externalOnRowSelectionChange(updaterOrValue);
    }
  };

  const columns = useMemo<MRT_ColumnDef<EfficacyTestData>[]>(
    () => [
      {
        accessorKey: "ot",
        header: "OT",
        size: 120,
      },
      {
        accessorKey: "prueba",
        header: "Prueba",
        size: 100,
      },
      {
        accessorKey: "finca",
        header: "Finca",
        size: 150,
      },
      {
        accessorKey: "objetivo",
        header: "Objetivo",
        size: 150,
      },
      {
        accessorKey: "producto",
        header: "Producto",
        size: 130,
      },
      {
        accessorKey: "dosis",
        header: "Dosis",
        size: 80,
      },
      {
        accessorKey: "unidades",
        header: "Unidades",
        size: 80,
      },
      {
        accessorKey: "especieVegetal",
        header: "Especie Vegetal",
        size: 130,
      },
      {
        accessorKey: "fechaIngreso",
        header: "Fecha Ingreso",
        size: 130,
        Cell: ({ cell }) => {
          const fecha = cell.getValue<string>();
          if (!fecha) return "-";
          return new Date(fecha).toLocaleDateString("es-ES");
        },
      },
      {
        accessorKey: "estado",
        header: "Estado",
        size: 120,
        Cell: ({ cell }) => {
          const estado = cell.getValue<string>();
          return (
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {estado}
            </span>
          );
        },
      },
    ],
    []
  );

  // Validar selección: mismo OT, objetivo y especie vegetal
  const validateSelection = (selectedRows: EfficacyTestData[]) => {
    if (selectedRows.length === 0) return true;

    const firstRow = selectedRows[0];
    return selectedRows.every(
      (row) =>
        row.ot === firstRow.ot &&
        row.objetivo === firstRow.objetivo &&
        row.especieVegetal === firstRow.especieVegetal
    );
  };

  const selectedTests = Object.keys(rowSelection)
    .map((pruebaId) => data?.find((test) => test.id.toString() === pruebaId))
    .filter((test): test is EfficacyTestData => test !== undefined);
  const isValidSelection = validateSelection(selectedTests);

  // Configurar la tabla (siempre ejecutar este hook)
  const table = useMaterialReactTable({
    columns,
    data: data || [],
    enableRowSelection: true,
    enableMultiRowSelection: true,
    onRowSelectionChange: setRowSelection,
    state: {
      rowSelection,
    },
    getRowId: (row) => row.id.toString(),
    muiTableContainerProps: {
      sx: {
        minHeight: "400px",
      },
    },
    muiTableHeadCellProps: {
      sx: {
        fontWeight: "bold",
        fontSize: "0.875rem",
      },
    },
    muiTableBodyCellProps: {
      sx: {
        fontSize: "0.8125rem",
      },
    },
    initialState: {
      pagination: {
        pageSize: 10,
        pageIndex: 0,
      },
      density: "compact",
    },
  });

  const handleContinue = () => {
    if (isValidSelection && selectedTests.length > 0) {
      onTestsSelected(selectedTests);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <CardDescription>
              Seleccione las pruebas que desea incluir en el montaje de
              eficacia. Las pruebas deben ser del mismo OT, objetivo y especie
              vegetal.
            </CardDescription>

            {/* Estadísticas de pruebas */}
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Info className="h-4 w-4" />
                <span>
                  Disponibles:{" "}
                  <strong className="text-green-600">
                    {stats.pruebasDisponibles}
                  </strong>
                </span>
              </div>
              <div className="flex items-center gap-1">
                <span>
                  En montajes:{" "}
                  <strong className="text-blue-600">
                    {stats.pruebasEnMontajes}
                  </strong>
                </span>
              </div>
              <div className="flex items-center gap-1">
                <span>
                  Total:{" "}
                  <strong className="text-gray-600">
                    {stats.totalPruebas}
                  </strong>
                </span>
              </div>
            </div>
          </div>

          <Button
            onClick={loadData}
            variant="outline"
            size="sm"
            disabled={isLoading}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
            />
            Actualizar
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {error ? (
          <div className="text-center py-8">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={loadData} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Reintentar
            </Button>
          </div>
        ) : data.length === 0 && !isLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No hay pruebas disponibles para crear montajes.</p>
            <p className="text-sm mt-2">
              {stats.pruebasEnMontajes > 0
                ? `Todas las ${stats.totalPruebas} pruebas ya están asignadas a montajes existentes.`
                : "No hay pruebas de eficacia en curso en el sistema."}
            </p>
          </div>
        ) : (
          <div className="rounded-lg border">
            <MaterialReactTable table={table} />
          </div>
        )}

        {selectedTests.length > 0 && (
          <div className="space-y-4">
            {selectedTests.length > 0 && isValidSelection && (
              <div className="space-y-3">
                {/* Información de control del montaje */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <h4 className="text-sm font-semibold text-blue-800 mb-2">
                    Criterios de Agrupación del Montaje
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
                    <div>
                      <span className="font-medium text-blue-700">OT:</span>{" "}
                      <span className="text-blue-600">
                        {selectedTests[0]?.ot}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-blue-700">
                        Objetivo:
                      </span>{" "}
                      <span className="text-blue-600">
                        {selectedTests[0]?.objetivo}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-blue-700">
                        Especie:
                      </span>{" "}
                      <span className="text-blue-600">
                        {selectedTests[0]?.especieVegetal}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Resumen de pruebas seleccionadas */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                  <h4 className="text-sm font-semibold text-gray-800 mb-2">
                    Pruebas Seleccionadas ({selectedTests.length})
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {selectedTests.map((test, index) => (
                      <div
                        key={test.id}
                        className="flex items-center justify-between bg-white rounded border p-2"
                      >
                        <div className="flex-1">
                          <div className="font-medium text-sm">
                            Prueba {test.prueba}
                          </div>
                          <div className="text-xs text-gray-600">
                            {test.producto} - {test.dosis} {test.unidades}
                          </div>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {test.finca}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div>
                <p className="text-sm font-medium">
                  {selectedTests.length} prueba(s) seleccionada(s)
                </p>
                {!isValidSelection && (
                  <p className="text-sm text-red-600">
                    Error: Las pruebas deben ser del mismo OT, objetivo y
                    especie vegetal
                  </p>
                )}
              </div>
              <Button
                onClick={handleContinue}
                disabled={!isValidSelection || selectedTests.length === 0}
              >
                Continuar con Montaje
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
