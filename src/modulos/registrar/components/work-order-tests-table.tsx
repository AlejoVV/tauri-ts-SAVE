import { useMemo, useState, useEffect } from "react";
import {
  MaterialReactTable,
  useMaterialReactTable,
  type MRT_ColumnDef,
} from "material-react-table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { obtenerPruebasPorOrden } from "../servicios/workOrderService";
import type { VistaMaestraRow } from "../servicios/workOrderService";

interface WorkOrderTestsTableProps {
  ordenTrabajo: number | null;
  refreshTrigger?: number; // Optional trigger to force refresh
}

export function WorkOrderTestsTable({
  ordenTrabajo,
  refreshTrigger = 0,
}: WorkOrderTestsTableProps) {
  const [data, setData] = useState<VistaMaestraRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch data when ordenTrabajo or refreshTrigger changes
  // rerender-dependencies - Use primitive dependencies in effects
  useEffect(() => {
    if (!ordenTrabajo) {
      setData([]);
      return;
    }

    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const pruebas = await obtenerPruebasPorOrden(ordenTrabajo);
        setData(pruebas);
      } catch (err) {
        console.error("Error al cargar pruebas:", err);
        setError("Error al cargar las pruebas de la orden de trabajo");
        setData([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [ordenTrabajo, refreshTrigger]);

  // Format date helper
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    try {
      const date = new Date(dateString);
      return format(date, "dd/MM/yyyy", { locale: es });
    } catch {
      return "-";
    }
  };

  // Badge component for estado fields
  const EstadoBadge = ({ estado, type }: { estado: string | null; type: "lab" | "fact" | "ot" | "proceso" }) => {
    if (!estado) return <span className="text-muted-foreground">-</span>;

    const variants: Record<string, string> = {
      lab: "bg-blue-100 text-blue-800 hover:bg-blue-100",
      fact: "bg-green-100 text-green-800 hover:bg-green-100",
      ot: "bg-purple-100 text-purple-800 hover:bg-purple-100",
      proceso: "bg-amber-100 text-amber-800 hover:bg-amber-100",
    };

    return (
      <Badge variant="secondary" className={variants[type]}>
        {estado}
      </Badge>
    );
  };

  // Column definitions following Material React Table patterns
  const columns = useMemo<MRT_ColumnDef<VistaMaestraRow>[]>(
    () => [
      {
        accessorKey: "finca_nombre",
        header: "Finca",
        size: 120,
        Cell: ({ cell }) => cell.getValue<string>() || "-",
      },
      {
        accessorKey: "objetivo_nombre",
        header: "Objetivo",
        size: 200,
        Cell: ({ cell }) => cell.getValue<string>() || "-",
        muiTableBodyCellProps: {
          sx: {
            whiteSpace: "normal",
            wordBreak: "break-word",
          },
        },
      },
      {
        accessorKey: "producto_nombre",
        header: "Producto",
        size: 150,
        Cell: ({ cell }) => cell.getValue<string>() || "-",
      },
      {
        accessorKey: "dosis_producto",
        header: "Dosis",
        size: 80,
        Cell: ({ row }) => {
          const dosis = row.original.dosis_producto;
          const unidad = row.original.producto_unid;
          if (!dosis) return "-";
          return `${dosis} ${unidad || ""}`.trim();
        },
      },
      {
        accessorKey: "producto_unid",
        header: "Unidad",
        size: 80,
        Cell: ({ cell }) => cell.getValue<string>() || "-",
      },
      {
        accessorKey: "facturara",
        header: "Facturar A",
        size: 150,
        Cell: ({ cell }) => cell.getValue<string>() || "-",
        muiTableBodyCellProps: {
          sx: {
            whiteSpace: "normal",
            wordBreak: "break-word",
          },
        },
      },
      {
        accessorKey: "contacto",
        header: "Contacto",
        size: 150,
        Cell: ({ cell }) => cell.getValue<string>() || "-",
      },
      {
        accessorKey: "observaciones",
        header: "Observaciones",
        size: 200,
        Cell: ({ cell }) => cell.getValue<string>() || "-",
        muiTableBodyCellProps: {
          sx: {
            whiteSpace: "normal",
            wordBreak: "break-word",
          },
        },
      },
      {
        accessorKey: "especie_nombre",
        header: "Especie",
        size: 120,
        Cell: ({ cell }) => cell.getValue<string>() || "-",
      },
      {
        accessorKey: "prueba_estado_lab",
        header: "Estado Lab",
        size: 140,
        Cell: ({ cell }) => <EstadoBadge estado={cell.getValue<string>()} type="lab" />,
      },
      {
        accessorKey: "prueba_id",
        header: "Prueba ID",
        size: 90,
        Cell: ({ cell }) => cell.getValue<number>() || "-",
        muiTableBodyCellProps: {
          align: "center",
        },
      },
      {
        accessorKey: "prueba_numero_muestra",
        header: "N° Muestra",
        size: 100,
        Cell: ({ cell }) => cell.getValue<number>() || "-",
        muiTableBodyCellProps: {
          align: "center",
        },
      },
      {
        accessorKey: "estado_fact",
        header: "Estado Fact.",
        size: 120,
        Cell: ({ cell }) => <EstadoBadge estado={cell.getValue<string>()} type="fact" />,
      },
      {
        accessorKey: "estado_ot",
        header: "Estado OT",
        size: 110,
        Cell: ({ cell }) => <EstadoBadge estado={cell.getValue<string>()} type="ot" />,
      },
      {
        accessorKey: "prueba_estado_proceso",
        header: "Estado Proceso",
        size: 140,
        Cell: ({ cell }) => <EstadoBadge estado={cell.getValue<string>()} type="proceso" />,
      },
      {
        accessorKey: "prueba_fecha_creacion",
        header: "Fecha Creación",
        size: 130,
        Cell: ({ cell }) => formatDate(cell.getValue<string>()),
      },
      {
        accessorKey: "fecha_recibo_muestra",
        header: "Fecha Recibo",
        size: 130,
        Cell: ({ cell }) => formatDate(cell.getValue<string>()),
      },
      {
        accessorKey: "fecha_entrega_info",
        header: "Fecha Entrega",
        size: 130,
        Cell: ({ cell }) => formatDate(cell.getValue<string>()),
      },
    ],
    []
  );

  // Table configuration following best practices
  const table = useMaterialReactTable({
    columns,
    data,
    enableRowSelection: false,
    enableColumnFilters: true,
    enableColumnOrdering: true,
    enableSorting: true,
    enablePagination: true,
    enableStickyHeader: true,
    enableDensityToggle: true,
    muiTableContainerProps: {
      sx: {
        maxHeight: "500px",
      },
    },
    muiTableHeadCellProps: {
      sx: {
        fontWeight: "bold",
        fontSize: "0.875rem",
        backgroundColor: "hsl(var(--muted))",
      },
    },
    muiTableBodyCellProps: {
      sx: {
        fontSize: "0.875rem",
      },
    },
    initialState: {
      pagination: {
        pageSize: 10,
        pageIndex: 0,
      },
      density: "compact",
      columnPinning: {
        left: ["prueba_id"],
      },
    },
    state: {
      isLoading,
    },
  });

  // Loading state
  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Cargando pruebas...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // No OT selected state
  if (!ordenTrabajo) {
    return (
      <Card>
        <CardContent className="py-12">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Seleccione una orden de trabajo para ver las pruebas asociadas
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card>
        <CardContent className="py-12">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // Empty state
  if (data.length === 0 && !isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pruebas de la Orden de Trabajo #{ordenTrabajo}</CardTitle>
          <CardDescription>
            No se encontraron pruebas para esta orden de trabajo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <p className="text-sm">No hay pruebas registradas</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Table view
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Pruebas de la Orden de Trabajo #{ordenTrabajo}</CardTitle>
            <CardDescription>
              {data.length} {data.length === 1 ? "prueba registrada" : "pruebas registradas"}
            </CardDescription>
          </div>
          <Badge variant="outline" className="text-base px-3 py-1">
            Total: {data.length}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border">
          <MaterialReactTable table={table} />
        </div>
      </CardContent>
    </Card>
  );
}
