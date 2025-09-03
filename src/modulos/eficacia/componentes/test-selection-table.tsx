import { useMemo, useState, useEffect } from "react";
import {
  MaterialReactTable,
  useMaterialReactTable,
  type MRT_ColumnDef,
  type MRT_RowSelectionState,
  type MRT_ColumnFiltersState,
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
  onCreateBasicMontage: (tests: EfficacyTestData[]) => void; // Pasar pruebas como parámetro
}

export function TestSelectionTable({
  onTestsSelected,
  rowSelection: externalRowSelection,
  onRowSelectionChange: externalOnRowSelectionChange,
  onCreateBasicMontage,
}: TestSelectionTableProps) {
  const [data, setData] = useState<EfficacyTestData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalPruebas: 0,
    pruebasDisponibles: 0,
    pruebasEnMontajes: 0,
  });
  const [columnFilters, setColumnFilters] = useState<MRT_ColumnFiltersState>(
    []
  );
  const [globalFilter, setGlobalFilter] = useState<string>("");

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

  // Función para aplicar filtros manualmente
  const applyFilters = (data: EfficacyTestData[], excludeColumn?: string) => {
    let filteredData = [...data];

    // Aplicar filtro global
    if (globalFilter) {
      filteredData = filteredData.filter((item) =>
        Object.values(item).some((value) =>
          value?.toString().toLowerCase().includes(globalFilter.toLowerCase())
        )
      );
    }

    // Aplicar filtros de columna (excepto la excluida)
    columnFilters.forEach((filter) => {
      if (filter.id !== excludeColumn && filter.value) {
        filteredData = filteredData.filter((item) => {
          const cellValue = item[filter.id as keyof EfficacyTestData];
          return cellValue?.toString() === filter.value;
        });
      }
    });

    return filteredData;
  };

  // Obtener valores únicos para los filtros select basados en datos filtrados
  const uniqueOTs = useMemo(() => {
    const filteredData = applyFilters(data, "ot");
    const values = Array.from(
      new Set(filteredData.map((item) => item.ot?.toString()).filter(Boolean))
    );
    return values.sort((a, b) => a.localeCompare(b, "es", { numeric: true }));
  }, [data, columnFilters, globalFilter]);

  const uniqueObjetivos = useMemo(() => {
    const filteredData = applyFilters(data, "objetivo");
    const values = Array.from(
      new Set(filteredData.map((item) => item.objetivo).filter(Boolean))
    );
    return values.sort((a, b) => a.localeCompare(b, "es"));
  }, [data, columnFilters, globalFilter]);

  const uniqueEspecies = useMemo(() => {
    const filteredData = applyFilters(data, "especieVegetal");
    const values = Array.from(
      new Set(filteredData.map((item) => item.especieVegetal).filter(Boolean))
    );
    return values.sort((a, b) => a.localeCompare(b, "es"));
  }, [data, columnFilters, globalFilter]);

  const columns = useMemo<MRT_ColumnDef<EfficacyTestData>[]>(
    () => [
      {
        accessorKey: "ot",
        header: "OT",
        size: 100,
        minSize: 100,
        maxSize: 100,
        enableColumnFilter: true,
        filterFn: "equals",
        filterVariant: "select",
        filterSelectOptions: uniqueOTs.map((ot) => ({ text: ot, value: ot })),
      },
      {
        accessorKey: "objetivo",
        header: "Objetivo",
        size: 200,
        enableColumnFilter: true,
        filterFn: "equals",
        filterVariant: "select",
        filterSelectOptions: uniqueObjetivos.map((obj) => ({
          text: obj,
          value: obj,
        })),
      },
      {
        accessorKey: "especieVegetal",
        header: "Especie Vegetal",
        size: 140,
        minSize: 140,
        maxSize: 140,
        enableColumnFilter: true,
        filterFn: "equals",
        filterVariant: "select",
        filterSelectOptions: uniqueEspecies.map((esp) => ({
          text: esp,
          value: esp,
        })),
      },
      {
        accessorKey: "prueba",
        header: "Prueba",
        size: 100,
      },
      {
        accessorKey: "finca",
        header: "Finca",
        size: 100,
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
            <span className="px-2 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
              {estado}
            </span>
          );
        },
      },
    ],
    [uniqueOTs, uniqueObjetivos, uniqueEspecies]
  );

  // Validar selección: mismo objetivo, especie vegetal y finca (sin restricción de OT)
  const validateSelection = (selectedRows: EfficacyTestData[]) => {
    if (selectedRows.length === 0) return true;

    const firstRow = selectedRows[0];
    return selectedRows.every(
      (row) =>
        row.objetivo === firstRow.objetivo &&
        row.especieVegetal === firstRow.especieVegetal &&
        row.finca === firstRow.finca
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
    enableColumnFilters: true,
    enableGlobalFilter: true,
    onRowSelectionChange: setRowSelection,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    state: {
      rowSelection,
      columnFilters,
      globalFilter,
    },
    getRowId: (row) => row.id.toString(),
    muiTableContainerProps: {
      sx: {
        minHeight: "400px",
      },
    },
    muiTableProps: {
      sx: {
        tableLayout: "fixed",
      },
    },
    muiTableHeadCellProps: {
      sx: {
        fontWeight: "bold",
        fontSize: "1rem",
      },
    },
    muiTableBodyCellProps: {
      sx: {
        fontSize: "0.95rem",
      },
    },
    initialState: {
      pagination: {
        pageSize: 10,
        pageIndex: 0,
      },
      density: "compact",
      showColumnFilters: true,
    },
    muiFilterTextFieldProps: {
      size: "small",
      variant: "outlined",
      sx: {
        minWidth: "100px",
      },
    },
  });

  const handleContinue = () => {
    if (isValidSelection && selectedTests.length > 0) {
      // Actualizar la selección de pruebas y crear montaje básico
      onTestsSelected(selectedTests);
      onCreateBasicMontage(selectedTests);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <CardDescription>
              Seleccione las pruebas que desea incluir en el montaje de
              eficacia. Las pruebas deben ser del mismo objetivo, especie
              vegetal y finca.
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
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 text-sm">
                    <div>
                      <span className="font-medium text-blue-700">OT:</span>{" "}
                      <span className="text-blue-600">
                        {selectedTests.length > 1 &&
                        selectedTests.every(
                          (test) => test.ot === selectedTests[0].ot
                        )
                          ? selectedTests[0]?.ot
                          : selectedTests
                              .map((test) => test.ot)
                              .filter(
                                (ot, index, self) => self.indexOf(ot) === index
                              )
                              .join(", ")}
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
                    <div>
                      <span className="font-medium text-blue-700">Finca:</span>{" "}
                      <span className="text-blue-600">
                        {selectedTests[0]?.finca}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Resumen de pruebas seleccionadas */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                  <h4 className="text-base font-semibold text-gray-800 mb-2">
                    Pruebas Seleccionadas ({selectedTests.length})
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {selectedTests.map((test) => (
                      <div
                        key={test.id}
                        className="flex items-center justify-between bg-white rounded border p-2"
                      >
                        <div className="flex-1">
                          <div className="font-medium text-base">
                            Prueba {test.ot}-{test.prueba}
                          </div>
                          <div className="text-sm text-gray-600">
                            {test.producto} - {test.dosis} {test.unidades}
                          </div>
                        </div>
                        <Badge variant="outline" className="text-sm">
                          Finca: {test.finca}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div>
                <p className="text-base font-medium">
                  {selectedTests.length} prueba(s) seleccionada(s)
                </p>
                {!isValidSelection && (
                  <p className="text-base text-red-600">
                    Error: Las pruebas deben ser del mismo objetivo, especie
                    vegetal y finca
                  </p>
                )}
              </div>
              <Button
                onClick={handleContinue}
                disabled={!isValidSelection || selectedTests.length === 0}
              >
                Crear Montaje
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
