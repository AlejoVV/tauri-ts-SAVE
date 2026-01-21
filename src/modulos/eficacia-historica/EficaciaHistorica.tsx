import React from 'react';
import { TrendingUp, AlertCircle } from 'lucide-react';
import { useEficaciaHistorica } from './hooks';
import { BusquedaProductos, TablaPruebasHistoricas } from './componentes';

export const EficaciaHistorica: React.FC = () => {
  const {
    filtros,
    productos_disponibles,
    ingredientes_activos_disponibles,
    pruebas_historicas,
    loading,
    error,
    cargando_productos,
    cargando_ingredientes,
    cargando_pruebas,
    cargarProductos,
    cargarIngredientesActivos,
    buscarPruebasHistoricas,
    actualizarFiltros,
    limpiarBusqueda
  } = useEficaciaHistorica();

  const handleBuscar = () => {
    buscarPruebasHistoricas(filtros);
  };

  return (
    <div className="h-screen bg-gray-50 p-2 md:p-4 flex flex-col">
      <div className="w-full mx-auto px-2 md:px-4 flex flex-col h-full">
        {/* Header */}
        <div className="mb-4 flex-shrink-0">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="text-green-600" size={28} />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Eficacia Histórica</h1>
              <p className="text-gray-600">
                Consulte el historial de pruebas por producto o ingrediente activo
              </p>
            </div>
          </div>
        </div>

        {/* Error global */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
            <AlertCircle className="text-red-600 flex-shrink-0" size={20} />
            <div>
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Sección de Búsqueda */}
        <div className="mb-4 flex-shrink-0">
          <BusquedaProductos
            productos={productos_disponibles}
            ingredientesActivos={ingredientes_activos_disponibles}
            filtros={filtros}
            cargandoProductos={cargando_productos}
            cargandoIngredientes={cargando_ingredientes}
            onFiltrosChange={actualizarFiltros}
            onCargarProductos={cargarProductos}
            onCargarIngredientes={cargarIngredientesActivos}
            onBuscar={handleBuscar}
            onLimpiar={limpiarBusqueda}
          />
        </div>

        {/* Resultados */}
        <div className="flex-1 min-h-0">
          <TablaPruebasHistoricas
            pruebas={pruebas_historicas}
            cargando={cargando_pruebas}
          />
        </div>
      </div>
    </div>
  );
};

export default EficaciaHistorica;

