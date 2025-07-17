"use client"

import { useMemo, useState } from "react"
import {
  MaterialReactTable,
  useMaterialReactTable,
  type MRT_ColumnDef,
  type MRT_RowSelectionState,
} from "material-react-table"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card"

// Tipo de datos para las pruebas disponibles
type TestData = {
  id: string
  ot: string
  prueba: string
  finca: string
  objetivo: string
  producto: string
  especieVegetal: string
  fechaIngreso: string
  estado: string
}

// Datos de ejemplo
const mockTestData: TestData[] = [
  {
    id: "1",
    ot: "OT-2024-001",
    prueba: "1204",
    finca: "Finca El Paraíso",
    objetivo: "Control de plagas",
    producto: "Fungicida A",
    especieVegetal: "Tomate",
    fechaIngreso: "2024-01-15",
    estado: "Completado",
  },
  {
    id: "2",
    ot: "OT-2024-001",
    prueba: "1205",
    finca: "Finca El Paraíso",
    objetivo: "Control de plagas",
    producto: "Insecticida B",
    especieVegetal: "Tomate",
    fechaIngreso: "2024-01-15",
    estado: "Completado",
  },
  {
    id: "3",
    ot: "OT-2024-002",
    prueba: "1206",
    finca: "Hacienda San José",
    objetivo: "Fertilización",
    producto: "Fertilizante C",
    especieVegetal: "Papa",
    fechaIngreso: "2024-01-16",
    estado: "Completado",
  },
  {
    id: "4",
    ot: "OT-2024-001",
    prueba: "1207",
    finca: "Finca El Paraíso",
    objetivo: "Control de plagas",
    producto: "Herbicida D",
    especieVegetal: "Tomate",
    fechaIngreso: "2024-01-15",
    estado: "Completado",
  },
]

interface TestSelectionTableProps {
  onTestsSelected: (tests: TestData[]) => void
}

export function TestSelectionTable({ onTestsSelected }: TestSelectionTableProps) {
  const [rowSelection, setRowSelection] = useState<MRT_RowSelectionState>({})

  const columns = useMemo<MRT_ColumnDef<TestData>[]>(
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
        accessorKey: "especieVegetal",
        header: "Especie Vegetal",
        size: 130,
      },
      {
        accessorKey: "fechaIngreso",
        header: "Fecha Ingreso",
        size: 130,
        Cell: ({ cell }) => new Date(cell.getValue<string>()).toLocaleDateString("es-ES"),
      },
      {
        accessorKey: "estado",
        header: "Estado",
        size: 120,
        Cell: ({ cell }) => {
          const estado = cell.getValue<string>()
          return (
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">{estado}</span>
          )
        },
      },
    ],
    [],
  )

  // Validar selección: mismo OT y objetivo
  const validateSelection = (selectedRows: TestData[]) => {
    if (selectedRows.length === 0) return true

    const firstRow = selectedRows[0]
    return selectedRows.every((row) => row.ot === firstRow.ot && row.objetivo === firstRow.objetivo)
  }

  const selectedTests = Object.keys(rowSelection).map((key) => mockTestData[Number.parseInt(key)])
  const isValidSelection = validateSelection(selectedTests)

  const table = useMaterialReactTable({
    columns,
    data: mockTestData,
    enableRowSelection: true,
    enableMultiRowSelection: true,
    onRowSelectionChange: setRowSelection,
    state: {
      rowSelection,
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

  const handleContinue = () => {
    if (isValidSelection && selectedTests.length > 0) {
      onTestsSelected(selectedTests)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardDescription>
          Seleccione las pruebas que desea incluir en el montaje de eficacia. Las pruebas deben ser del mismo OT y
          objetivo.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border">
          <MaterialReactTable table={table} />
        </div>

        {selectedTests.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div>
                <p className="text-sm font-medium">{selectedTests.length} prueba(s) seleccionada(s)</p>
                {!isValidSelection && (
                  <p className="text-sm text-red-600">Error: Las pruebas deben ser del mismo OT y objetivo</p>
                )}
              </div>
              <Button onClick={handleContinue} disabled={!isValidSelection || selectedTests.length === 0}>
                Continuar con Montaje
              </Button>
            </div>

            {selectedTests.length > 0 && isValidSelection && (
              <div className="text-xs text-muted-foreground">
                OT: {selectedTests[0].ot} | Objetivo: {selectedTests[0].objetivo}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
