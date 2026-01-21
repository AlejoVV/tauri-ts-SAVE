import React, { useMemo } from 'react';
import { FileText, Calendar, Building, User, Beaker, Target } from 'lucide-react';
import { PruebaHistorica } from '../tipos';

interface TablaPruebasHistoricasProps {
  pruebas: PruebaHistorica[];
  cargando: boolean;
}

export const TablaPruebasHistoricas: React.FC<TablaPruebasHistoricasProps> = ({
  pruebas,
  cargando
}) => {
  // Estadísticas
  const estadisticas = useMemo(() => {
    const totalPruebas = pruebas.length;
    const pruebasAnteriores = pruebas.filter(p => p.fuente === 'pruebas_anteriores').length;
    const pruebasOrdenes = pruebas.filter(p => p.fuente === 'pruebas_ordenes_trabajo').length;
    const especiesUnicas = new Set(pruebas.map(p => p.especie_vegetal)).size;
    const productosUnicos = new Set(pruebas.map(p => p.producto)).size;

    return {
      totalPruebas,
      pruebasAnteriores,
      pruebasOrdenes,
      especiesUnicas,
      productosUnicos
    };
  }, [pruebas]);

  if (cargando) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Buscando pruebas históricas...</p>
        </div>
      </div>
    );
  }

  if (pruebas.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <div className="text-center">
          <FileText className="mx-auto text-gray-300 mb-4" size={48} />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No se encontraron pruebas históricas
          </h3>
          <p className="text-gray-500">
            Seleccione un producto o ingrediente activo para buscar su historial de pruebas.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Estadísticas */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{estadisticas.totalPruebas}</div>
            <div className="text-sm text-gray-600">Total Pruebas</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{estadisticas.pruebasAnteriores}</div>
            <div className="text-sm text-gray-600">Pruebas Anteriores</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{estadisticas.pruebasOrdenes}</div>
            <div className="text-sm text-gray-600">Órdenes Trabajo</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{estadisticas.especiesUnicas}</div>
            <div className="text-sm text-gray-600">Especies</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{estadisticas.productosUnicos}</div>
            <div className="text-sm text-gray-600">Productos</div>
          </div>
        </div>
      </div>

      {/* Tabla de pruebas */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Número Prueba
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Producto
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dosis
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Especie Vegetal
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Objetivo
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Finca
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fuente
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {pruebas.map((prueba, index) => (
                <tr key={`${prueba.fuente}-${prueba.numero_prueba}-${index}`} className="hover:bg-gray-50">
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <FileText className="text-gray-400 mr-2" size={16} />
                      <span className="text-sm font-medium text-gray-900">
                        {prueba.numero_prueba}
                      </span>
                    </div>
                  </td>
                  
                  <td className="px-4 py-4">
                    <div className="text-sm text-gray-900 font-medium">{prueba.producto}</div>
                    {prueba.casa_comercial && (
                      <div className="flex items-center text-xs text-gray-500 mt-1">
                        <Building size={12} className="mr-1" />
                        {prueba.casa_comercial}
                      </div>
                    )}
                  </td>
                  
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Beaker className="text-gray-400 mr-2" size={14} />
                      <div>
                        <div className="text-sm text-gray-900">{prueba.dosis}</div>
                        <div className="text-xs text-gray-500">{prueba.unidades}</div>
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">{prueba.especie_vegetal}</span>
                  </td>
                  
                  <td className="px-4 py-4">
                    {prueba.objetivo ? (
                      <div className="flex items-center">
                        <Target className="text-gray-400 mr-2" size={14} />
                        <span className="text-sm text-gray-900">{prueba.objetivo}</span>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">N/A</span>
                    )}
                  </td>
                  
                  <td className="px-4 py-4 whitespace-nowrap">
                    {prueba.finca ? (
                      <span className="text-sm text-gray-900">{prueba.finca}</span>
                    ) : (
                      <span className="text-sm text-gray-400">N/A</span>
                    )}
                  </td>
                  
                  <td className="px-4 py-4 whitespace-nowrap">
                    {prueba.fecha_creacion ? (
                      <div className="flex items-center">
                        <Calendar className="text-gray-400 mr-2" size={14} />
                        <span className="text-sm text-gray-900">{prueba.fecha_creacion}</span>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">N/A</span>
                    )}
                  </td>
                  
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      prueba.fuente === 'pruebas_anteriores'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-purple-100 text-purple-800'
                    }`}>
                      {prueba.fuente === 'pruebas_anteriores' ? 'Históricas' : 'Órdenes'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Información adicional */}
      {pruebas.some(p => p.contacto) && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
            <User className="mr-2" size={16} />
            Contactos Asociados
          </h3>
          <div className="flex flex-wrap gap-2">
            {Array.from(new Set(pruebas.filter(p => p.contacto).map(p => p.contacto)))
              .map(contacto => (
                <span
                  key={contacto}
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                >
                  {contacto}
                </span>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};

