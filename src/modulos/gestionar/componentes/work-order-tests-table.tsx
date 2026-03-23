import { useMemo, useState, useEffect } from "react";
import {
  MaterialReactTable,
  useMaterialReactTable,
  type MRT_ColumnDef,
  type MRT_RowSelectionState,
} from "material-react-table";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle, Pencil } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { obtenerPruebasPorOrden } from "@/modulos/registrar/servicios/workOrderService";
import type { VistaMaestraRow } from "@/modulos/registrar/servicios/workOrderService";

interface WorkOrderTestsTableProps {
  ordenTrabajo: number | null;
  refreshTrigger?: number;
  onEdit?: (prueba: VistaMaestraRow) => void;
  onSelectionChange?: (selectedRows: VistaMaestraRow[]) => void;
}

export function WorkOrderTestsTable({
  ordenTrabajo,
  refreshTrigger = 0,
  onEdit,
  onSelectionChange,
}: WorkOrderTestsTableProps) {
  const [data, setData] = useState<VistaMaestraRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rowSelection, setRowSelection] = useState<MRT_RowSelectionState>({});

  // rerender-dependencies - Use primitive dependencies in effects
  useEffect(() => {
    if (!ordenTrabajo) {
      setData([]);
      setRowSelection({});
      return;
    }

    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        setRowSelection({});
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

  useEffect(() => {
    if (!onSelectionChange) return;
    const selected = data.filter((row) => rowSelection[String(row.prueba_id)]);
    onSelectionChange(selected);
  }, [rowSelection, data, onSelectionChange]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    try {
      const date = new Date(dateString);
      return format(date, "dd/MM/yyyy", { locale: es });
    } catch (err) {
      console.error("Error al formatear fecha:", err);
      return "-";
    }
  };

  const EstadoBadge = ({
    estado,
    type,
  }: {
    estado: string | null;
    type: "lab" | "fact" | "ot" | "proceso";
  }) => {
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

  const columns = useMemo<MRT_ColumnDef<VistaMaestraRow>[]>(
    () => [
      {
        accessorKey: "finca_nombre",
        header: "Finca",
        size: 85,
        minSize: 30,
        Cell: ({ cell }) => cell.getValue<string>() || "-",
      },
      {
        accessorKey: "objetivo_nombre",
        header: "Objetivo",
        size: 150,
        minSize: 30,
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
        size: 100,
        minSize: 30,
        Cell: ({ cell }) => cell.getValue<string>() || "-",
      },
      {
        accessorKey: "dosis_producto",
        header: "Dosis",
        size: 60,
        minSize: 30,
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
        size: 60,
        minSize: 30,
        Cell: ({ cell }) => cell.getValue<string>() || "-",
      },
      {
        accessorKey: "observaciones",
        header: "Observaciones",
        size: 130,
        minSize: 30,
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
        size: 85,
        minSize: 30,
        Cell: ({ cell }) => cell.getValue<string>() || "-",
      },
      {
        accessorKey: "prueba_estado_lab",
        header: "Estado Lab",
        size: 95,
        minSize: 30,
        Cell: ({ cell }) => (
          <EstadoBadge estado={cell.getValue<string>()} type="lab" />
        ),
      },
      {
        accessorKey: "prueba_id",
        header: "Prueba ID",
        size: 70,
        minSize: 30,
        Cell: ({ cell }) => cell.getValue<number>() || "-",
        muiTableBodyCellProps: {
          align: "center",
        },
      },
      {
        accessorKey: "prueba_numero_muestra",
        header: "N° Muestra",
        size: 75,
        minSize: 30,
        Cell: ({ cell }) => cell.getValue<number>() || "-",
        muiTableBodyCellProps: {
          align: "center",
        },
      },
      {
        accessorKey: "estado_fact",
        header: "Estado Fact.",
        size: 90,
        minSize: 30,
        Cell: ({ cell }) => (
          <EstadoBadge estado={cell.getValue<string>()} type="fact" />
        ),
      },
      {
        accessorKey: "estado_ot",
        header: "Estado OT",
        size: 80,
        minSize: 30,
        Cell: ({ cell }) => (
          <EstadoBadge estado={cell.getValue<string>()} type="ot" />
        ),
      },
      {
        accessorKey: "prueba_estado_proceso",
        header: "Estado Proceso",
        size: 105,
        minSize: 30,
        Cell: ({ cell }) => (
          <EstadoBadge estado={cell.getValue<string>()} type="proceso" />
        ),
      },
      {
        accessorKey: "prueba_fecha_creacion",
        header: "Fecha Creación",
        size: 95,
        minSize: 30,
        Cell: ({ cell }) => formatDate(cell.getValue<string>()),
      },
      {
        accessorKey: "fecha_recibo_muestra",
        header: "Fecha Recibo",
        size: 95,
        minSize: 30,
        Cell: ({ cell }) => formatDate(cell.getValue<string>()),
      },
      {
        accessorKey: "fecha_entrega_info",
        header: "Fecha Entrega",
        size: 95,
        minSize: 30,
        Cell: ({ cell }) => formatDate(cell.getValue<string>()),
      },
    ],
    [],
  );

  const table = useMaterialReactTable({
    columns,
    data,
    getRowId: (row) => String(row.prueba_id),
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    enableColumnFilters: false,
    enableColumnOrdering: false,
    enableColumnResizing: true,
    enableSorting: true,
    enableSortingRemoval: false,
    enablePagination: false,
    enableStickyHeader: true,
    enableDensityToggle: false,
    enableFullScreenToggle: false,
    enableGlobalFilter: false,
    enableHiding: false,
    enableColumnActions: false,
    enableTopToolbar: false,
    enableBottomToolbar: false,
    enableRowActions: !!onEdit,
    positionActionsColumn: "first",
    displayColumnDefOptions: {
      "mrt-row-actions": {
        header: "",
        size: 48,
        minSize: 48,
      },
    },
    renderRowActions: ({ row }) =>
      onEdit ? (
        <Button
          size="icon"
          variant="ghost"
          className="h-6 w-6"
          onClick={() => onEdit(row.original)}
          title="Editar prueba"
        >
          <Pencil className="h-3 w-3" />
        </Button>
      ) : null,
    muiTablePaperProps: {
      elevation: 0,
      sx: {
        borderRadius: "0.5rem",
        border: "1px solid #e0e0e0",
        height: "100%",
        display: "flex",
        flexDirection: "column",
      },
    },
    muiTableProps: {
      sx: {
        tableLayout: "fixed",
      },
    },
    muiTableContainerProps: {
      sx: {
        maxHeight: "500px",
        flexGrow: 1,
        overflow: "auto",
      },
    },
    muiTableHeadCellProps: ({ column }) => ({
      sx: {
        fontWeight: "bold",
        fontSize: "0.8rem",
        backgroundColor: "hsl(var(--muted))",
        paddingLeft: "8px",
        paddingRight: "8px",
        cursor: "pointer",
        userSelect: "none",
        "& .MuiTableSortLabel-icon": {
          display: "none",
        },
      },
      onDoubleClick: () => {
        const currentSorting = column.getIsSorted();
        if (currentSorting === false) {
          column.toggleSorting(false);
        } else if (currentSorting === "asc") {
          column.toggleSorting(true);
        } else {
          column.toggleSorting(false);
        }
      },
    }),
    muiTableBodyCellProps: {
      sx: {
        fontSize: "0.8rem",
      },
    },
    muiTableBodyRowProps: ({ table }) => {
      const density = table.getState().density;

      let height, paddingTop, paddingBottom, fontSize;

      switch (density) {
        case "compact":
          height = "20px";
          paddingTop = "0px";
          paddingBottom = "0px";
          fontSize = "0.75rem";
          break;
        case "comfortable":
          height = "auto";
          paddingTop = "6px";
          paddingBottom = "6px";
          fontSize = "0.78rem";
          break;
        default:
          height = "auto";
          paddingTop = "12px";
          paddingBottom = "12px";
          fontSize = "0.85rem";
          break;
      }

      return {
        sx: {
          height: height,
          "& td": {
            paddingTop: paddingTop,
            paddingBottom: paddingBottom,
            paddingLeft: "8px",
            paddingRight: "8px",
            fontSize: fontSize,
            whiteSpace: density === "compact" ? "nowrap" : "normal",
            overflow: density === "compact" ? "hidden" : "visible",
            textOverflow: density === "compact" ? "ellipsis" : "visible",
            wordWrap: density === "compact" ? "normal" : "break-word",
            verticalAlign: "top",
          },
        },
      };
    },
    muiSkeletonProps: {
      animation: "wave",
      height: 35,
      sx: {
        borderRadius: "4px",
      },
    },
    initialState: {
      density: "compact",
    },
    state: {
      isLoading,
      rowSelection,
    },
  });

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

  if (data.length === 0 && !isLoading) {
    return (
      <div className="flex items-center justify-center py-4 text-muted-foreground">
        <p className="text-xs">Sin pruebas registradas</p>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="py-2 px-4">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {data.length} {data.length === 1 ? "prueba" : "pruebas"}
          {Object.keys(rowSelection).length > 0 && (
            <span className="ml-2 text-xs font-normal text-foreground">
              · {Object.keys(rowSelection).length} seleccionada{Object.keys(rowSelection).length !== 1 ? "s" : ""}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden">
        <MaterialReactTable table={table} />
      </CardContent>
    </Card>
  );
}
