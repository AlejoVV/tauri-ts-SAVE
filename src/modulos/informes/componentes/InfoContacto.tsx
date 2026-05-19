import React from "react";
import { Building2, User, Mail, Phone } from "lucide-react";
import { Empresa, Contacto } from "../tipos";

interface InfoContactoProps {
  empresa: Empresa;
  contacto: Contacto;
}

export const InfoContacto: React.FC<InfoContactoProps> = ({
  empresa,
  contacto,
}) => {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Información de la Empresa */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-gray-700">
            <Building2 size={18} className="text-blue-600" />
            <span className="font-medium">Empresa</span>
          </div>
          <div className="pl-6">
            <p className="text-lg font-semibold text-gray-900">
              {empresa.nombre}
            </p>
            <p className="text-sm text-gray-500">ID: {empresa.id}</p>
          </div>
        </div>

        {/* Información del Contacto */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-gray-700">
            <User size={18} className="text-green-600" />
            <span className="font-medium">Contacto Principal</span>
          </div>
          <div className="pl-6 space-y-2">
            <p className="text-lg font-semibold text-gray-900">
              {contacto.nombre}
            </p>

            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Mail size={14} className="text-gray-400" />
              <a
                href={`mailto:${contacto.email}`}
                className="text-blue-600 hover:text-blue-800 hover:underline transition-colors"
              >
                {contacto.email}
              </a>
            </div>

            {contacto.telefono && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Phone size={14} className="text-gray-400" />
                <a
                  href={`tel:${contacto.telefono}`}
                  className="text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                >
                  {contacto.telefono}
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
