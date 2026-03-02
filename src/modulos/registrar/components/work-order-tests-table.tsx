import { useMemo, useState, useEffect } from "react";
import {
  MaterialReactTable,
  useMaterialReactTable,
  type MRT_ColumnDef,
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
import { Loader2, AlertCircle, Pencil, Copy, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { obtenerPruebasPorOrden } from "../servicios/workOrderService";
import type { VistaMaestraRow } from "../servicios/workOrderService";

interface WorkOrderTestsTableProps {
  ordenTrabajo: number | null;
  refreshTrigger?: number;
  onEdit?: (prueba: VistaMaestraRow) => void;
  onDuplicate?: (prueba: VistaMaestraRow) => void;
  onDelete?: (prueba: VistaMaestraRow) => void;
}

export function WorkOrderTestsTable({
  ordenTrabajo,
  refreshTrigger = 0,
  onEdit,
  onDuplicate,
  onDelete,
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
  }, [ordenTrabajo, refreshTrigger]); // Agregar refreshTrigger como dependencia

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

  // Column definitions following Material React Table patterns
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
          if (!dosis) return "-";
          return dosis;
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

  // Table configuration following best practices
  const table = useMaterialReactTable({
    columns,
    data,
    enableRowSelection: false,
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
    enableRowActions: !!(onEdit || onDuplicate || onDelete),
    positionActionsColumn: "first",
    displayColumnDefOptions: {
      "mrt-row-actions": {
        header: "",
        size: 96,
        minSize: 96,
      },
    },
    renderRowActions: ({ row }) => (
      <div className="flex items-center gap-0.5">
        {onEdit && (
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6"
            onClick={() => onEdit(row.original)}
            title="Editar prueba"
          >
            <Pencil className="h-3 w-3" />
          </Button>
        )}
        {onDuplicate && (
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6"
            onClick={() => onDuplicate(row.original)}
            title="Duplicar prueba"
          >
            <Copy className="h-3 w-3" />
          </Button>
        )}
        {onDelete && (
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6 text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={() => onDelete(row.original)}
            title="Eliminar prueba"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        )}
      </div>
    ),
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
          column.toggleSorting(false); // Sort ascending
        } else if (currentSorting === "asc") {
          column.toggleSorting(true); // Sort descending
        } else {
          column.toggleSorting(false); // Back to ascending
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

      // Configurar estilos según la densidad
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
        default: // 'standard'
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
      <div className="flex items-center justify-center py-4 text-muted-foreground">
        <p className="text-xs">Sin pruebas registradas</p>
      </div>
    );
  }

  // Table view
  return (
    <Card>
      <CardHeader className="py-2 px-4">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {data.length} {data.length === 1 ? "prueba" : "pruebas"}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden">
        <MaterialReactTable table={table} />
      </CardContent>
    </Card>
  );
}
