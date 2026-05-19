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
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Edit, Package, List } from "lucide-react";
import { getPruebasCompletadas } from "../servicios";
import type { CompletedTest } from "../tipos";
import { EfficacyCalculationModal } from "./efficacy-calculation-modal";
import type { MontageInProgress } from "../tipos";

// Tipo para montajes agrupados
interface GroupedMontage {
  id: string;
  nombreMontaje: string;
  ot: string[];
  objetivo: string;
  finca: string[];
  especie: string[];
  compania: string[];
  contacto: string[];
  fechaCreacionMontaje: string;
  fechaCompletado: string;
  numeroLecturas: number;
  numeroRepeticiones: number;
  totalPruebas: number;
  eficaciaPromedio: number;
  eficaciaMinima: number;
  eficaciaMaxima: number;
  pruebas: CompletedTest[];
  pruebasIds: string; // Campo para MaterialReactTable
  estado: "Eficacia guardada";
}

interface CompletedTestsTableProps {
  onGenerateReport: (selectedTests: CompletedTest[]) => void;
}

export function CompletedTestsTable({
  onGenerateReport,
}: CompletedTestsTableProps) {
  const [rowSelection, setRowSelection] = useState<MRT_RowSelectionState>({});
  const [pruebasCompletadas, setPruebasCompletadas] = useState<CompletedTest[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estado para controlar vista agrupada o individual
  const [vistaAgrupada, setVistaAgrupada] = useState(false);

  // Estados para revisión de eficacias
  const [showEditModal, setShowEditModal] = useState(false);
  const [montajeParaRevisar, setMontajeParaRevisar] =
    useState<MontageInProgress | null>(null);
  const [eficaciasEditadas, setEficaciasEditadas] = useState<{
    [pruebaId: string]: number;
  }>({});
  const [montajesDisponibles, setMontajesDisponibles] = useState<{
    [montajeId: string]: CompletedTest[];
  }>({});
  const [montajeActualIndex, setMontajeActualIndex] = useState(0);
  const [montajesParaRevisar, setMontajesParaRevisar] = useState<string[]>([]);

  // Cargar pruebas completadas al montar el componente
  useEffect(() => {
    loadPruebasCompletadas();
  }, []);

  // Limpiar selección al cambiar vista para evitar problemas de estado
  useEffect(() => {
    setRowSelection({});
  }, [vistaAgrupada]);

  const loadPruebasCompletadas = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getPruebasCompletadas();
      setPruebasCompletadas(data as CompletedTest[]);
    } catch (err) {
      console.error("Error al cargar pruebas completadas:", err);
      setError(
        "Error al cargar las pruebas completadas. Por favor, intente de nuevo."
      );
      setPruebasCompletadas([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Función para agrupar pruebas seleccionadas por montaje y abrir modal de revisión
  const handleReviewEfficacies = () => {
    if (selectedTests.length === 0) {
      const tipoSeleccion = vistaAgrupada ? "montaje" : "prueba";
      alert(
        `Seleccione al menos un ${tipoSeleccion} para revisar las eficacias`
      );
      return;
    }

    // En vista agrupada, las pruebas ya están agrupadas por la selección
    // En vista individual, necesitamos agrupar las pruebas seleccionadas
    const pruebasPorMontaje = vistaAgrupada
      ? Object.keys(rowSelection).reduce((acc, key) => {
          const montaje = montajesAgrupados.find((m) => m.id === key);
          if (montaje && montaje.pruebas) {
            acc[montaje.id] = montaje.pruebas;
          }
          return acc;
        }, {} as { [montajeId: string]: CompletedTest[] })
      : selectedTests.reduce((acc, prueba) => {
          const montajeId = prueba.montajeId;
          if (!acc[montajeId]) {
            acc[montajeId] = [];
          }
          acc[montajeId].push(prueba);
          return acc;
        }, {} as { [montajeId: string]: CompletedTest[] });

    setMontajesDisponibles(pruebasPorMontaje);
    setMontajesParaRevisar(Object.keys(pruebasPorMontaje));
    setMontajeActualIndex(0);

    // Inicializar eficacias editadas con valores actuales
    const todasLasPruebas = Object.values(pruebasPorMontaje).flat();
    const eficaciasIniciales = todasLasPruebas.reduce(
      (acc, prueba) => ({
        ...acc,
        [prueba.pruebaId]: prueba.eficacia,
      }),
      {}
    );
    setEficaciasEditadas(eficaciasIniciales);

    // Abrir modal con el primer montaje
    abrirModalParaMontaje(Object.keys(pruebasPorMontaje)[0], pruebasPorMontaje);
  };

  // Función para abrir modal para un montaje específico
  const abrirModalParaMontaje = (
    montajeId: string,
    pruebasPorMontaje: { [montajeId: string]: CompletedTest[] }
  ) => {
    const pruebasDelMontaje = pruebasPorMontaje[montajeId];
    if (!pruebasDelMontaje || pruebasDelMontaje.length === 0) return;

    const primeraSeleccionada = pruebasDelMontaje[0];

    // Construir objeto MontageInProgress para el modal
    const montageData: MontageInProgress = {
      id: montajeId,
      nombreMontaje: primeraSeleccionada.nombreMontaje,
      ot: pruebasDelMontaje
        .map((p) => p.ot)
        .filter((ot, index, arr) => arr.indexOf(ot) === index)
        .join(", "),
      objetivo: primeraSeleccionada.objetivo,
      finca: pruebasDelMontaje
        .map((p) => p.finca)
        .filter((f, index, arr) => arr.indexOf(f) === index)
        .join(", "),
      especie: pruebasDelMontaje
        .map((p) => p.especie)
        .filter((e, index, arr) => arr.indexOf(e) === index)
        .join(", "),
      fechaCreacion: primeraSeleccionada.fechaCreacionMontaje,
      numeroLecturas: primeraSeleccionada.numeroLecturas,
      nombresLecturas: Array.from(
        { length: primeraSeleccionada.numeroLecturas },
        (_, i) => `Lectura ${i + 1}`
      ),
      lecturasCompletadas: primeraSeleccionada.numeroLecturas,
      numeroRepeticiones: primeraSeleccionada.numeroRepeticiones,
      condicionesIniciales: null,
      pruebas: pruebasDelMontaje.map((p) => p.pruebaId),
      productos: pruebasDelMontaje.map((p) => p.producto),
      pruebaToOT: pruebasDelMontaje.reduce(
        (acc, p) => ({ ...acc, [p.pruebaId]: p.ot }),
        {}
      ),
      ultimaLectura: primeraSeleccionada.fechaCompletado,
      estado: "Eficacia guardada",
      ultimaActualizacion: primeraSeleccionada.fechaCompletado,
      configurado: true,
      asignadoA: null,
      variedad: "",
    };

    setMontajeParaRevisar(montageData);
    setShowEditModal(true);
  };

  // Función que se ejecuta cuando se completa la edición de un montaje
  const handleEditComplete = () => {
    setShowEditModal(false);

    // Verificar si hay más montajes por revisar
    if (montajeActualIndex < montajesParaRevisar.length - 1) {
      // Pasar al siguiente montaje
      const siguienteMontajeIndex = montajeActualIndex + 1;
      setMontajeActualIndex(siguienteMontajeIndex);
      const siguienteMontajeId = montajesParaRevisar[siguienteMontajeIndex];
      setTimeout(() => {
        abrirModalParaMontaje(siguienteMontajeId, montajesDisponibles);
      }, 500); // Pequeña pausa para mejor UX
    } else {
      // Ya se revisaron todos los montajes
      alert(
        `¡Revisión completada!\n\nSe han revisado ${montajesParaRevisar.length} montaje(s).\nAhora puede generar el informe con las eficacias revisadas.`
      );
    }
  };

  // Función para actualizar eficacias editadas desde el modal
  const updateEficaciasEditadas = (nuevasEficacias: {
    [pruebaId: string]: number;
  }) => {
    setEficaciasEditadas((prev) => ({
      ...prev,
      ...nuevasEficacias,
    }));
  };

  // Función para agrupar pruebas por montaje
  const montajesAgrupados = useMemo(() => {
    const grupos = pruebasCompletadas.reduce((acc, prueba) => {
      const montajeId = prueba.montajeId;
      if (!acc[montajeId]) {
        acc[montajeId] = {
          id: montajeId,
          nombreMontaje: prueba.nombreMontaje,
          ot: [],
          objetivo: prueba.objetivo,
          finca: [],
          especie: [],
          compania: [],
          contacto: [],
          fechaCreacionMontaje: prueba.fechaCreacionMontaje,
          fechaCompletado: prueba.fechaCompletado,
          numeroLecturas: prueba.numeroLecturas,
          numeroRepeticiones: prueba.numeroRepeticiones,
          totalPruebas: 0,
          eficaciaPromedio: 0,
          eficaciaMinima: 100,
          eficaciaMaxima: 0,
          pruebas: [],
          pruebasIds: "",
          estado: "Eficacia guardada" as const,
        };
      }

      const grupo = acc[montajeId];
      grupo.pruebas.push(prueba);
      grupo.totalPruebas = grupo.pruebas.length;

      // Añadir valores únicos
      if (!grupo.ot.includes(prueba.ot)) grupo.ot.push(prueba.ot);
      if (!grupo.finca.includes(prueba.finca)) grupo.finca.push(prueba.finca);
      if (!grupo.especie.includes(prueba.especie))
        grupo.especie.push(prueba.especie);
      if (!grupo.compania.includes(prueba.compania))
        grupo.compania.push(prueba.compania);
      if (!grupo.contacto.includes(prueba.contacto))
        grupo.contacto.push(prueba.contacto);

      // Actualizar string de IDs de pruebas
      grupo.pruebasIds = grupo.pruebas.map((p) => p.pruebaId).join(", ");

      // Actualizar estadísticas de eficacia
      const eficacias = grupo.pruebas.map((p) =>
        eficaciasEditadas[p.pruebaId] !== undefined
          ? eficaciasEditadas[p.pruebaId]
          : p.eficacia
      );
      grupo.eficaciaPromedio =
        eficacias.reduce((sum, ef) => sum + ef, 0) / eficacias.length;
      grupo.eficaciaMinima = Math.min(...eficacias);
      grupo.eficaciaMaxima = Math.max(...eficacias);

      return acc;
    }, {} as { [montajeId: string]: GroupedMontage });

    return Object.values(grupos);
  }, [pruebasCompletadas, eficaciasEditadas]);

  // Columnas para vista individual (pruebas)
  const columnasIndividuales = useMemo<MRT_ColumnDef<CompletedTest>[]>(
    () => [
      {
        accessorKey: "pruebaId",
        header: "Prueba",
        size: 20,
      },
      {
        accessorKey: "ot",
        header: "OT",
        size: 80,
      },
      {
        accessorKey: "nombreMontaje",
        header: "Montaje",
        size: 120,
      },
      {
        accessorKey: "objetivo",
        header: "Objetivo",
        size: 90,
      },
      {
        accessorKey: "finca",
        header: "Finca",
        size: 80,
      },
      {
        accessorKey: "especie",
        header: "Especie",
        size: 70,
      },
      {
        accessorKey: "producto",
        header: "Producto",
        size: 90,
      },
      {
        accessorKey: "dosis",
        header: "Dosis",
        size: 60,
        Cell: ({ row }) => {
          const dosis = (row.original as CompletedTest).dosis;
          const unidades = (row.original as CompletedTest).unidades;
          return (
            <span className="text-base">
              {dosis} {unidades}
            </span>
          );
        },
      },
      {
        accessorKey: "compania",
        header: "Compañía",
        size: 70,
        muiTableBodyCellProps: {
          sx: {
            whiteSpace: "normal",
            wordBreak: "break-word",
            lineHeight: 1.2,
          },
        },
      },
      {
        accessorKey: "contacto",
        header: "Contacto",
        size: 100,
      },
      {
        accessorKey: "fechaCompletado",
        header: "Fecha Completado",
        size: 90,
        Cell: ({ cell }) => cell.getValue<string>(),
      },
      {
        accessorKey: "eficacia",
        header: "Eficacia (%)",
        size: 80,
        Cell: ({ cell, row }) => {
          const eficacia = cell.getValue<number>();
          const pruebaId = (row.original as CompletedTest).pruebaId;
          const esEditada = eficaciasEditadas[pruebaId] !== undefined;
          const eficaciaFinal = esEditada
            ? eficaciasEditadas[pruebaId]
            : eficacia;

          return (
            <div className="flex items-center gap-1">
              <span
                className={
                  eficaciaFinal >= 80
                    ? "text-green-600 font-bold"
                    : eficaciaFinal >= 60
                    ? "text-yellow-600 font-bold"
                    : "text-red-600 font-bold"
                }
              >
                {eficaciaFinal.toFixed(1)}%
              </span>
              {esEditada && (
                <Badge variant="secondary" className="text-sm px-1 py-0">
                  Editada
                </Badge>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "estado",
        header: "Estado",
        size: 80,
        Cell: ({ cell }) => {
          const estado = cell.getValue<string>();
          return (
            <Badge
              variant="default"
              className="bg-green-100 text-green-800 hover:bg-green-100"
            >
              {estado}
            </Badge>
          );
        },
      },
    ],
    [eficaciasEditadas]
  );

  // Columnas para vista agrupada (montajes)
  const columnasAgrupadas = useMemo<MRT_ColumnDef<GroupedMontage>[]>(
    () => [
      {
        accessorKey: "nombreMontaje",
        header: "Nombre Montaje",
        size: 120,
      },
      {
        accessorKey: "ot",
        header: "OT",
        size: 60,
        Cell: ({ cell }) => {
          const ots = cell.getValue<string[]>();
          return (
            <div className="flex flex-wrap gap-1">
              {ots.slice(0, 2).map((ot, index) => (
                <Badge key={index} variant="outline" className="text-sm">
                  {ot}
                </Badge>
              ))}
              {ots.length > 2 && (
                <Badge variant="outline" className="text-sm">
                  +{ots.length - 2}
                </Badge>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "pruebasIds",
        header: "Pruebas",
        size: 100,
        Cell: ({ row }) => {
          const montaje = row.original as GroupedMontage;
          const pruebasIds = montaje.pruebas.map((p) => p.pruebaId);

          return (
            <div className="flex flex-wrap gap-1">
              {pruebasIds.map((pruebaId, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="text-sm bg-blue-100 text-blue-800"
                >
                  {pruebaId}
                </Badge>
              ))}
            </div>
          );
        },
      },
      {
        accessorKey: "objetivo",
        header: "Objetivo",
        size: 80,
      },
      {
        accessorKey: "finca",
        header: "Finca",
        size: 80,
        Cell: ({ cell }) => {
          const fincas = cell.getValue<string[]>();
          return (
            <div className="flex flex-wrap gap-1">
              {fincas.slice(0, 2).map((finca, index) => (
                <Badge key={index} variant="outline" className="text-sm">
                  {finca}
                </Badge>
              ))}
              {fincas.length > 2 && (
                <Badge variant="outline" className="text-sm">
                  +{fincas.length - 2}
                </Badge>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "especie",
        header: "Especie",
        size: 80,
        Cell: ({ cell }) => {
          const especies = cell.getValue<string[]>();
          return (
            <div className="flex flex-wrap gap-1">
              {especies.slice(0, 2).map((especie, index) => (
                <Badge key={index} variant="secondary" className="text-sm">
                  {especie}
                </Badge>
              ))}
              {especies.length > 2 && (
                <Badge variant="secondary" className="text-sm">
                  +{especies.length - 2}
                </Badge>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "compania",
        header: "Compañía",
        size: 70,
        muiTableBodyCellProps: {
          sx: {
            whiteSpace: "normal",
            wordBreak: "break-word",
            lineHeight: 1.2,
          },
        },
        Cell: ({ cell }) => {
          const companias = cell.getValue<string[]>();
          return (
            <div className="flex flex-wrap gap-1">
              {companias.slice(0, 2).map((compania, index) => (
                <Badge
                  key={index}
                  variant="default"
                  className="text-sm break-words max-w-full"
                  style={{ whiteSpace: "normal", wordBreak: "break-word" }}
                >
                  {compania}
                </Badge>
              ))}
              {companias.length > 2 && (
                <Badge variant="default" className="text-sm">
                  +{companias.length - 2}
                </Badge>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "contacto",
        header: "Contacto",
        size: 90,
        Cell: ({ cell }) => {
          const contactos = cell.getValue<string[]>();
          return (
            <div className="flex flex-wrap gap-1">
              {contactos.slice(0, 2).map((contacto, index) => (
                <Badge key={index} variant="outline" className="text-sm">
                  {contacto}
                </Badge>
              ))}
              {contactos.length > 2 && (
                <Badge variant="outline" className="text-sm">
                  +{contactos.length - 2}
                </Badge>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "fechaCompletado",
        header: "Fecha Completado",
        size: 90,
        Cell: ({ cell }) => cell.getValue<string>(),
      },
      {
        accessorKey: "eficaciaPromedio",
        header: "Eficacia Promedio (%)",
        size: 110,
        Cell: ({ cell, row }) => {
          const eficaciaPromedio = cell.getValue<number>();
          const montaje = row.original as GroupedMontage;
          const tieneEditadas = montaje.pruebas.some(
            (p) => eficaciasEditadas[p.pruebaId] !== undefined
          );

          return (
            <div className="flex flex-col gap-1">
              <span
                className={
                  eficaciaPromedio >= 80
                    ? "text-green-600 font-bold"
                    : eficaciaPromedio >= 60
                    ? "text-yellow-600 font-bold"
                    : "text-red-600 font-bold"
                }
              >
                {eficaciaPromedio.toFixed(1)}%
              </span>
              <span className="text-sm text-muted-foreground">
                {montaje.eficaciaMinima.toFixed(1)}% -{" "}
                {montaje.eficaciaMaxima.toFixed(1)}%
              </span>
              {tieneEditadas && (
                <Badge variant="secondary" className="text-sm px-1 py-0">
                  Revisada
                </Badge>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "estado",
        header: "Estado",
        size: 80,
        Cell: ({ cell }) => {
          const estado = cell.getValue<string>();
          return (
            <Badge
              variant="default"
              className="bg-green-100 text-green-800 hover:bg-green-100"
            >
              {estado}
            </Badge>
          );
        },
      },
    ],
    [eficaciasEditadas]
  );

  // Tabla para vista individual (pruebas)
  const tablaIndividual = useMaterialReactTable({
    columns: columnasIndividuales as any,
    data: pruebasCompletadas,
    enableRowSelection: true,
    enableMultiRowSelection: true,
    onRowSelectionChange: setRowSelection,
    state: {
      rowSelection,
      isLoading,
    },
    getRowId: (row) => row.id,
    muiTableContainerProps: {
      sx: {
        minHeight: "400px",
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
    },
  });

  // Tabla para vista agrupada (montajes)
  const tablaAgrupada = useMaterialReactTable({
    columns: columnasAgrupadas as any,
    data: montajesAgrupados,
    enableRowSelection: true,
    enableMultiRowSelection: true,
    onRowSelectionChange: setRowSelection,
    state: {
      rowSelection,
      isLoading,
    },
    getRowId: (row) => row.id,
    enableColumnOrdering: false,
    enableColumnDragging: false,
    muiTableContainerProps: {
      sx: {
        minHeight: "400px",
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
    },
  });

  // Lógica de selección adaptada al modo de vista
  const selectedTests = vistaAgrupada
    ? Object.keys(rowSelection)
        .map((key) => montajesAgrupados.find((m) => m.id === key))
        .filter((montaje): montaje is GroupedMontage => montaje !== undefined)
        .flatMap((montaje) => montaje.pruebas) // Expandir montajes a sus pruebas
    : Object.keys(rowSelection)
        .map(
          (key) =>
            pruebasCompletadas.find((p) => p.id === key) ||
            pruebasCompletadas[Number.parseInt(key)]
        )
        .filter((prueba): prueba is CompletedTest => prueba !== undefined);

  const completedSelectedTests = selectedTests; // Todas las pruebas mostradas ya están completadas

  const handleGenerateReport = () => {
    if (completedSelectedTests.length === 0) {
      alert(
        "Seleccione al menos una prueba completada para generar el informe"
      );
      return;
    }

    // Usar eficacias editadas si existen, sino usar las originales
    const pruebasConEficaciasEditadas = completedSelectedTests.map(
      (prueba) => ({
        ...prueba,
        eficacia:
          eficaciasEditadas[prueba.pruebaId] !== undefined
            ? eficaciasEditadas[prueba.pruebaId]
            : prueba.eficacia,
        eficaciaOriginal: prueba.eficacia,
        eficaciaModificada: eficaciasEditadas[prueba.pruebaId] !== undefined,
      })
    );

    onGenerateReport(pruebasConEficaciasEditadas);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>
                {vistaAgrupada ? "Montajes Completados" : "Pruebas Completadas"}
              </CardTitle>
              <CardDescription>
                {vistaAgrupada
                  ? "Vista agrupada por montajes. Seleccione montajes para generar informe con todas sus pruebas"
                  : "Vista individual por pruebas. Seleccione pruebas específicas para generar un informe en formato DOCX"}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={vistaAgrupada ? "outline" : "default"}
                size="sm"
                onClick={() => {
                  setVistaAgrupada(false);
                  setRowSelection({});
                }}
                className="flex items-center gap-1"
              >
                <List className="h-4 w-4" />
                <span className="hidden sm:inline">Por Pruebas</span>
              </Button>
              <Button
                variant={vistaAgrupada ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setVistaAgrupada(true);
                  setRowSelection({});
                }}
                className="flex items-center gap-1"
              >
                <Package className="h-4 w-4" />
                <span className="hidden sm:inline">Por Montajes</span>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">
              {error}
              <Button
                variant="link"
                onClick={loadPruebasCompletadas}
                className="ml-2"
              >
                Reintentar
              </Button>
            </div>
          )}

          <div className="rounded-lg border">
            {vistaAgrupada ? (
              <MaterialReactTable table={tablaAgrupada} />
            ) : (
              <MaterialReactTable table={tablaIndividual} />
            )}
          </div>

          {selectedTests.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div>
                  {vistaAgrupada ? (
                    <>
                      <p className="text-base font-medium">
                        {Object.keys(rowSelection).length} montaje(s)
                        seleccionado(s)
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {selectedTests.length} prueba(s) incluida(s) en total
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-base font-medium">
                        {selectedTests.length} prueba(s) seleccionada(s)
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {
                          Object.keys(
                            selectedTests.reduce(
                              (acc, p) => ({ ...acc, [p.montajeId]: true }),
                              {}
                            )
                          ).length
                        }{" "}
                        montaje(s) involucrado(s)
                      </p>
                    </>
                  )}
                  {Object.keys(eficaciasEditadas).length > 0 && (
                    <p className="text-sm text-blue-600 font-medium">
                      ✓ Eficacias revisadas disponibles
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleReviewEfficacies}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <Edit className="h-4 w-4" />
                    Revisar Eficacias
                  </Button>
                  <Button
                    onClick={handleGenerateReport}
                    disabled={completedSelectedTests.length === 0}
                    className="flex items-center gap-2"
                  >
                    <FileText className="h-4 w-4" />
                    Generar Informe DOCX
                  </Button>
                </div>
              </div>
            </div>
          )}

          {pruebasCompletadas.length === 0 && !isLoading && !error && (
            <div className="text-center py-8 text-muted-foreground">
              No hay pruebas completadas con eficacia guardada
            </div>
          )}

          {pruebasCompletadas.length > 0 && (
            <div className="flex items-center justify-between text-base text-muted-foreground bg-gray-50 p-3 rounded">
              <span>
                {vistaAgrupada
                  ? `${montajesAgrupados.length} montaje(s) • ${pruebasCompletadas.length} prueba(s) total`
                  : `${pruebasCompletadas.length} prueba(s) • ${montajesAgrupados.length} montaje(s) único(s)`}
              </span>
              <span>
                Vista:{" "}
                {vistaAgrupada
                  ? "Agrupada por montajes"
                  : "Individual por pruebas"}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal para revisar eficacias */}
      {montajeParaRevisar && (
        <EfficacyCalculationModal
          open={showEditModal}
          onOpenChange={setShowEditModal}
          montage={montajeParaRevisar}
          onCalculationComplete={() => {
            // Actualizar eficacias editadas con los valores del modal
            handleEditComplete();
          }}
          isReviewMode={true}
          initialEfficacies={Object.fromEntries(
            montajesDisponibles[montajeParaRevisar.id]?.map((p) => [
              p.pruebaId,
              p.eficacia,
            ]) || []
          )}
          onEfficaciesUpdate={updateEficaciasEditadas}
          currentMontageIndex={montajeActualIndex + 1}
          totalMontages={montajesParaRevisar.length}
        />
      )}
    </>
  );
}
