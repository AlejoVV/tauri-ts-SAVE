import React from "react";
import { Search, X } from "lucide-react";

interface BusquedaOTProps {
  valor: string;
  onCambio: (valor: string) => void;
  onBuscar: () => void;
  onLimpiar: () => void;
  loading: boolean;
  error: string | null;
}

export const BusquedaOT: React.FC<BusquedaOTProps> = ({
  valor,
  onCambio,
  onBuscar,
  onLimpiar,
  loading,
  error,
}) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onBuscar();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      onBuscar();
    }
  };

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative">
          <input
            type="text"
            value={valor}
            onChange={(e) => onCambio(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ingrese número de OT..."
            className={`w-full px-4 py-2 pr-20 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
              error
                ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                : "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
            }`}
            disabled={loading}
          />

          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex gap-1">
            {valor && (
              <button
                type="button"
                onClick={onLimpiar}
                className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                disabled={loading}
              >
                <X size={16} />
              </button>
            )}

            <button
              type="submit"
              disabled={loading || !valor.trim()}
              className="p-1 text-blue-500 hover:text-blue-700 disabled:text-gray-300 transition-colors"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent" />
              ) : (
                <Search size={16} />
              )}
            </button>
          </div>
        </div>
      </form>

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
};
