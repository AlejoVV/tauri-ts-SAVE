import React from 'react';
import { Save, X } from 'lucide-react';
import { FormularioRegistro as TipoFormulario } from '../tipos';

interface Props {
  datos: TipoFormulario;
  onChange: (datos: TipoFormulario) => void;
  onSubmit: (e: React.FormEvent) => void;
  onLimpiar: () => void;
  loading?: boolean;
  modo?: 'crear' | 'editar';
}

export const FormularioRegistro: React.FC<Props> = ({
  datos,
  onChange,
  onSubmit,
  onLimpiar,
  loading = false,
  modo = 'crear'
}) => {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    onChange({
      ...datos,
      [name]: value
    });
  };

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      
      {/* Información Personal */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Información Personal
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 mb-2">
              Nombre Completo *
            </label>
            <input
              type="text"
              id="nombre"
              name="nombre"
              value={datos.nombre}
              onChange={handleInputChange}
              required
              disabled={loading}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:cursor-not-allowed"
              placeholder="Ingrese el nombre completo"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Correo Electrónico *
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={datos.email}
              onChange={handleInputChange}
              required
              disabled={loading}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:cursor-not-allowed"
              placeholder="ejemplo@correo.com"
            />
          </div>

          <div>
            <label htmlFor="telefono" className="block text-sm font-medium text-gray-700 mb-2">
              Teléfono
            </label>
            <input
              type="tel"
              id="telefono"
              name="telefono"
              value={datos.telefono}
              onChange={handleInputChange}
              disabled={loading}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:cursor-not-allowed"
              placeholder="+57 300 123 4567"
            />
          </div>
        </div>
      </div>

      {/* Información Empresarial */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Información Empresarial
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="empresa" className="block text-sm font-medium text-gray-700 mb-2">
              Empresa *
            </label>
            <input
              type="text"
              id="empresa"
              name="empresa"
              value={datos.empresa}
              onChange={handleInputChange}
              required
              disabled={loading}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:cursor-not-allowed"
              placeholder="Nombre de la empresa"
            />
          </div>

          <div>
            <label htmlFor="cargo" className="block text-sm font-medium text-gray-700 mb-2">
              Cargo
            </label>
            <input
              type="text"
              id="cargo"
              name="cargo"
              value={datos.cargo}
              onChange={handleInputChange}
              disabled={loading}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:cursor-not-allowed"
              placeholder="Cargo o posición"
            />
          </div>
        </div>
      </div>

      {/* Botones de acción */}
      <div className="flex gap-4 pt-6 border-t border-gray-200">
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              {modo === 'crear' ? 'Guardando...' : 'Actualizando...'}
            </>
          ) : (
            <>
              <Save size={16} />
              {modo === 'crear' ? 'Guardar Registro' : 'Actualizar Registro'}
            </>
          )}
        </button>

        <button
          type="button"
          onClick={onLimpiar}
          disabled={loading}
          className="flex items-center gap-2 px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <X size={16} />
          Limpiar
        </button>
      </div>
    </form>
  );
};