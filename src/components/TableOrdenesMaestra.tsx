import { useMemo, useState } from "react";
import {
  MaterialReactTable,
  type MRT_ColumnDef,
  type MRT_Row,
  useMaterialReactTable,
} from "material-react-table";
import {
  Box,
  Button,
  IconButton,
  Tooltip,
  Snackbar,
  Alert,
  CircularProgress,
} from "@mui/material";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import EditIcon from "@mui/icons-material/Edit";
import RefreshIcon from "@mui/icons-material/Refresh";

import {
  getVistaMaestraTotal,
  updateVistaMaestraFields,
  type VistaMaestraTotalRow,
} from "../services/vistaMaestraService";

export default function TableOrdenesMaestra() {
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

  // Acceder al queryClient para invalidar queries
  const queryClient = useQueryClient();

  // Query para obtener datos de vista maestra total
  const {
    data: vistaMaestra = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["vistaMaestraTotal"],
    queryFn: getVistaMaestraTotal,
  });

  // Mutation para actualizar campos editables
  const updateFieldsMutation = useMutation({
    mutationFn: async ({
      pruebaId,
      ordenId,
      updates,
    }: {
      pruebaId: number;
      ordenId: number | null;
      updates: any;
    }) => {
      await updateVistaMaestraFields(pruebaId, ordenId, updates);
    },
    onSuccess: () => {
      // Refrescar la query
      queryClient.invalidateQueries({ queryKey: ["vistaMaestraTotal"] });

      setSnackbar({
        open: true,
        message: "Cambios guardados correctamente",
        severity: "success",
      });
    },
    onError: (error) => {
      console.error("Error al actualizar campos:", error);
      setSnackbar({
        open: true,
        message: "Error al guardar los cambios",
        severity: "error",
      });
    },
    onSettled: () => {
      // Cerrar el modo de edición después de que la mutation se completa
      table.setEditingRow(null);
    },
  });

  // Función para manejar el guardado de una fila editada
  const handleSaveRow = async (
    row: MRT_Row<VistaMaestraTotalRow>,
    values: Record<string, any>
  ) => {
    // Filtrar solo los campos editables
    const editableUpdates = {
      observaciones: values.observaciones,
      notas_varias: values.notas_varias,
      prueba_estado_lab: values.prueba_estado_lab,
      estado_fact: values.estado_fact,

      estado_ot: values.estado_ot,
    };

    // Limpiar errores de validación
    setValidationErrors({});

    // Guardar cambios usando la mutation
    if (row.original.prueba_id) {
      updateFieldsMutation.mutate({
        pruebaId: row.original.prueba_id,
        ordenId: row.original.prueba_orden_id,
        updates: editableUpdates,
      });
    }
  };

  const columns = useMemo<MRT_ColumnDef<VistaMaestraTotalRow>[]>(
    () => [
      // Orden exacto del SQL de vistamaestratotal
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
        header: "ID Prueba",
        size: 80,
        enableEditing: false,
        muiTableBodyCellProps: {
          align: "center",
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
        accessorKey: "producto_nombre",
        header: "Producto",
        size: 100,
        enableEditing: false,
        Cell: ({ renderedCellValue }) => {
          return renderedCellValue ? renderedCellValue : "-";
        },
      },
      {
        accessorKey: "dosis_producto",
        header: "Dosis",
        size: 50,
        enableEditing: false,
        Cell: ({ renderedCellValue }) => {
          return renderedCellValue ? renderedCellValue : "-";
        },
      },
      {
        accessorKey: "producto_unid",
        header: "Unidades",
        size: 50,
        enableEditing: false,
        Cell: ({ renderedCellValue }) => {
          return renderedCellValue ? renderedCellValue : "-";
        },
      },
      {
        accessorKey: "especie_nombre",
        header: "Especie",
        size: 120,
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
        accessorKey: "producto_casa_comercial",
        header: "Casa Comercial",
        size: 150,
        enableEditing: false,
        Cell: ({ renderedCellValue }) => {
          return renderedCellValue ? renderedCellValue : "-";
        },
      },
      {
        accessorKey: "facturara",
        header: "Facturar a",
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
        enableEditing: true,
        Cell: ({ renderedCellValue }) => {
          return renderedCellValue ? renderedCellValue : "-";
        },
        muiEditTextFieldProps: {
          multiline: true,
          rows: 3,
        },
      },
      {
        accessorKey: "prueba_cantidad",
        header: "Cantidad",
        size: 80,
        enableEditing: false,
        Cell: ({ renderedCellValue }) => {
          return renderedCellValue ? renderedCellValue : "-";
        },
      },
      {
        accessorKey: "producto_tipo",
        header: "Tipo Producto",
        size: 120,
        enableEditing: false,
        Cell: ({ renderedCellValue }) => {
          return renderedCellValue ? renderedCellValue : "-";
        },
      },
      {
        accessorKey: "notas_varias",
        header: "Notas Varias",
        size: 200,
        enableEditing: true,
        Cell: ({ renderedCellValue }) => {
          return renderedCellValue ? renderedCellValue : "-";
        },
        muiEditTextFieldProps: {
          multiline: true,
          rows: 3,
        },
      },
      {
        accessorKey: "prueba_estado_lab",
        header: "Estado Lab",
        size: 120,
        enableEditing: true,
        editVariant: "select",
        editSelectOptions: [
          "Esperando Aprobación",
          "En Curso",
          "Anulado",
          "Establecimiento Cepa / Cría",
          "Aprobado FV",
        ],
        muiEditTextFieldProps: {
          select: true,
        },
      },
      {
        accessorKey: "estado_fact",
        header: "Estado Facturación",
        size: 140,
        enableEditing: true,
        editVariant: "select",
        editSelectOptions: ["", "Facturado"],
        muiEditTextFieldProps: {
          select: true,
        },
      },
      {
        accessorKey: "estado_ot",
        header: "Estado OT",
        size: 120,
        enableEditing: true,
        editVariant: "select",
        editSelectOptions: ["", "Cerrada"],
        muiEditTextFieldProps: {
          select: true,
        },
      },
      {
        accessorKey: "prueba_fecha_creacion",
        header: "Fecha Creación",
        size: 120,
        enableEditing: false,
        Cell: ({ renderedCellValue }) => {
          return renderedCellValue
            ? new Date(renderedCellValue as string).toLocaleDateString()
            : "-";
        },
      },
      {
        accessorKey: "prueba_precio",
        header: "Precio",
        size: 100,
        enableEditing: false,
        muiTableBodyCellProps: {
          align: "right",
        },
        Cell: ({ renderedCellValue }) => {
          return renderedCellValue !== null
            ? `$${Number(renderedCellValue).toLocaleString()}`
            : "-";
        },
      },
      {
        accessorKey: "profesion_nombre",
        header: "Profesión",
        size: 120,
        enableEditing: false,
        Cell: ({ renderedCellValue }) => {
          return renderedCellValue ? renderedCellValue : "-";
        },
      },
      {
        accessorKey: "contacto_cargo",
        header: "Cargo",
        size: 150,
        enableEditing: false,
        Cell: ({ renderedCellValue }) => {
          return renderedCellValue ? renderedCellValue : "-";
        },
      },
      {
        accessorKey: "contacto_celular_opcional",
        header: "Celular Opcional",
        size: 130,
        enableEditing: false,
        Cell: ({ renderedCellValue }) => {
          return renderedCellValue ? renderedCellValue : "-";
        },
      },
      {
        accessorKey: "contacto_celular_principal",
        header: "Celular Principal",
        size: 130,
        enableEditing: false,
        Cell: ({ renderedCellValue }) => {
          return renderedCellValue ? renderedCellValue : "-";
        },
      },
      {
        accessorKey: "contacto_email",
        header: "Email",
        size: 200,
        enableEditing: false,
        Cell: ({ renderedCellValue }) => {
          return renderedCellValue ? renderedCellValue : "-";
        },
      },
      {
        accessorKey: "tipo_prueba",
        header: "Tipo Prueba",
        size: 100,
        enableEditing: false,
        Cell: ({ renderedCellValue }) => {
          return renderedCellValue ? renderedCellValue : "-";
        },
      },
      {
        accessorKey: "descuento",
        header: "Descuento",
        size: 100,
        enableEditing: false,
        Cell: ({ renderedCellValue }) => {
          return renderedCellValue ? renderedCellValue : "-";
        },
      },
      {
        accessorKey: "orden_compra",
        header: "Orden Compra",
        size: 120,
        enableEditing: false,
        Cell: ({ renderedCellValue }) => {
          return renderedCellValue ? renderedCellValue : "-";
        },
      },
      {
        accessorKey: "fecha_entrega_info",
        header: "Fecha Entrega Info",
        size: 130,
        enableEditing: false,
        Cell: ({ renderedCellValue }) => {
          return renderedCellValue
            ? new Date(renderedCellValue as string).toLocaleDateString()
            : "-";
        },
      },
      {
        accessorKey: "orden_numero_factura",
        header: "Nº Factura",
        size: 100,
        enableEditing: false,
        muiTableBodyCellProps: {
          align: "center",
        },
        Cell: ({ renderedCellValue }) => {
          return renderedCellValue ? renderedCellValue : "-";
        },
      },
      {
        accessorKey: "fecha_recibo_muestra",
        header: "Fecha Recibo",
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
        header: "Nº Muestra",
        size: 100,
        enableEditing: false,
        Cell: ({ renderedCellValue }) => {
          return renderedCellValue ? renderedCellValue : "-";
        },
      },
      {
        accessorKey: "prueba_estado_proceso",
        header: "Estado Proceso",
        size: 120,
        enableEditing: false,
        Cell: ({ renderedCellValue }) => {
          return renderedCellValue ? renderedCellValue : "-";
        },
      },
      {
        accessorKey: "prueba_estado_foto",
        header: "Estado Foto",
        size: 100,
        enableEditing: false,
        Cell: ({ renderedCellValue }) => {
          return renderedCellValue ? renderedCellValue : "-";
        },
      },
      {
        accessorKey: "prueba_usuario_foto",
        header: "Usuario Foto",
        size: 100,
        enableEditing: false,
        Cell: ({ renderedCellValue }) => {
          return renderedCellValue ? renderedCellValue : "-";
        },
      },
      {
        accessorKey: "prueba_fecha_entrega_calculada",
        header: "Fecha Entrega Calc.",
        size: 130,
        enableEditing: false,
        Cell: ({ renderedCellValue }) => {
          return renderedCellValue
            ? new Date(renderedCellValue as string).toLocaleDateString()
            : "-";
        },
      },
      {
        accessorKey: "prueba_semana_entrega",
        header: "Semana Entrega",
        size: 100,
        enableEditing: false,
        muiTableBodyCellProps: {
          align: "center",
        },
      },
    ],
    [validationErrors]
  );

  // Configuración de la tabla con useMaterialReactTable
  const table = useMaterialReactTable({
    columns,
    data: vistaMaestra,
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
    enableEditing: true,
    editDisplayMode: "row", // Edición por filas
    onEditingRowSave: ({ row, values }) => handleSaveRow(row, values),
    onEditingRowCancel: () => setValidationErrors({}),
    displayColumnDefOptions: {
      "mrt-row-actions": {
        header: "Acciones",
        size: 80,
        muiTableHeadCellProps: {
          align: "center",
        },
        muiTableBodyCellProps: {
          align: "center",
        },
      },
    },
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
        left: ["mrt-row-actions", "prueba_orden_id", "prueba_id"],
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
    renderRowActions: ({ row }) => (
      <Box sx={{ display: "flex", gap: "0.5rem", justifyContent: "center" }}>
        <Tooltip title="Editar">
          <IconButton onClick={() => table.setEditingRow(row)}>
            <EditIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
    ),
    muiTableContainerProps: {
      sx: {
        flexGrow: 1,
        overflow: "auto",
      },
    },
    renderTopToolbarCustomActions: ({ table }) => (
      <Box sx={{ display: "flex", gap: "1rem" }}>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={() => refetch()}
          disabled={isLoading || updateFieldsMutation.isPending}
        >
          Actualizar Datos
        </Button>
      </Box>
    ),
    state: {
      isLoading: isLoading,
      showProgressBars: updateFieldsMutation.isPending,
    },
  });

  if (isLoading && vistaMaestra.length === 0) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

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
