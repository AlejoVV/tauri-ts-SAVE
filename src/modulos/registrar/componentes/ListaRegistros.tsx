import React from 'react';
import { Edit2, Trash2, Mail, Phone, Building } from 'lucide-react';
import { RegistroContacto } from '../tipos';

interface Props {
  registros: RegistroContacto[];
  onEditar?: (registro: RegistroContacto) => void;
  onEliminar?: (id: number) => void;
  loading?: boolean;
}

export const ListaRegistros: React.FC<Props> = ({
  registros,
  onEditar,
  onEliminar,
  loading = false
}) => {
  if (registros.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
        <Building className="mx-auto text-gray-300 mb-4" size={48} />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No hay registros
        </h3>
        <p className="text-gray-500">
          Los registros que cree aparecerán aquí.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">
          Registros Creados ({registros.length})
        </h3>
      </div>

      <div className="divide-y divide-gray-200">
        {registros.map((registro) => (
          <div key={registro.id} className="p-6 hover:bg-gray-50 transition-colors">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h4 className="text-lg font-semibold text-gray-900">
                    {registro.nombre}
                  </h4>
                  {registro.cargo && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                      {registro.cargo}
                    </span>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Mail size={16} />
                    <span>{registro.email}</span>
                  </div>

                  {registro.telefono && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Phone size={16} />
                      <span>{registro.telefono}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-gray-600">
                    <Building size={16} />
                    <span>{registro.empresa}</span>
                  </div>
                </div>

                {registro.fecha_creacion && (
                  <div className="mt-3 text-sm text-gray-500">
                    Creado: {new Date(registro.fecha_creacion).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                )}
              </div>

              <div className="flex gap-2 ml-4">
                {onEditar && (
                  <button
                    onClick={() => onEditar(registro)}
                    disabled={loading}
                    className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Editar registro"
                  >
                    <Edit2 size={16} />
                  </button>
                )}

                {onEliminar && registro.id && (
                  <button
                    onClick={() => onEliminar(registro.id!)}
                    disabled={loading}
                    className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Eliminar registro"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};