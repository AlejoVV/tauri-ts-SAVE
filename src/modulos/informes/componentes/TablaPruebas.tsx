import React, { useMemo, useState } from "react";
import {
  MaterialReactTable,
  useMaterialReactTable,
  type MRT_ColumnDef,
  type MRT_RowSelectionState,
} from "material-react-table";
import { PruebaEnCurso } from "../tipos";

interface TablaPruebasProps {
  pruebas: PruebaEnCurso[];
  onSelectionChange?: (selectedTests: PruebaEnCurso[]) => void;
}

// Componente para mostrar el estado de la prueba
const EstadoPrueba: React.FC<{ estado: string }> = ({ estado }) => {
  const getEstadoColor = (estado: string) => {
    switch (estado.toLowerCase()) {
      case "en_curso":
        return "bg-blue-100 text-blue-800";
      case "completada":
        return "bg-green-100 text-green-800";
      case "pendiente":
        return "bg-yellow-100 text-yellow-800";
      case "cancelada":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <span
      className={`inline-flex px-2 py-1 text-xs font-medium rounded ${getEstadoColor(
        estado
      )}`}
    >
      {estado}
    </span>
  );
};

export const TablaPruebas: React.FC<TablaPruebasProps> = ({ pruebas, onSelectionChange }) => {
  const [rowSelection, setRowSelection] = useState<MRT_RowSelectionState>({});

  // Calcular el número de filas seleccionadas
  const filasSeleccionadas = Object.keys(rowSelection).length;

  // Notificar al componente padre cuando cambie la selección
  React.useEffect(() => {
    if (onSelectionChange) {
      const selectedTests = Object.keys(rowSelection)
        .map(rowId => pruebas.find(prueba => prueba.no_prueba === rowId))
        .filter(Boolean) as PruebaEnCurso[];
      onSelectionChange(selectedTests);
    }
  }, [rowSelection, pruebas, onSelectionChange]);

  const columns = useMemo<MRT_ColumnDef<PruebaEnCurso>[]>(
    () => [
      {
        accessorKey: "finca",
        header: "Finca",
        minSize: 80,
        maxSize: 300,
        size: 100,
        enableColumnFilter: true,
        filterFn: "contains",
        Cell: ({ cell }) => (
          <div
            className="text-sm truncate"
            title={cell.getValue<string>()}
          >
            {cell.getValue<string>()}
          </div>
        ),
      },
      {
        accessorKey: "prueba_id",
        header: "Prueba ID",
        minSize: 60,
        maxSize: 120,
        size: 80,
        enableColumnFilter: true,
        filterFn: "contains",
        Cell: ({ cell }) => (
          <div className="text-sm">{cell.getValue<string>()}</div>
        ),
      },
      {
        accessorKey: "no_muestra",
        header: "No. Muestra",
        minSize: 80,
        maxSize: 120,
        size: 100,
        enableColumnFilter: true,
        filterFn: "contains",
        Cell: ({ cell }) => (
          <div className="text-sm">{cell.getValue<string>()}</div>
        ),
      },
      {
        accessorKey: "estado_en_lab",
        header: "Estado Lab",
        minSize: 90,
        maxSize: 120,
        size: 100,
        enableColumnFilter: true,
        filterFn: "contains",
        Cell: ({ cell }) => <EstadoPrueba estado={cell.getValue<string>()} />,
      },
      {
        accessorKey: "objetivo",
        header: "Objetivo",
        minSize: 120,
        maxSize: 200,
        size: 150,
        enableColumnFilter: true,
        filterFn: "contains",
        Cell: ({ cell }) => (
          <div className="text-sm truncate" title={cell.getValue<string>()}>
            {cell.getValue<string>()}
          </div>
        ),
      },
      {
        accessorKey: "producto",
        header: "Producto",
        minSize: 120,
        maxSize: 200,
        size: 150,
        enableColumnFilter: true,
        filterFn: "contains",
        Cell: ({ cell }) => (
          <div className="text-sm truncate" title={cell.getValue<string>()}>
            {cell.getValue<string>()}
          </div>
        ),
      },
      {
        accessorKey: "dosis",
        header: "Dosis",
        minSize: 50,
        maxSize: 70,
        size: 60,
        enableColumnFilter: true,
        filterFn: "contains",
        Cell: ({ cell }) => (
          <div className="text-sm">{cell.getValue<string>()}</div>
        ),
      },
      {
        accessorKey: "observaciones",
        header: "Observaciones",
        minSize: 150,
        maxSize: 300,
        size: 200,
        enableColumnFilter: true,
        filterFn: "contains",
        Cell: ({ cell }) => (
          <div className="text-sm truncate" title={cell.getValue<string>()}>
            {cell.getValue<string>()}
          </div>
        ),
      },
      {
        accessorKey: "especie_vegetal",
        header: "Especie Vegetal",
        minSize: 100,
        maxSize: 180,
        size: 120,
        enableColumnFilter: true,
        filterFn: "contains",
        Cell: ({ cell }) => (
          <div className="text-sm truncate" title={cell.getValue<string>()}>
            {cell.getValue<string>()}
          </div>
        ),
      },
      {
        accessorKey: "fecha_ingreso_ot",
        header: "Fecha Creación",
        minSize: 100,
        maxSize: 120,
        size: 110,
        enableColumnFilter: true,
        filterFn: "contains",
        Cell: ({ cell }) => (
          <div className="text-sm">{cell.getValue<string>()}</div>
        ),
      },
      {
        accessorKey: "fecha_montaje",
        header: "Fecha Montaje",
        minSize: 100,
        maxSize: 120,
        size: 110,
        enableColumnFilter: true,
        filterFn: "contains",
        Cell: ({ cell }) => {
          const fecha = cell.getValue<string>();
          return (
            <div className="text-sm">
              {fecha && fecha !== "-" ? fecha : "-"}
            </div>
          );
        },
      },
      {
        accessorKey: "estado_proceso",
        header: "Estado Proceso",
        minSize: 90,
        maxSize: 150,
        size: 120,
        enableColumnFilter: true,
        filterFn: "contains",
        Cell: ({ cell }) => <EstadoPrueba estado={cell.getValue<string>()} />,
      },
      {
        accessorKey: "dias_montaje",
        header: "Días Montaje",
        minSize: 80,
        maxSize: 100,
        size: 90,
        enableColumnFilter: true,
        filterFn: "contains",
        Cell: ({ cell }) => {
          const dias = cell.getValue<number>();
          return (
            <div className="text-sm">
              {dias !== undefined ? `${dias} días` : "-"}
            </div>
          );
        },
      },
      {
        accessorKey: "semana_entrega",
        header: "Semana Entrega",
        minSize: 100,
        maxSize: 120,
        size: 110,
        enableColumnFilter: true,
        filterFn: "contains",
        Cell: ({ cell }) => (
          <div className="text-sm">{cell.getValue<string>() || "-"}</div>
        ),
      },
    ],
    []
  );

  const table = useMaterialReactTable({
    columns,
    data: pruebas,
    enableRowSelection: true,
    positionToolbarAlertBanner: "none",
    enableGlobalFilter: true,
    enableColumnFilters: true,
    enableFilters: true,
    enableSorting: true,
    enablePagination: false,
    enableTopToolbar: true,
    enableBottomToolbar: false,
    enableDensityToggle: false,
    enableFullScreenToggle: false,
    enableHiding: true,
    enableColumnResizing: true,
    columnResizeMode: "onChange",
    layoutMode: "semantic",
    getRowId: (row) => row.no_prueba,
    onRowSelectionChange: setRowSelection,
    state: { rowSelection, density: "compact" },
    renderTopToolbarCustomActions: () => (
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-600">
          Filtros activos: Usar el icono de filtro en cada columna
        </span>
        {filasSeleccionadas > 0 && (
          <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-1">
            <span className="text-sm font-medium text-blue-700">
              {filasSeleccionadas} prueba{filasSeleccionadas !== 1 ? 's' : ''} seleccionada{filasSeleccionadas !== 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>
    ),
    muiTableContainerProps: {
      sx: {
        maxHeight: "calc(100% - 60px)", // Restamos espacio para la toolbar
        height: "auto",
        width: "100%",
        overflow: "auto",
      },
    },
    muiTableProps: {
      sx: {
        tableLayout: "fixed",
        width: "100%",
      },
    },
    muiTopToolbarProps: {
      sx: {
        minHeight: "56px",
        maxHeight: "56px",
        flexShrink: 0,
      },
    },
    muiTableHeadProps: {
      sx: {
        position: "sticky",
        top: 0,
        zIndex: 10,
        backgroundColor: "#f8fafc",
        borderBottom: "2px solid #e2e8f0",
      },
    },
    muiTableHeadCellProps: {
      sx: {
        fontWeight: 600,
        fontSize: "0.875rem",
        color: "#374151",
        padding: "8px 12px",
        backgroundColor: "#f8fafc",
        position: "sticky",
        top: 0,
        zIndex: 10,
        borderBottom: "2px solid #e2e8f0",
      },
    },
    muiTableBodyProps: {
      sx: {
        "& .MuiTableRow-root": {
          height: "10px",
          minHeight: "10px",
          "&:hover": {
            backgroundColor: "#f1f5f9",
          },
        },
      },
    },
    muiTableBodyCellProps: {
      sx: {
        padding: "1px 4px",
        fontSize: "0.8rem",
        height: "10px",
        minHeight: "10px",
        borderBottom: "1px solid #e5e7eb",
        lineHeight: "1.2",
      },
    },
    muiFilterTextFieldProps: {
      size: "small",
      variant: "outlined",
    },
    initialState: {
      density: "compact",
    },
  });

  if (pruebas.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
          <p className="text-gray-500">
            No se encontraron pruebas en curso para esta OT.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col overflow-hidden rounded-lg border">
      <MaterialReactTable table={table} />
    </div>
  );
};
