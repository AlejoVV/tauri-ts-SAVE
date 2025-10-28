import React, { useState } from "react";
import { UserPlus, Save, Users, AlertCircle } from "lucide-react";

export const Registrar: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    telefono: "",
    empresa: "",
    cargo: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Aquí iría la lógica de registro
      // Por ahora simulamos una operación
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSuccess("Registro creado exitosamente");
      setFormData({
        nombre: "",
        email: "",
        telefono: "",
        empresa: "",
        cargo: "",
      });
    } catch (err) {
      setError("Error al crear el registro");
    } finally {
      setLoading(false);
    }
  };

  const handleLimpiar = () => {
    setFormData({
      nombre: "",
      email: "",
      telefono: "",
      empresa: "",
      cargo: "",
    });
    setError(null);
    setSuccess(null);
  };

  return (
    <div className="h-screen bg-gray-50 p-2 md:p-4 flex flex-col">
      <div className="w-full max-w-4xl mx-auto px-2 md:px-4 flex flex-col h-full">
        
        {/* Header */}
        <div className="mb-4 flex-shrink-0">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <UserPlus className="text-blue-600" size={24} />
              <h1 className="text-2xl font-bold text-gray-900">
                Módulo de Registro
              </h1>
            </div>
            <p className="text-gray-600 mt-2">
              Registre nuevos contactos y mantenga la información actualizada
            </p>
          </div>
        </div>

        {/* Formulario de Registro */}
        <div className="flex-1 min-h-0">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 h-full overflow-auto">
            
            {/* Mensajes de estado */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                <AlertCircle className="text-red-600" size={16} />
                <span className="text-red-700">{error}</span>
              </div>
            )}

            {success && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
                <Users className="text-green-600" size={16} />
                <span className="text-green-700">{success}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              
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
                      value={formData.nombre}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                      value={formData.telefono}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                      value={formData.empresa}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                      value={formData.cargo}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      Guardar Registro
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleLimpiar}
                  disabled={loading}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Limpiar
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Registrar;