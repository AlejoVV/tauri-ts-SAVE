import { useState, useCallback, useMemo } from "react";
import { Search, Package, X, Loader2, Pill, Beaker } from "lucide-react";
import type { Producto, IngredienteActivo, BusquedaFiltros } from "@/modulos/eficacia-historica/tipos";
import { cn } from "@/lib/utils";

interface BusquedaProductosProps {
  productos: Producto[];
  ingredientesActivos: IngredienteActivo[];
  filtros: BusquedaFiltros;
  cargandoProductos: boolean;
  cargandoIngredientes: boolean;
  onFiltrosChange: (filtros: Partial<BusquedaFiltros>) => void;
  onCargarProductos: (termino: string) => void;
  onCargarIngredientes: (termino: string) => void;
  onBuscar: () => void;
  onLimpiar: () => void;
}

export function BusquedaProductos({
  productos,
  ingredientesActivos,
  filtros,
  cargandoProductos,
  cargandoIngredientes,
  onFiltrosChange,
  onCargarProductos,
  onCargarIngredientes,
  onBuscar,
  onLimpiar,
}: BusquedaProductosProps) {
  const [mostrarOpcionesProductos, setMostrarOpcionesProductos] = useState(false);
  const [mostrarOpcionesIngredientes, setMostrarOpcionesIngredientes] = useState(false);
  const [terminoBusquedaProductos, setTerminoBusquedaProductos] = useState("");
  const [terminoBusquedaIngredientes, setTerminoBusquedaIngredientes] = useState("");

  const productosFiltrados = useMemo(() => {
    if (!terminoBusquedaProductos.trim()) return productos;
    return productos.filter(
      (producto) =>
        producto.producto_nombre.toLowerCase().includes(terminoBusquedaProductos.toLowerCase()) ||
        (producto.producto_ingrediente_activo &&
          producto.producto_ingrediente_activo.toLowerCase().includes(terminoBusquedaProductos.toLowerCase()))
    );
  }, [productos, terminoBusquedaProductos]);

  const ingredientesFiltrados = useMemo(() => {
    if (!terminoBusquedaIngredientes.trim()) return ingredientesActivos;
    return ingredientesActivos.filter((ingrediente) =>
      ingrediente.ingrediente_activo.toLowerCase().includes(terminoBusquedaIngredientes.toLowerCase())
    );
  }, [ingredientesActivos, terminoBusquedaIngredientes]);

  const handleBusquedaProductosChange = useCallback(
    (valor: string) => {
      setTerminoBusquedaProductos(valor);
      if (valor.trim()) onCargarProductos(valor);
      setMostrarOpcionesProductos(valor.trim().length > 0);
    },
    [onCargarProductos]
  );

  const handleBusquedaIngredientesChange = useCallback(
    (valor: string) => {
      setTerminoBusquedaIngredientes(valor);
      if (valor.trim()) onCargarIngredientes(valor);
      setMostrarOpcionesIngredientes(valor.trim().length > 0);
    },
    [onCargarIngredientes]
  );

  const handleSeleccionarProducto = useCallback(
    (producto: Producto) => {
      onFiltrosChange({
        tipoBusqueda: "producto",
        terminoBusqueda: producto.producto_nombre,
        productoSeleccionado: producto,
        ingredienteActivoSeleccionado: undefined,
      });
      setTerminoBusquedaProductos(producto.producto_nombre);
      setMostrarOpcionesProductos(false);
      setTerminoBusquedaIngredientes("");
    },
    [onFiltrosChange]
  );

  const handleSeleccionarIngrediente = useCallback(
    (ingrediente: IngredienteActivo) => {
      onFiltrosChange({
        tipoBusqueda: "ingrediente_activo",
        terminoBusqueda: ingrediente.ingrediente_activo,
        ingredienteActivoSeleccionado: ingrediente.ingrediente_activo,
        productoSeleccionado: undefined,
      });
      setTerminoBusquedaIngredientes(ingrediente.ingrediente_activo);
      setMostrarOpcionesIngredientes(false);
      setTerminoBusquedaProductos("");
    },
    [onFiltrosChange]
  );

  const handleLimpiar = useCallback(() => {
    setTerminoBusquedaProductos("");
    setTerminoBusquedaIngredientes("");
    setMostrarOpcionesProductos(false);
    setMostrarOpcionesIngredientes(false);
    onLimpiar();
  }, [onLimpiar]);

  const tieneSeleccion = filtros.productoSeleccionado || filtros.ingredienteActivoSeleccionado;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="flex items-center gap-4 mb-4">
        <Package className="text-blue-600" size={20} />
        <h2 className="text-lg font-semibold text-gray-900">
          Búsqueda de Eficacia Histórica
        </h2>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Pill className="text-blue-600" size={16} />
              Buscar por Nombre de Producto
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                value={terminoBusquedaProductos}
                onChange={(e) => handleBusquedaProductosChange(e.target.value)}
                onFocus={() => setMostrarOpcionesProductos(terminoBusquedaProductos.trim().length > 0)}
                placeholder="Ej: BIOCITRIC, TrichoFunza..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              {cargandoProductos && (
                <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 animate-spin" size={16} />
              )}
            </div>

            {mostrarOpcionesProductos && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                {cargandoProductos && (
                  <div className="p-3 text-center text-gray-500">
                    <Loader2 className="animate-spin mx-auto mb-2" size={20} />
                    Cargando productos...
                  </div>
                )}

                {!cargandoProductos && productosFiltrados.length === 0 && terminoBusquedaProductos.trim() && (
                  <div className="p-3 text-center text-gray-500">
                    No se encontraron productos para "{terminoBusquedaProductos}"
                  </div>
                )}

                {!cargandoProductos &&
                  productosFiltrados.map((producto) => (
                    <button
                      key={producto.producto_id}
                      onClick={() => handleSeleccionarProducto(producto)}
                      className="w-full text-left p-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                    >
                      <div className="font-medium text-gray-900">{producto.producto_nombre}</div>
                      {producto.producto_ingrediente_activo && (
                        <div className="text-sm text-gray-500">I.A.: {producto.producto_ingrediente_activo}</div>
                      )}
                      {producto.producto_casa_comercial && (
                        <div className="text-xs text-gray-400">{producto.producto_casa_comercial}</div>
                      )}
                    </button>
                  ))}
              </div>
            )}
          </div>

          <div className="relative">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Beaker className="text-green-600" size={16} />
              Buscar por Ingrediente Activo
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                value={terminoBusquedaIngredientes}
                onChange={(e) => handleBusquedaIngredientesChange(e.target.value)}
                onFocus={() => setMostrarOpcionesIngredientes(terminoBusquedaIngredientes.trim().length > 0)}
                placeholder="Ej: Flupyradifuron, Abamectina..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
              {cargandoIngredientes && (
                <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 animate-spin" size={16} />
              )}
            </div>

            {mostrarOpcionesIngredientes && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                {cargandoIngredientes && (
                  <div className="p-3 text-center text-gray-500">
                    <Loader2 className="animate-spin mx-auto mb-2" size={20} />
                    Cargando ingredientes...
                  </div>
                )}

                {!cargandoIngredientes && ingredientesFiltrados.length === 0 && terminoBusquedaIngredientes.trim() && (
                  <div className="p-3 text-center text-gray-500">
                    No se encontraron ingredientes para "{terminoBusquedaIngredientes}"
                  </div>
                )}

                {!cargandoIngredientes &&
                  ingredientesFiltrados.map((ingrediente) => (
                    <button
                      key={ingrediente.ingrediente_activo}
                      onClick={() => handleSeleccionarIngrediente(ingrediente)}
                      className="w-full text-left p-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                    >
                      <div className="font-medium text-gray-900">{ingrediente.ingrediente_activo}</div>
                      <div className="text-sm text-gray-500">
                        {ingrediente.cantidad_productos} producto(s) disponible(s)
                      </div>
                    </button>
                  ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-2 justify-end">
          <button
            onClick={handleLimpiar}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2"
          >
            <X size={16} />
            Limpiar
          </button>

          <button
            onClick={onBuscar}
            disabled={!tieneSeleccion}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Search size={16} />
            Buscar Historial
          </button>
        </div>

        {tieneSeleccion && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2">
              <div
                className={cn(
                "px-2 py-1 rounded text-xs font-medium",
                filtros.tipoBusqueda === "producto" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"
              )}
              >
                {filtros.tipoBusqueda === "producto" ? "Producto" : "Ingrediente Activo"}
              </div>
              <span className="text-sm text-gray-700">
                Seleccionado: <strong>{filtros.terminoBusqueda}</strong>
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
