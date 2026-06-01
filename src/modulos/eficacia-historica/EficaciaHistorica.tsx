import { TrendingUp, AlertCircle } from 'lucide-react';
import { useEficaciaHistorica } from '@/modulos/eficacia-historica/hooks';
import { BusquedaProductos, TablaPruebasHistoricas } from '@/modulos/eficacia-historica/componentes';

export function EficaciaHistorica() {
  const {
    filtros,
    productosDisponibles,
    ingredientesActivosDisponibles,
    pruebasHistoricas,
    error,
    cargandoProductos,
    cargandoIngredientes,
    cargandoPruebas,
    cargarProductos,
    cargarIngredientesActivos,
    buscarHistorial,
    actualizarFiltros,
    limpiarBusqueda,
  } = useEficaciaHistorica();

  return (
    <div className="h-screen bg-gray-50 p-2 md:p-4 flex flex-col">
      <div className="w-full mx-auto px-2 md:px-4 flex flex-col h-full">
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

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
            <AlertCircle className="text-red-600 flex-shrink-0" size={20} />
            <div>
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        <div className="mb-4 flex-shrink-0">
          <BusquedaProductos
            productos={productosDisponibles}
            ingredientesActivos={ingredientesActivosDisponibles}
            filtros={filtros}
            cargandoProductos={cargandoProductos}
            cargandoIngredientes={cargandoIngredientes}
            onFiltrosChange={actualizarFiltros}
            onCargarProductos={cargarProductos}
            onCargarIngredientes={cargarIngredientesActivos}
            onBuscar={() => buscarHistorial(filtros)}
            onLimpiar={limpiarBusqueda}
          />
        </div>

        <div className="flex-1 min-h-0">
          <TablaPruebasHistoricas
            pruebas={pruebasHistoricas}
            cargando={cargandoPruebas}
          />
        </div>
      </div>
    </div>
  );
}
