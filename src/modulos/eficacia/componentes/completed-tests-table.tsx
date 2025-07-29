import { useMemo, useState } from "react";
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
import { FileText } from "lucide-react";

// Tipo de datos para las pruebas completadas
type CompletedTest = {
  id: string;
  nombreMontaje: string;
  ot: string;
  objetivo: string;
  fechaCreacion: string;
  numeroLecturas: number;
  lecturasCompletadas: number;
  eficaciaPromedio: number;
  estado: "Completado" | "En Proceso";
  pruebas: string[];
};

// Datos de ejemplo
const mockCompletedTests: CompletedTest[] = [
  {
    id: "1",
    nombreMontaje: "Montaje Control Plagas Tomate",
    ot: "OT-2024-001",
    objetivo: "Control de plagas",
    fechaCreacion: "2024-01-15",
    numeroLecturas: 3,
    lecturasCompletadas: 3,
    eficaciaPromedio: 85.5,
    estado: "Completado",
    pruebas: ["1204", "1205", "1207"],
  },
  {
    id: "2",
    nombreMontaje: "Montaje Fertilización Papa",
    ot: "OT-2024-002",
    objetivo: "Fertilización",
    fechaCreacion: "2024-01-16",
    numeroLecturas: 4,
    lecturasCompletadas: 2,
    eficaciaPromedio: 0,
    estado: "En Proceso",
    pruebas: ["1206"],
  },
  {
    id: "3",
    nombreMontaje: "Montaje Control Malezas Maíz",
    ot: "OT-2024-003",
    objetivo: "Control de malezas",
    fechaCreacion: "2024-01-17",
    numeroLecturas: 3,
    lecturasCompletadas: 3,
    eficaciaPromedio: 92.3,
    estado: "Completado",
    pruebas: ["1208", "1209"],
  },
];

interface CompletedTestsTableProps {
  onGenerateReport: (selectedTests: CompletedTest[]) => void;
}

export function CompletedTestsTable({
  onGenerateReport,
}: CompletedTestsTableProps) {
  const [rowSelection, setRowSelection] = useState<MRT_RowSelectionState>({});

  const columns = useMemo<MRT_ColumnDef<CompletedTest>[]>(
    () => [
      {
        accessorKey: "nombreMontaje",
        header: "Nombre Montaje",
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
        size: 150,
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
        accessorKey: "fechaCreacion",
        header: "Fecha Creación",
        size: 130,
        Cell: ({ cell }) =>
          new Date(cell.getValue<string>()).toLocaleDateString("es-ES"),
      },
      {
        accessorKey: "lecturasCompletadas",
        header: "Lecturas",
        size: 100,
        Cell: ({ row }) => {
          const completadas = row.original.lecturasCompletadas;
          const total = row.original.numeroLecturas;
          return (
            <span
              className={
                completadas === total
                  ? "text-green-600 font-medium"
                  : "text-yellow-600"
              }
            >
              {completadas}/{total}
            </span>
          );
        },
      },
      {
        accessorKey: "eficaciaPromedio",
        header: "Eficacia Promedio",
        size: 130,
        Cell: ({ cell }) => {
          const eficacia = cell.getValue<number>();
          const estado = (cell.row.original as CompletedTest).estado;

          if (estado === "En Proceso") {
            return <span className="text-gray-500">-</span>;
          }

          return (
            <span
              className={
                eficacia >= 80
                  ? "text-green-600 font-bold"
                  : eficacia >= 60
                  ? "text-yellow-600 font-bold"
                  : "text-red-600 font-bold"
              }
            >
              {eficacia.toFixed(1)}%
            </span>
          );
        },
      },
      {
        accessorKey: "estado",
        header: "Estado",
        size: 120,
        Cell: ({ cell }) => {
          const estado = cell.getValue<string>();
          return (
            <Badge variant={estado === "Completado" ? "default" : "secondary"}>
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
    data: mockCompletedTests,
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
  });

  const selectedTests = Object.keys(rowSelection).map(
    (key) => mockCompletedTests[Number.parseInt(key)]
  );
  const completedSelectedTests = selectedTests.filter(
    (test) => test.estado === "Completado"
  );

  const handleGenerateReport = () => {
    if (completedSelectedTests.length === 0) {
      alert(
        "Seleccione al menos una prueba completada para generar el informe"
      );
      return;
    }
    onGenerateReport(completedSelectedTests);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pruebas Completadas</CardTitle>
        <CardDescription>
          Seleccione las pruebas completadas para generar un informe en formato
          DOCX
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
                <p className="text-sm font-medium">
                  {selectedTests.length} montaje(s) seleccionado(s)
                </p>
                <p className="text-xs text-muted-foreground">
                  {completedSelectedTests.length} completado(s) -{" "}
                  {selectedTests.length - completedSelectedTests.length} en
                  proceso
                </p>
              </div>
              <Button
                onClick={handleGenerateReport}
                disabled={completedSelectedTests.length === 0}
                className="flex items-center gap-2"
              >
                <FileText className="h-4 w-4" />
                Generar Informe DOCX
              </Button>
            </div>

            {completedSelectedTests.length < selectedTests.length && (
              <p className="text-xs text-yellow-600">
                Solo se incluirán las pruebas completadas en el informe
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
