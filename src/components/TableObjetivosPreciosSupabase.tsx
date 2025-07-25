// src/features/objetivos/components/ObjetivosConPreciosTable.tsx
import { useMemo, useState, useCallback } from "react";
import {
  MaterialReactTable,
  type MRT_ColumnDef,
  type MRT_Row,
  // type MRT_TableOptions,
  useMaterialReactTable,
} from "material-react-table";
import {
  Box,
  Button,
  IconButton,
  Tooltip,
  Snackbar,
  Alert,
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
    isRefetching,
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

  // Memoizar datos para evitar re-renders innecesarios
  const memoizedData = useMemo(() => objetivos, [objetivos]);

  // Función para validar los datos
  const validateObjetivo = useCallback(
    (objetivo: Partial<ObjetivoConPrecios>): Record<string, string> => {
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
    },
    []
  );

  // Función para manejar el guardado de una fila editada
  const handleSaveRow = useCallback(
    async (row: MRT_Row<ObjetivoConPrecios>, values: Record<string, any>) => {
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
          values.precio_biologico === ""
            ? null
            : Number(values.precio_biologico),
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
    },
    [validateObjetivo, updateObjetivoMutation, setValidationErrors]
  );

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
        size: 350,
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
        accessorKey: "objetivo_procedimiento",
        header: "Procedimiento",
        size: 250,
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
        accessorKey: "objetivo_general",
        header: "Objetivo General",
        enableColumnFilterModes: false,
        filterVariant: "autocomplete",
        size: 100,
        Cell: ({ renderedCellValue }) => {
          return renderedCellValue ? renderedCellValue : "-";
        },
        editVariant: "select",
        editSelectOptions: [
          "Otras plagas",
          "Eficacia in-vitro",
          "Análisis microbiología",
          "Varias",
          "Virus / Viroide",
          "Otros hongos",
          "Botrytis",
          "Taxonomia",
          "Nemátodos",
          "M polvoso",
          "M velloso",
          "Thrips",
          "Diagnóstico",
          "Imágenes",
          "Indexación",
          "Otros",
          "Monitoreo ambiental",
          "Proyecto",
        ],
        muiEditTextFieldProps: {
          select: true,
        },
      },
      {
        accessorKey: "objetivo_tipo_prueba",
        header: "Tipo Prueba",
        enableColumnFilterModes: false,
        size: 50,
        filterVariant: "autocomplete",
        editVariant: "select",
        editSelectOptions: [
          "Partes lanzas",
          "Eficacia",
          "Microbiología",
          "Otros laboratorio",
          "Virus",
          "Taxonomia",
          "Nemátodos",
          "Monitoreo ambiental",
          "Viroide",
          "Proyecto",
        ],
        muiEditTextFieldProps: {
          select: true,
        },
      },
      {
        accessorKey: "objetivo_dias_entrega_resultados",
        header: "Días Entrega",
        enableColumnFilterModes: false,
        size: 25,
        muiTableBodyCellProps: {
          align: "center",
        },
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
        header: "Químico",
        enableColumnFilterModes: false,
        size: 75,
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
        header: "Biológico",
        enableColumnFilterModes: false,
        size: 75,
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
    data: memoizedData,
    enableColumnFilters: true,
    enableFacetedValues: true,
    enableBottomToolbar: false,
    enableColumnFilterModes: true,
    enablePagination: false,
    enableStickyHeader: true,
    enableStickyFooter: false,
    enableRowVirtualization: true,
    enableKeyboardShortcuts: false,
    enableGlobalFilterModes: true,
    getColumnCanGlobalFilter: () => {
      return true;
    },
    enableSorting: true,
    enableColumnResizing: true,
    // Configuración optimizada de virtualización
    rowVirtualizerOptions: {
      overscan: 5, // Reducido para mejor rendimiento
      estimateSize: () => 25, // Tamaño estimado de fila para virtualización
    },
    columnVirtualizerOptions: {
      overscan: 2, // Número de columnas extra a renderizar
    },
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
        size: 80, // Aumentar tamaño para botones
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
          // Selecciona el input real dentro del TextField
          fontSize: "0.78rem",
        },
      },
    },
    initialState: {
      showGlobalFilter: true,
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
    muiTableBodyRowProps: ({ row, table }) => {
      const density = table.getState().density;
      const isEditing = table.getState().editingRow?.id === row.id;
      const isCreating = table.getState().creatingRow;

      // Configurar estilos según la densidad
      let height, paddingTop, paddingBottom, fontSize;

      if (isEditing || isCreating) {
        height = "auto";
        paddingTop = "2px";
        paddingBottom = "2px";
      } else {
        switch (density) {
          case "compact":
            height = "20px";
            paddingTop = "0px";
            paddingBottom = "0px";
            fontSize = "0.77rem";
            break;
          case "comfortable":
            height = "auto"; // Altura automática para acomodar contenido
            paddingTop = "6px";
            paddingBottom = "6px";
            fontSize = "0.795rem";
            break;
          default: // 'standard'
            height = "auto"; // Altura automática para acomodar contenido
            paddingTop = "12px";
            paddingBottom = "12px";
            fontSize = "0.88rem";
            break;
        }
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
            // Propiedades para manejar el texto correctamente
            whiteSpace: density === "compact" ? "nowrap" : "normal",
            overflow: density === "compact" ? "hidden" : "visible",
            textOverflow: density === "compact" ? "ellipsis" : "visible",
            wordWrap: density === "compact" ? "normal" : "break-word",
            verticalAlign: "top",
          },
        },
      };
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
          disabled={
            isLoading || isRefetching || updateObjetivoMutation.isPending
          }
        >
          Actualizar Datos
        </Button>
      </Box>
    ),
    state: {
      showSkeletons: isLoading, // Mostrar skeletons siempre que esté cargando
      showProgressBars:
        isRefetching ||
        updateObjetivoMutation.isPending ||
        createObjetivoMutation.isPending,
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
            backgroundColor: "rgba(50, 50, 50, 0.8)", // Fondo oscuro con 20% transparencia
            backdropFilter: "blur(4px)", // Efecto blur
            color: "white", // Texto blanco
            fontWeight: "medium", // Texto un poco más grueso
            borderRadius: "4px", // Esquinas redondeadas
            boxShadow: "0 3px 10px rgba(0,0,0,0.2)", // Sombra sutil
          },
        }}
      />
    </div>
  );
}
