// src/features/objetivos/components/ObjetivosConPreciosTable.tsx

import { useMemo } from "react";
import { MaterialReactTable, type MRT_ColumnDef } from "material-react-table";
import { CircularProgress, Alert, Box } from "@mui/material";
import { useObjetivosConPrecios } from "../hooks/useObjetivosPrecio";
import type { ObjetivoConPrecios } from "../services/objetivosService";

export default function ObjetivosConPreciosTable() {
  const { objetivos, loading, error } = useObjetivosConPrecios();

  console.log("Datos de objetivos:", objetivos);

  const columns = useMemo<MRT_ColumnDef<ObjetivoConPrecios>[]>(
    () => [
      {
        accessorKey: "objetivo_nombre",
        header: "Objetivo",
        size: 200,
      },
      {
        accessorKey: "objetivo_descripcion",
        header: "Descripción",
        size: 100,
        Cell: ({ cell }) => (
          <div className="max-w-md whitespace-normal">
            {cell.getValue<string>() || "-"}
          </div>
        ),
      },
      {
        accessorKey: "objetivo_procedimiento",
        header: "Procedimiento",
        size: 250,
        Cell: ({ row }) => {
          const procedimiento = row.original.objetivo_procedimiento;
          return (
            <div className="max-w-md whitespace-normal break-words">
              {procedimiento || "-"}
            </div>
          );
        },
      },
      {
        accessorKey: "objetivo_dias_entrega_resultados",
        header: "Días Entrega",
        size: 25,
      },
      {
        accessorKey: "objetivo_general",
        header: "Objetivo General",
        size: 70,
        Cell: ({ cell }) => (
          <div className="max-w-md whitespace-normal">
            {cell.getValue<string>() || "-"}
          </div>
        ),
      },
      {
        accessorKey: "objetivo_tipo_prueba",
        header: "Tipo Prueba",
        size: 50,
      },
      {
        accessorKey: "precio_quimico",
        header: "Precio Químico",
        size: 40,
        Cell: ({ cell }) => {
          const value = cell.getValue<number | null>();
          return value !== null ? `$${value.toLocaleString()}` : "-";
        },
      },
      {
        accessorKey: "precio_biologico",
        header: "Precio Biológico",
        size: 40,
        Cell: ({ cell }) => {
          const value = cell.getValue<number | null>();
          return value !== null ? `$${value.toLocaleString()}` : "-";
        },
      },
    ],
    []
  );

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="error">
          Error al cargar los datos: {error.message}
        </Alert>
      </Box>
    );
  }

  return (
    <MaterialReactTable
      createDisplayMode="row"
      enableColumnActions
      editDisplayMode="row"
      enableEditing
      columns={columns}
      data={objetivos}
      enableColumnFilters
      enableGlobalFilter
      enableSorting
      enableStickyHeader
      enablePagination={false}
      initialState={{
        sorting: [
          {
            id: "objetivo_nombre",
            desc: false,
          },
        ],
      }}
      muiTablePaperProps={{
        elevation: 0,
        sx: {
          borderRadius: "0.5rem",
          border: "1px solid #e0e0e0",
        },
      }}
      muiTableProps={{
        sx: {
          tableLayout: "fixed",
        },
      }}
    />
  );
}
