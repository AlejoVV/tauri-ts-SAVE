"use client"

import { useMemo, useState } from "react"
import { MaterialReactTable, useMaterialReactTable, type MRT_ColumnDef } from "material-react-table"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Edit, Eye, Calculator } from "lucide-react"
import { ResultsEntryModal } from "./results-entry-modal"
import { EfficacyCalculationModal } from "./efficacy-calculation-modal"

// Tipo de datos para montajes en progreso
type MontageInProgress = {
  id: string
  numeroMontaje: string
  nombreMontaje: string
  ot: string
  objetivo: string
  fechaCreacion: string
  numeroLecturas: number
  lecturasCompletadas: number
  numeroRepeticiones: number
  numeroInicialIndividuos: number
  pruebas: string[]
  productos: string[]
  estado: "En Proceso" | "Listo para Cálculo"
  ultimaActualizacion: string
}

// Datos de ejemplo
const mockMontagesInProgress: MontageInProgress[] = [
  {
    id: "1",
    numeroMontaje: "M-001",
    nombreMontaje: "Montaje Control Plagas Tomate",
    ot: "OT-2024-001",
    objetivo: "Control de plagas",
    fechaCreacion: "2024-01-15",
    numeroLecturas: 3,
    lecturasCompletadas: 1,
    numeroRepeticiones: 3,
    numeroInicialIndividuos: 10,
    pruebas: ["1204", "1205", "1207"],
    productos: ["Fungicida A", "Insecticida B", "Herbicida D"],
    estado: "En Proceso",
    ultimaActualizacion: "2024-01-16",
  },
  {
    id: "2",
    numeroMontaje: "M-002",
    nombreMontaje: "Montaje Fertilización Papa",
    ot: "OT-2024-002",
    objetivo: "Fertilización",
    fechaCreacion: "2024-01-16",
    numeroLecturas: 4,
    lecturasCompletadas: 4,
    numeroRepeticiones: 4,
    numeroInicialIndividuos: 15,
    pruebas: ["1206"],
    productos: ["Fertilizante C"],
    estado: "Listo para Cálculo",
    ultimaActualizacion: "2024-01-18",
  },
  {
    id: "3",
    numeroMontaje: "M-003",
    nombreMontaje: "Montaje Control Malezas Maíz",
    ot: "OT-2024-003",
    objetivo: "Control de malezas",
    fechaCreacion: "2024-01-17",
    numeroLecturas: 3,
    lecturasCompletadas: 2,
    numeroRepeticiones: 3,
    numeroInicialIndividuos: 12,
    pruebas: ["1208", "1209"],
    productos: ["Herbicida E", "Herbicida F"],
    estado: "En Proceso",
    ultimaActualizacion: "2024-01-19",
  },
]

export function MontagesInProgressTable() {
  const [selectedMontage, setSelectedMontage] = useState<MontageInProgress | null>(null)
  const [showResultsModal, setShowResultsModal] = useState(false)
  const [showCalculationModal, setShowCalculationModal] = useState(false)

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
          const pruebas = cell.getValue<string[]>()
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
          )
        },
      },
      {
        accessorKey: "lecturasCompletadas",
        header: "Progreso",
        size: 150,
        Cell: ({ row }) => {
          const completadas = row.original.lecturasCompletadas
          const total = row.original.numeroLecturas
          const percentage = (completadas / total) * 100

          return (
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span>
                  {completadas}/{total} lecturas
                </span>
                <span>{percentage.toFixed(0)}%</span>
              </div>
              <Progress value={percentage} className="h-2" />
            </div>
          )
        },
      },
      {
        accessorKey: "fechaCreacion",
        header: "Creado",
        size: 100,
        Cell: ({ cell }) => new Date(cell.getValue<string>()).toLocaleDateString("es-ES"),
      },
      {
        accessorKey: "ultimaActualizacion",
        header: "Última Act.",
        size: 100,
        Cell: ({ cell }) => new Date(cell.getValue<string>()).toLocaleDateString("es-ES"),
      },
      {
        accessorKey: "estado",
        header: "Estado",
        size: 120,
        Cell: ({ cell }) => {
          const estado = cell.getValue<string>()
          return <Badge variant={estado === "Listo para Cálculo" ? "default" : "secondary"}>{estado}</Badge>
        },
      },
    ],
    [],
  )

  const table = useMaterialReactTable({
    columns,
    data: mockMontagesInProgress,
    enableRowActions: true,
    positionActionsColumn: "last",
    renderRowActions: ({ row }) => (
      <div className="flex gap-1">
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            setSelectedMontage(row.original)
            setShowResultsModal(true)
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
              setSelectedMontage(row.original)
              setShowCalculationModal(true)
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
            setSelectedMontage(row.original)
            // Aquí se abriría un modal de vista detallada
            console.log("Ver detalles:", row.original)
          }}
          className="h-8 w-8 p-0"
          title="Ver detalles"
        >
          <Eye className="h-3 w-3" />
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
  })

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          {/* Removed CardTitle */}
          <CardDescription>
            Gestione los montajes activos, registre resultados de lecturas y calcule eficacia cuando estén completos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border">
            <MaterialReactTable table={table} />
          </div>
        </CardContent>
      </Card>

      {/* Modal para registro de resultados */}
      {selectedMontage && (
        <ResultsEntryModal
          open={showResultsModal}
          onOpenChange={setShowResultsModal}
          montage={selectedMontage}
          onResultsSaved={() => {
            setShowResultsModal(false)
            // Aquí se actualizaría la tabla
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
            setShowCalculationModal(false)
            // Aquí se actualizaría la tabla
          }}
        />
      )}
    </div>
  )
}
