// src/features/objetivos/components/ObjetivosConPreciosTable.tsx
import { useMemo, useState } from "react";
import {
  MaterialReactTable,
  type MRT_ColumnDef,
  type MRT_Row,
  type MRT_TableOptions,
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
import AddIcon from "@mui/icons-material/Add";
import RefreshIcon from "@mui/icons-material/Refresh";

import {
  getObjetivosConPrecios,
  updateObjetivoConPrecios,
  createObjetivoConPrecios,
  type ObjetivoConPrecios,
} from "../services/objetivosService";

export default function ObjetivosConPreciosTable() {
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

  // Query para obtener objetivos
  const {
    data: objetivos = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["objetivos"],
    queryFn: getObjetivosConPrecios,
  });

  // Mutation para actualizar un objetivo
  const updateObjetivoMutation = useMutation({
    mutationFn: updateObjetivoConPrecios,
    onSuccess: (_, variables) => {
      // La función updateObjetivoConPrecios devuelve void, por lo que usamos variables para obtener el ID
      queryClient.setQueryData(
        ["objetivos"],
        (old: ObjetivoConPrecios[] | undefined) =>
          old?.map((item) =>
            item.objetivo_id === variables.objetivo_id ? variables : item
          ) || []
      );

      setSnackbar({
        open: true,
        message: "Cambios guardados correctamente",
        severity: "success",
      });
    },
    onError: (error) => {
      console.error("Error al actualizar objetivo:", error);
      setSnackbar({
        open: true,
        message: "Error al guardar los cambios",
        severity: "error",
      });
    },
    onSettled: () => {
      // Cerrar el modo de edición después de que la mutation se completa (éxito o error)
      table.setEditingRow(null);
    },
  });

  // Mutation para crear un objetivo
  const createObjetivoMutation = useMutation({
    mutationFn: createObjetivoConPrecios,
    onSuccess: () => {
      // Invalidar y refrescar la query de objetivos
      queryClient.invalidateQueries({ queryKey: ["objetivos"] });

      setSnackbar({
        open: true,
        message: "Objetivo creado correctamente",
        severity: "success",
      });
    },
    onError: (error) => {
      console.error("Error al crear objetivo:", error);
      setSnackbar({
        open: true,
        message: "Error al crear el objetivo",
        severity: "error",
      });
    },
  });

  // Función para validar los datos
  const validateObjetivo = (
    objetivo: Partial<ObjetivoConPrecios>
  ): Record<string, string> => {
    const errors: Record<string, string> = {};

    if (!objetivo.objetivo_nombre) {
      errors.objetivo_nombre = "El nombre es obligatorio";
    }

    if (
      objetivo.objetivo_dias_entrega_resultados !== null &&
      objetivo.objetivo_dias_entrega_resultados !== undefined &&
      (objetivo.objetivo_dias_entrega_resultados <= 0 ||
        isNaN(Number(objetivo.objetivo_dias_entrega_resultados)))
    ) {
      errors.objetivo_dias_entrega_resultados = "Debe ser un número positivo";
    }

    if (
      objetivo.precio_quimico !== null &&
      objetivo.precio_quimico !== undefined &&
      (objetivo.precio_quimico < 0 || isNaN(Number(objetivo.precio_quimico)))
    ) {
      errors.precio_quimico = "Debe ser un número positivo o cero";
    }

    if (
      objetivo.precio_biologico !== null &&
      objetivo.precio_biologico !== undefined &&
      (objetivo.precio_biologico < 0 ||
        isNaN(Number(objetivo.precio_biologico)))
    ) {
      errors.precio_biologico = "Debe ser un número positivo o cero";
    }

    return errors;
  };

  // Función para manejar el guardado de una fila editada
  const handleSaveRow = async (
    row: MRT_Row<ObjetivoConPrecios>,
    values: Record<string, any>
  ) => {
    // Convertir valores a los tipos correctos
    const updatedObjetivo: ObjetivoConPrecios = {
      ...row.original,
      ...values,
      objetivo_dias_entrega_resultados:
        values.objetivo_dias_entrega_resultados === ""
          ? null
          : Number(values.objetivo_dias_entrega_resultados),
      precio_quimico:
        values.precio_quimico === "" ? null : Number(values.precio_quimico),
      precio_biologico:
        values.precio_biologico === "" ? null : Number(values.precio_biologico),
    };

    // Validar datos
    const errors = validateObjetivo(updatedObjetivo);
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    // Limpiar errores de validación
    setValidationErrors({});

    // Guardar cambios usando la mutation
    updateObjetivoMutation.mutate(updatedObjetivo);
  };

  // Función para manejar la creación de un nuevo objetivo
  const handleCreateRow = async (values: Record<string, any>) => {
    // Convertir valores a los tipos correctos
    const newObjetivo: Omit<ObjetivoConPrecios, "objetivo_id"> = {
      objetivo_nombre: values.objetivo_nombre || "",
      objetivo_descripcion: values.objetivo_descripcion || null,
      objetivo_general: values.objetivo_general || null,
      objetivo_procedimiento: values.objetivo_procedimiento || null,
      objetivo_tipo_prueba: values.objetivo_tipo_prueba || null,
      objetivo_dias_entrega_resultados:
        values.objetivo_dias_entrega_resultados === ""
          ? null
          : Number(values.objetivo_dias_entrega_resultados),
      precio_quimico:
        values.precio_quimico === "" ? null : Number(values.precio_quimico),
      precio_biologico:
        values.precio_biologico === "" ? null : Number(values.precio_biologico),
    };

    // Validar datos
    const errors = validateObjetivo(newObjetivo);
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    // Limpiar errores de validación
    setValidationErrors({});

    try {
      // Crear nuevo objetivo usando la mutation
      await createObjetivoMutation.mutateAsync(newObjetivo);

      // Cerrar la fila de creación
      table.setCreatingRow(null);
    } catch (error) {
      console.error("Error creating row:", error);
    }
  };

  const columns = useMemo<MRT_ColumnDef<ObjetivoConPrecios>[]>(
    () => [
      {
        accessorKey: "objetivo_nombre",
        header: "Objetivo",
        size: 180,
        muiEditTextFieldProps: {
          multiline: true,
          rows: 3,
          required: true,
          error: !!validationErrors.objetivo_nombre,
          helperText: validationErrors.objetivo_nombre,
          onFocus: () => {
            if (validationErrors.objetivo_nombre) {
              setValidationErrors({
                ...validationErrors,
                objetivo_nombre: undefined,
              });
            }
          },
        },
      },
      {
        accessorKey: "objetivo_descripcion",
        header: "Descripción",
        size: 200,
        filterFn: "contains",
        enableGlobalFilter: true,
        Cell: ({ renderedCellValue }) => {
          return renderedCellValue ? renderedCellValue : "-";
        },
        muiEditTextFieldProps: {
          multiline: true,
          rows: 3,
        },
      },
      {
        accessorKey: "objetivo_general",
        header: "Objetivo General",
        size: 200,
        Cell: ({ renderedCellValue }) => {
          return renderedCellValue ? renderedCellValue : "-";
        },
        muiEditTextFieldProps: {
          multiline: true,
          rows: 3,
        },
      },
      {
        accessorKey: "objetivo_procedimiento",
        header: "Procedimiento",
        size: 200,
        filterFn: "includesString",
        Cell: ({ renderedCellValue }) => {
          return renderedCellValue ? renderedCellValue : "-";
        },
        muiEditTextFieldProps: {
          multiline: true,
          rows: 3,
        },
      },
      {
        accessorKey: "objetivo_tipo_prueba",
        header: "Tipo Prueba",
        enableColumnFilterModes: false,
        size: 130,
        filterVariant: "select",
        filterSelectOptions: [
          "Eficacia",
          "Residualidad",
          "Fitotoxicidad",
          "Otros",
        ],
        editVariant: "select",
        editSelectOptions: [
          "Eficacia",
          "Residualidad",
          "Fitotoxicidad",
          "Otros",
        ],
        muiEditTextFieldProps: {
          select: true,
        },
      },
      {
        accessorKey: "objetivo_dias_entrega_resultados",
        header: "Días Entrega",
        enableColumnFilterModes: false,
        size: 130,
        muiEditTextFieldProps: {
          type: "number",
          error: !!validationErrors.objetivo_dias_entrega_resultados,
          helperText: validationErrors.objetivo_dias_entrega_resultados,
          onFocus: () => {
            if (validationErrors.objetivo_dias_entrega_resultados) {
              setValidationErrors({
                ...validationErrors,
                objetivo_dias_entrega_resultados: undefined,
              });
            }
          },
        },
      },
      {
        accessorKey: "precio_quimico",
        header: "Precio Químico",
        enableColumnFilterModes: false,
        size: 130,
        Cell: ({ renderedCellValue }) => {
          return renderedCellValue !== null
            ? `$${Number(renderedCellValue).toLocaleString()}`
            : "-";
        },
        muiEditTextFieldProps: {
          type: "number",
          error: !!validationErrors.precio_quimico,
          helperText: validationErrors.precio_quimico,
          onFocus: () => {
            if (validationErrors.precio_quimico) {
              setValidationErrors({
                ...validationErrors,
                precio_quimico: undefined,
              });
            }
          },
          InputProps: {
            startAdornment: <span>$</span>,
          },
        },
      },
      {
        accessorKey: "precio_biologico",
        header: "Precio Biológico",
        enableColumnFilterModes: false,
        size: 130,
        Cell: ({ renderedCellValue }) => {
          return renderedCellValue !== null
            ? `$${Number(renderedCellValue).toLocaleString()}`
            : "-";
        },
        muiEditTextFieldProps: {
          type: "number",
          error: !!validationErrors.precio_biologico,
          helperText: validationErrors.precio_biologico,
          onFocus: () => {
            if (validationErrors.precio_biologico) {
              setValidationErrors({
                ...validationErrors,
                precio_biologico: undefined,
              });
            }
          },
          InputProps: {
            startAdornment: <span>$</span>,
          },
        },
      },
    ],
    [validationErrors]
  );

  // Configuración de la tabla con useMaterialReactTable
  const table = useMaterialReactTable({
    columns,
    data: objetivos,
    enableColumnFilters: true,
    enableColumnFilterModes: true,
    enablePagination: true,
    enableKeyboardShortcuts: false,
    enableGlobalFilterModes: true,
    getColumnCanGlobalFilter: () => {
      return true;
    },
    enableSorting: true,
    enableColumnResizing: true,
    enableEditing: true,
    editDisplayMode: "row", // Edición por filas
    createDisplayMode: "row", // Creación por filas (importante para crear en línea)
    onEditingRowSave: ({ row, values }) => handleSaveRow(row, values),
    onCreatingRowSave: ({ values, table }) => {
      handleCreateRow(values);
      table.setCreatingRow(null); // Cerrar la fila de creación después de guardar
    },
    onEditingRowCancel: () => setValidationErrors({}),
    onCreatingRowCancel: () => setValidationErrors({}),
    displayColumnDefOptions: {
      "mrt-row-actions": {
        header: "Acciones",
        size: 50, // Aumentar tamaño para botones
        muiTableHeadCellProps: {
          align: "center",
        },
        muiTableBodyCellProps: {
          align: "center",
        },
      },
    },
    initialState: {
      showGlobalFilter: true,
      pagination: {
        pageSize: 10,
        pageIndex: 0,
      },
      sorting: [
        {
          id: "objetivo_nombre",
          desc: false,
        },
      ],
      density: "compact",
    },
    muiTablePaperProps: {
      elevation: 0,
      sx: {
        borderRadius: "0.5rem",
        border: "1px solid #e0e0e0",
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
    renderTopToolbarCustomActions: ({ table }) => (
      <Box sx={{ display: "flex", gap: "1rem" }}>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => {
            // Crear una nueva fila directamente en la tabla
            table.setCreatingRow(true);
          }}
          disabled={createObjetivoMutation.isPending}
        >
          Nuevo Objetivo
        </Button>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={() => refetch()}
          disabled={isLoading || updateObjetivoMutation.isPending}
        >
          Actualizar Datos
        </Button>
      </Box>
    ),
    state: {
      isLoading: isLoading,
      showProgressBars:
        updateObjetivoMutation.isPending || createObjetivoMutation.isPending,
    },
  });

  if (isLoading && objetivos.length === 0) {
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
    <>
      <MaterialReactTable table={table} />
      <Snackbar
        open={snackbar.open}
        autoHideDuration={2000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        message={snackbar.message}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        ContentProps={{
          sx: {
            backgroundColor: "rgba(50, 50, 50, 0.8)", // Fondo oscuro con 20% transparencia
            backdropFilter: "blur(4px)", // Efecto blur
            color: "white", // Texto blanco
            fontWeight: "medium", // Texto un poco más grueso
            borderRadius: "4px", // Esquinas redondeadas
            boxShadow: "0 3px 10px rgba(0,0,0,0.2)", // Sombra sutil
          },
        }}
      />
    </>
  );
}
