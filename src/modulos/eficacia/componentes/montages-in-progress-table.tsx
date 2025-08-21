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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Edit,
  Eye,
  Calculator,
  RefreshCw,
  Trash2,
  Settings,
  User,
} from "lucide-react";
import { ResultsEntryModal } from "./results-entry-modal";
import { EfficacyCalculationModal } from "./efficacy-calculation-modal";
import { MontageSetupForm } from "./montage-setup-form";
import { MontageDetailsModal } from "./montage-details-modal";
import type { MontageInProgress } from "../tipos/index";
import {
  getMontajes,
  deleteMontaje,
  updateMontajeAssignment,
} from "../servicios/index";

interface MontagesInProgressTableProps {
  onMontageConfigured?: () => void;
}

export function MontagesInProgressTable({
  onMontageConfigured,
}: MontagesInProgressTableProps) {
  const [selectedMontage, setSelectedMontage] =
    useState<MontageInProgress | null>(null);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [showCalculationModal, setShowCalculationModal] = useState(false);
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [montages, setMontages] = useState<MontageInProgress[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Lista de personas disponibles para asignación
  const personasDisponibles = [
    "María González",
    "Carlos Rodríguez",
    "Ana Martínez",
    "Luis Fernández",
    "Carmen López",
    "José García",
    "Laura Sánchez",
    "Miguel Torres",
  ];

  // Función para cargar montajes
  const loadMontages = async (updateSelectedMontage = false) => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getMontajes();
      setMontages(data as MontageInProgress[]);

      // Si hay un montaje seleccionado y se solicita actualizar, buscarlo en los nuevos datos
      if (updateSelectedMontage && selectedMontage) {
        const updatedMontage = (data as MontageInProgress[]).find(
          (m) => m.id === selectedMontage.id
        );
        if (updatedMontage) {
          setSelectedMontage(updatedMontage);
        }
      }
    } catch (err) {
      console.error("Error al cargar montajes:", err);
      setError("Error al cargar los montajes. Por favor, intente de nuevo.");
      setMontages([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Función para actualizar la asignación de un montaje
  const handleAssignmentChange = async (
    montageId: string,
    persona: string | null
  ) => {
    try {
      // Actualizar el estado local inmediatamente para mejor UX
      setMontages((prevMontages) =>
        prevMontages.map((montage) =>
          montage.id === montageId
            ? { ...montage, asignadoA: persona }
            : montage
        )
      );

      // Llamar a la API para actualizar en la base de datos
      const result = await updateMontajeAssignment(
        parseInt(montageId),
        persona
      );

      if (!result.success) {
        // Revertir el cambio en caso de error
        await loadMontages();
        alert(`Error al actualizar la asignación: ${result.error}`);
      }
    } catch (error) {
      console.error("Error al actualizar asignación:", error);
      // Revertir el cambio en caso de error
      await loadMontages();
      alert("Error al actualizar la asignación. Por favor, intente de nuevo.");
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
        await loadMontages(); // Recargar la lista (sin actualizar selectedMontage porque fue eliminado)
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
        filterFn: "contains",
        Cell: ({ cell }) => {
          const pruebas = cell.getValue<string[]>();
          return (
            <div className="flex flex-wrap gap-1">
              {pruebas.map((prueba, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {prueba}
                </Badge>
              ))}
            </div>
          );
        },
      },
      {
        accessorKey: "progreso",
        header: "Progreso",
        size: 150,
        enableColumnFilter: false,
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
        accessorKey: "ultimaLectura",
        header: "Última Lectura",
        size: 150,
        Cell: ({ cell }) => {
          const ultimaLectura = cell.getValue<string | null>();
          return (
            <div className="text-sm">
              {ultimaLectura || (
                <span className="text-muted-foreground italic">
                  Sin lecturas
                </span>
              )}
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
                estado === "Listo para Cálculo"
                  ? "default"
                  : estado === "Sin Configurar"
                  ? "destructive"
                  : estado === "Eficacia guardada"
                  ? "default"
                  : "secondary"
              }
              className={
                estado === "Listo para Cálculo"
                  ? "bg-green-100 text-green-800"
                  : estado === "Sin Configurar"
                  ? "bg-orange-100 text-orange-800"
                  : estado === "Eficacia guardada"
                  ? "bg-blue-100 text-blue-800"
                  : ""
              }
            >
              {estado}
            </Badge>
          );
        },
      },
      {
        accessorKey: "asignadoA",
        header: "Asignado a",
        size: 180,
        enableColumnFilter: false,
        Cell: ({ row }) => {
          const montage = row.original;
          return (
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <Select
                value={montage.asignadoA || ""}
                onValueChange={(value) => {
                  const persona = value === "sin-asignar" ? null : value;
                  handleAssignmentChange(montage.id, persona);
                }}
              >
                <SelectTrigger className="w-full h-8 text-xs">
                  <SelectValue placeholder="Sin asignar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sin-asignar" className="text-xs">
                    <span className="text-muted-foreground italic">
                      Sin asignar
                    </span>
                  </SelectItem>
                  {personasDisponibles.map((persona) => (
                    <SelectItem
                      key={persona}
                      value={persona}
                      className="text-xs"
                    >
                      {persona}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
        {/* Botón Configurar - Solo para montajes sin configurar */}
        {!row.original.configurado && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setSelectedMontage(row.original);
              setShowSetupModal(true);
            }}
            className="h-8 w-8 p-0 text-orange-600 hover:text-orange-700 hover:bg-orange-50"
            title="Configurar montaje"
          >
            <Settings className="h-3 w-3" />
          </Button>
        )}

        {/* Botón Registrar resultados - Solo para montajes configurados */}
        {row.original.configurado && (
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
        )}

        {/* Botón Calcular eficacia - Solo para montajes listos para cálculo */}
        {(row.original.estado === "Listo para Cálculo" ||
          row.original.estado === "Eficacia guardada") && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setSelectedMontage(row.original);
              setShowCalculationModal(true);
            }}
            className="h-8 w-8 p-0"
            title={
              row.original.estado === "Eficacia guardada"
                ? "Ver/Recalcular eficacia"
                : "Calcular eficacia"
            }
          >
            <Calculator className="h-3 w-3" />
          </Button>
        )}

        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            setSelectedMontage(row.original);
            setShowDetailsModal(true);
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
            <Button onClick={() => loadMontages()} variant="outline">
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
              onClick={() => loadMontages()}
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
            loadMontages(true);
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
            loadMontages(true);
          }}
        />
      )}

      {/* Modal para configuración de montaje */}
      {selectedMontage && (
        <div
          className={`fixed inset-0 z-50 ${
            showSetupModal ? "flex" : "hidden"
          } items-center justify-center bg-black/50`}
          onClick={(e) => {
            // Cerrar modal si se hace clic en el overlay (fuera del contenido)
            if (e.target === e.currentTarget) {
              setShowSetupModal(false);
            }
          }}
        >
          <div
            className="bg-white rounded-lg shadow-lg max-w-[85vw] w-[85vw] h-[96vh] max-h-[96vh] sm:max-w-[96vw] md:max-w-[96vw] lg:max-w-[96vw] xl:max-w-[96vw] overflow-hidden"
            onClick={(e) => e.stopPropagation()} // Evitar que se cierre al hacer clic dentro del modal
          >
            <div className="h-full w-full overflow-y-auto">
              <div className="bg-white border-b border-gray-200 px-8 py-4 sticky top-0 z-10">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-semibold text-gray-900">
                    Configurar Montaje: {selectedMontage.nombreMontaje}
                  </h2>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowSetupModal(false)}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
              <div className="p-8">
                <MontageSetupForm
                  key={selectedMontage.id}
                  onMontageCreated={() => {
                    setShowSetupModal(false);
                    loadMontages(true);
                    onMontageConfigured?.();
                  }}
                  montajeExistente={selectedMontage}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal para detalles del montaje */}
      {selectedMontage && (
        <div
          className={`fixed inset-0 z-50 ${
            showDetailsModal ? "flex" : "hidden"
          } items-center justify-center bg-black/50`}
          onClick={(e) => {
            // Cerrar modal si se hace clic en el overlay (fuera del contenido)
            if (e.target === e.currentTarget) {
              setShowDetailsModal(false);
            }
          }}
        >
          <div
            className="bg-white rounded-lg shadow-lg max-w-[85vw] w-[85vw] h-[96vh] max-h-[96vh] sm:max-w-[96vw] md:max-w-[96vw] lg:max-w-[96vw] xl:max-w-[96vw] overflow-hidden"
            onClick={(e) => e.stopPropagation()} // Evitar que se cierre al hacer clic dentro del modal
          >
            <div className="h-full w-full overflow-y-auto">
              <div className="bg-white border-b border-gray-200 px-8 py-4 sticky top-0 z-10">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-semibold text-gray-900">
                    Detalles del Montaje: {selectedMontage.nombreMontaje}
                  </h2>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowDetailsModal(false)}
                  >
                    Cerrar
                  </Button>
                </div>
              </div>
              <div className="p-8">
                <MontageDetailsModal
                  key={selectedMontage.id}
                  montage={selectedMontage}
                  onDetailsUpdated={() => {
                    // Recargar montajes después de actualizar detalles y actualizar selectedMontage
                    // No cerramos el modal para que el usuario vea los cambios aplicados
                    loadMontages(true);
                  }}
                  onClose={() => setShowDetailsModal(false)}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
