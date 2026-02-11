import { useMemo, useState } from "react";
import {
  MaterialReactTable,
  type MRT_ColumnDef,
  useMaterialReactTable,
} from "material-react-table";
import {
  Box,
  Button,
  Snackbar,
  Alert,
} from "@mui/material";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import RefreshIcon from "@mui/icons-material/Refresh";
import EditIcon from "@mui/icons-material/Edit";
import EditOffIcon from "@mui/icons-material/EditOff";

import {
  getResumenPruebas,
  updateEstadoProceso,
  type VistaMaestraTotalRow,
} from "../servicios/resumenService";

const ESTADO_PROCESO_OPTIONS = [
  "Cria/Esporulación",
  "Datos",
  "Entregado FV",
  "Lectura",
  "Pedidos materiales",
  "Repetición",
  "Montaje",
  "Nuevo",
  "Otros",
  "Contactar",
  "En proceso Mb",
];

export default function TableResumen() {
  const [isEditModeEnabled, setIsEditModeEnabled] = useState(false);
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string | undefined>
  >({});
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error";
  }>({
    open: false,
    message: "",
    severity: "success",
  });

  const queryClient = useQueryClient();

  const {
    data: resumenPruebas = [],
    isLoading,
    isError,
    error,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: ["resumenPruebas"],
    queryFn: getResumenPruebas,
  });

  const updateEstadoMutation = useMutation({
    mutationFn: async ({
      pruebaId,
      estadoProceso,
    }: {
      pruebaId: number;
      estadoProceso: string | null;
    }) => {
      await updateEstadoProceso(pruebaId, estadoProceso);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resumenPruebas"] });
      setSnackbar({
        open: true,
        message: "Cambios guardados correctamente",
        severity: "success",
      });
    },
    onError: (error) => {
      console.error("Error al actualizar estado proceso:", error);
      setSnackbar({
        open: true,
        message: "Error al guardar los cambios",
        severity: "error",
      });
    },
    onSettled: () => {
      table.setEditingRow(null);
    },
  });

  const memoizedData = useMemo(() => resumenPruebas, [resumenPruebas]);

  const columns = useMemo<MRT_ColumnDef<VistaMaestraTotalRow>[]>(
    () => [
      {
        accessorKey: "prueba_estado_lab",
        header: "Estado_en_LAB",
        size: 140,
        enableEditing: false,
        Cell: ({ renderedCellValue }) => {
          return renderedCellValue ? renderedCellValue : "-";
        },
      },
      {
        accessorKey: "prueba_estado_proceso",
        header: "Estado_Proceso",
        size: 160,
        enableEditing: true,
        editVariant: "select",
        editSelectOptions: ESTADO_PROCESO_OPTIONS,
        muiEditTextFieldProps: ({ cell, row, table }) => ({
          select: true,
          onChange: (e) => {
            const newValue = (e as React.ChangeEvent<HTMLInputElement>).target.value;
            if (row.original.prueba_id && newValue !== row.original.prueba_estado_proceso) {
              updateEstadoMutation.mutate(
                { pruebaId: row.original.prueba_id, estadoProceso: newValue || null },
                { onSettled: () => table.setEditingCell(null) }
              );
            } else {
              table.setEditingCell(null);
            }
          },
          sx: {
            "& .MuiInputBase-input": {
              fontSize: "0.875rem",
            },
          },
        }),
        Cell: ({ renderedCellValue }) => {
          return renderedCellValue ? renderedCellValue : "-";
        },
      },
      {
        accessorKey: "prueba_orden_id",
        header: "OT",
        size: 80,
        enableEditing: false,
        muiTableBodyCellProps: {
          align: "center",
        },
      },
      {
        accessorKey: "prueba_id",
        header: "No_Prueba",
        size: 90,
        enableEditing: false,
        muiTableBodyCellProps: {
          align: "center",
        },
      },
      {
        accessorKey: "producto_nombre",
        header: "Producto",
        size: 150,
        enableEditing: false,
        Cell: ({ renderedCellValue }) => {
          return renderedCellValue ? renderedCellValue : "-";
        },
      },
      {
        accessorKey: "dosis_producto",
        header: "Dosis",
        size: 80,
        enableEditing: false,
        Cell: ({ renderedCellValue }) => {
          return renderedCellValue ? renderedCellValue : "-";
        },
      },
      {
        accessorKey: "especie_nombre",
        header: "Especie_Vegetal",
        size: 140,
        enableEditing: false,
        Cell: ({ renderedCellValue }) => {
          return renderedCellValue ? renderedCellValue : "-";
        },
      },
      {
        accessorKey: "objetivo_nombre",
        header: "Objetivo",
        size: 250,
        enableEditing: false,
        Cell: ({ renderedCellValue }) => {
          return renderedCellValue ? renderedCellValue : "-";
        },
      },
      {
        accessorKey: "objetivo_general",
        header: "Obj_general",
        size: 150,
        enableEditing: false,
        Cell: ({ renderedCellValue }) => {
          return renderedCellValue ? renderedCellValue : "-";
        },
      },
      {
        accessorKey: "finca_nombre",
        header: "Finca",
        size: 150,
        enableEditing: false,
        Cell: ({ renderedCellValue }) => {
          return renderedCellValue ? renderedCellValue : "-";
        },
      },
      {
        accessorKey: "facturara",
        header: "Facturar_a",
        size: 150,
        enableEditing: false,
        Cell: ({ renderedCellValue }) => {
          return renderedCellValue ? renderedCellValue : "-";
        },
      },
      {
        accessorKey: "contacto",
        header: "Contacto",
        size: 200,
        enableEditing: false,
        Cell: ({ renderedCellValue }) => {
          return renderedCellValue ? renderedCellValue : "-";
        },
      },
      {
        accessorKey: "observaciones",
        header: "Observaciones",
        size: 250,
        enableEditing: false,
        Cell: ({ renderedCellValue }) => {
          return renderedCellValue ? renderedCellValue : "-";
        },
      },
      {
        accessorKey: "prueba_cantidad",
        header: "Cantidad_pruebas",
        size: 120,
        enableEditing: false,
        Cell: ({ renderedCellValue }) => {
          return renderedCellValue ? renderedCellValue : "-";
        },
      },
      {
        accessorKey: "prueba_fecha_creacion",
        header: "Fecha_Ingreso",
        size: 120,
        enableEditing: false,
        Cell: ({ renderedCellValue }) => {
          return renderedCellValue
            ? new Date(renderedCellValue as string).toLocaleDateString()
            : "-";
        },
      },
      {
        accessorKey: "fecha_recibo_muestra",
        header: "Fecha_Recibida",
        size: 120,
        enableEditing: false,
        Cell: ({ renderedCellValue }) => {
          return renderedCellValue
            ? new Date(renderedCellValue as string).toLocaleDateString()
            : "-";
        },
      },
      {
        accessorKey: "prueba_numero_muestra",
        header: "Numero_prueba",
        size: 120,
        enableEditing: false,
        Cell: ({ renderedCellValue }) => {
          return renderedCellValue ? renderedCellValue : "-";
        },
      },
    ],
    [validationErrors, updateEstadoMutation.mutate]
  );

  const table = useMaterialReactTable({
    columns,
    data: memoizedData,
    enableColumnFilters: true,
    enableFacetedValues: true,
    enableBottomToolbar: false,
    enableColumnFilterModes: true,
    enablePagination: false,
    enableStickyHeader: true,
    enableStickyFooter: false,
    enableRowVirtualization: true,
    enableColumnVirtualization: true,
    enableKeyboardShortcuts: false,
    enableGlobalFilterModes: true,
    enableColumnPinning: true,
    getColumnCanGlobalFilter: () => {
      return true;
    },
    enableSorting: true,
    enableColumnResizing: true,
    rowVirtualizerOptions: {
      overscan: 5,
      estimateSize: () => 25,
    },
    columnVirtualizerOptions: {
      overscan: 2,
    },
    enableEditing: isEditModeEnabled,
    editDisplayMode: "cell",
    muiEditTextFieldProps: {
      sx: {
        "& .MuiInputBase-input": {
          fontSize: "0.875rem",
        },
      },
    },
    initialState: {
      showGlobalFilter: true,
      columnPinning: {
        left: ["prueba_estado_lab", "prueba_orden_id"],
      },
      pagination: {
        pageSize: 25,
        pageIndex: 0,
      },
      sorting: [
        {
          id: "prueba_fecha_creacion",
          desc: true,
        },
      ],
      density: "compact",
    },
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
    muiTableBodyRowProps: ({ row, table }) => {
      const density = table.getState().density;

      let height, paddingTop, paddingBottom, fontSize;

      switch (density) {
        case "compact":
          height = "20px";
          paddingTop = "0px";
          paddingBottom = "0px";
          fontSize = "0.77rem";
          break;
        case "comfortable":
          height = "auto";
          paddingTop = "6px";
          paddingBottom = "6px";
          fontSize = "0.795rem";
          break;
        default:
          height = "auto";
          paddingTop = "12px";
          paddingBottom = "12px";
          fontSize = "0.88rem";
          break;
      }

      return {
        sx: {
          height: height,
          "& td": {
            paddingTop: paddingTop,
            paddingBottom: paddingBottom,
            paddingLeft: "16px",
            paddingRight: "16px",
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
    muiTableBodyCellProps: ({ cell, column }) => ({
      onClick: () => {
        if (isEditModeEnabled && column.id === "prueba_estado_proceso") {
          table.setEditingCell(cell);
        }
      },
      sx: {
        cursor:
          isEditModeEnabled && column.id === "prueba_estado_proceso"
            ? "pointer"
            : "default",
        "&:hover": {
          backgroundColor:
            isEditModeEnabled && column.id === "prueba_estado_proceso"
              ? "rgba(0, 0, 0, 0.04)"
              : "transparent",
        },
      },
    }),
    muiTableContainerProps: {
      sx: {
        flexGrow: 1,
        overflow: "auto",
      },
    },
    muiSkeletonProps: {
      animation: "wave",
      height: 35,
      sx: {
        borderRadius: "4px",
      },
    },
    renderTopToolbarCustomActions: () => (
      <Box sx={{ display: "flex", gap: "1rem" }}>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={() => refetch()}
          disabled={isLoading || isRefetching || updateEstadoMutation.isPending}
        >
          Actualizar Datos
        </Button>
        <Button
          variant={isEditModeEnabled ? "contained" : "outlined"}
          startIcon={isEditModeEnabled ? <EditOffIcon /> : <EditIcon />}
          onClick={() => {
            setIsEditModeEnabled(!isEditModeEnabled);
            table.setEditingCell(null);
          }}
          disabled={isLoading || isRefetching || updateEstadoMutation.isPending}
          sx={{
            backgroundColor: isEditModeEnabled ? "#1976d2" : "transparent",
            color: isEditModeEnabled ? "white" : "#1976d2",
            "&:hover": {
              backgroundColor: isEditModeEnabled ? "#1565c0" : "rgba(25, 118, 210, 0.04)",
            },
          }}
        >
          {isEditModeEnabled ? "Deshabilitar Edición" : "Habilitar Edición"}
        </Button>
      </Box>
    ),
    state: {
      showSkeletons: isLoading,
      showProgressBars: isRefetching || updateEstadoMutation.isPending,
    },
  });

  if (isError) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="error">
          Error al cargar los datos:{" "}
          {error instanceof Error ? error.message : "Error desconocido"}
        </Alert>
      </Box>
    );
  }

  return (
    <div className="flex-1 overflow-hidden">
      <MaterialReactTable table={table} />
      <Snackbar
        open={snackbar.open}
        autoHideDuration={2000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        message={snackbar.message}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        ContentProps={{
          sx: {
            backgroundColor: "rgba(50, 50, 50, 0.8)",
            backdropFilter: "blur(4px)",
            color: "white",
            fontWeight: "medium",
            borderRadius: "4px",
            boxShadow: "0 3px 10px rgba(0,0,0,0.2)",
          },
        }}
      />
    </div>
  );
}
