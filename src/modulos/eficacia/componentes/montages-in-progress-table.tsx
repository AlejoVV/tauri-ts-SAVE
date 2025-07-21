import { useMemo, useState, useEffect } from "react";
import {
  MaterialReactTable,
  useMaterialReactTable,
  type MRT_ColumnDef,
} from "material-react-table";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Edit, Eye, Calculator, RefreshCw, Trash2 } from "lucide-react";
import { ResultsEntryModal } from "./results-entry-modal";
import { EfficacyCalculationModal } from "./efficacy-calculation-modal";
import type { MontageInProgress } from "../tipos/index";
import { getMontajes, deleteMontaje } from "../servicios/index";

export function MontagesInProgressTable() {
  const [selectedMontage, setSelectedMontage] =
    useState<MontageInProgress | null>(null);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [showCalculationModal, setShowCalculationModal] = useState(false);
  const [montages, setMontages] = useState<MontageInProgress[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Función para cargar montajes
  const loadMontages = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getMontajes();
      setMontages(data as MontageInProgress[]);
    } catch (err) {
      console.error("Error al cargar montajes:", err);
      setError("Error al cargar los montajes. Por favor, intente de nuevo.");
      setMontages([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Función para eliminar montaje
  const handleDeleteMontage = async (montage: MontageInProgress) => {
    const confirmDelete = window.confirm(
      `¿Está seguro de que desea eliminar el montaje "${montage.nombreMontaje}"?\n\nEsta acción eliminará:\n- El montaje y toda su configuración\n- Todas las lecturas registradas\n- Todos los cálculos de eficacia\n\nEsta acción NO se puede deshacer.`
    );

    if (!confirmDelete) return;

    try {
      setIsLoading(true);
      const result = await deleteMontaje(parseInt(montage.id));

      if (result.success) {
        alert("Montaje eliminado exitosamente");
        await loadMontages(); // Recargar la lista
      } else {
        alert(`Error al eliminar el montaje: ${result.error}`);
      }
    } catch (error) {
      console.error("Error al eliminar montaje:", error);
      alert("Error inesperado al eliminar el montaje");
    } finally {
      setIsLoading(false);
    }
  };

  // Cargar montajes al montar el componente
  useEffect(() => {
    loadMontages();
  }, []);

  const columns = useMemo<MRT_ColumnDef<MontageInProgress>[]>(
    () => [
      {
        accessorKey: "numeroMontaje",
        header: "Número",
        size: 100,
      },
      {
        accessorKey: "nombreMontaje",
        header: "Nombre del Montaje",
        size: 200,
      },
      {
        accessorKey: "ot",
        header: "OT",
        size: 100,
      },
      {
        accessorKey: "objetivo",
        header: "Objetivo",
        size: 150,
      },
      {
        accessorKey: "pruebas",
        header: "Pruebas",
        size: 120,
        Cell: ({ cell }) => {
          const pruebas = cell.getValue<string[]>();
          return (
            <div className="flex flex-wrap gap-1">
              {pruebas.slice(0, 2).map((prueba, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {prueba}
                </Badge>
              ))}
              {pruebas.length > 2 && (
                <Badge variant="outline" className="text-xs">
                  +{pruebas.length - 2}
                </Badge>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "productos",
        header: "Productos",
        size: 150,
        Cell: ({ cell }) => {
          const productos = cell.getValue<string[]>();
          const uniqueProducts = [...new Set(productos)]; // Eliminar duplicados
          return (
            <div className="flex flex-wrap gap-1">
              {uniqueProducts.slice(0, 2).map((producto, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {producto.length > 15
                    ? `${producto.substring(0, 15)}...`
                    : producto}
                </Badge>
              ))}
              {uniqueProducts.length > 2 && (
                <Badge variant="secondary" className="text-xs">
                  +{uniqueProducts.length - 2}
                </Badge>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "progreso",
        header: "Progreso",
        size: 150,
        Cell: ({ row }) => {
          const lecturasCompletadas = row.original.lecturasCompletadas;
          const totalLecturas = row.original.numeroLecturas;
          const porcentaje =
            totalLecturas > 0 ? (lecturasCompletadas / totalLecturas) * 100 : 0;

          return (
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span>
                  {lecturasCompletadas}/{totalLecturas} lecturas
                </span>
                <span>{Math.round(porcentaje)}%</span>
              </div>
              <Progress value={porcentaje} className="h-2" />
            </div>
          );
        },
      },
      {
        accessorKey: "fechaCreacion",
        header: "Fecha Creación",
        size: 120,
      },
      {
        accessorKey: "estado",
        header: "Estado",
        size: 150,
        Cell: ({ cell }) => {
          const estado = cell.getValue<string>();
          return (
            <Badge
              variant={
                estado === "Listo para Cálculo" ? "default" : "secondary"
              }
              className={
                estado === "Listo para Cálculo"
                  ? "bg-green-100 text-green-800"
                  : ""
              }
            >
              {estado}
            </Badge>
          );
        },
      },
    ],
    []
  );

  const table = useMaterialReactTable({
    columns,
    data: montages,
    enableRowActions: true,
    positionActionsColumn: "last",
    renderRowActions: ({ row }) => (
      <div className="flex gap-1">
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            setSelectedMontage(row.original);
            setShowResultsModal(true);
          }}
          className="h-8 w-8 p-0"
          title="Registrar resultados"
        >
          <Edit className="h-3 w-3" />
        </Button>

        {row.original.estado === "Listo para Cálculo" && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setSelectedMontage(row.original);
              setShowCalculationModal(true);
            }}
            className="h-8 w-8 p-0"
            title="Calcular eficacia"
          >
            <Calculator className="h-3 w-3" />
          </Button>
        )}

        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            setSelectedMontage(row.original);
            // Aquí se abriría un modal de vista detallada
            console.log("Ver detalles:", row.original);
          }}
          className="h-8 w-8 p-0"
          title="Ver detalles"
        >
          <Eye className="h-3 w-3" />
        </Button>

        <Button
          size="sm"
          variant="outline"
          onClick={() => handleDeleteMontage(row.original)}
          className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
          title="Eliminar montaje"
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    ),
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
    state: {
      isLoading,
    },
  });

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardDescription>
            Gestione los montajes activos, registre resultados de lecturas y
            calcule eficacia cuando estén completos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={loadMontages} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Reintentar
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardDescription>
              Gestione los montajes activos, registre resultados de lecturas y
              calcule eficacia cuando estén completos
            </CardDescription>
            <Button
              onClick={loadMontages}
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
        <CardContent>
          {montages.length === 0 && !isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No hay montajes disponibles.</p>
              <p className="text-sm mt-2">
                Cree un nuevo montaje en la pestaña "Nuevo Montaje" para
                comenzar.
              </p>
            </div>
          ) : (
            <div className="rounded-lg border">
              <MaterialReactTable table={table} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal para registro de resultados */}
      {selectedMontage && (
        <ResultsEntryModal
          open={showResultsModal}
          onOpenChange={setShowResultsModal}
          montage={selectedMontage}
          onResultsSaved={() => {
            setShowResultsModal(false);
            // Recargar montajes después de guardar resultados
            loadMontages();
          }}
        />
      )}

      {/* Modal para cálculo de eficacia */}
      {selectedMontage && (
        <EfficacyCalculationModal
          open={showCalculationModal}
          onOpenChange={setShowCalculationModal}
          montage={selectedMontage}
          onCalculationComplete={() => {
            setShowCalculationModal(false);
            // Recargar montajes después del cálculo
            loadMontages();
          }}
        />
      )}
    </div>
  );
}
