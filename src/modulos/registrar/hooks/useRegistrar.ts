import { useState } from 'react';
import { FormularioRegistro, EstadoRegistro, RegistroContacto } from '../tipos';

export const useRegistrar = () => {
  const [estado, setEstado] = useState<EstadoRegistro>({
    loading: false,
    error: null,
    success: null,
  });

  const [registros, setRegistros] = useState<RegistroContacto[]>([]);

  const limpiarMensajes = () => {
    setEstado(prev => ({
      ...prev,
      error: null,
      success: null,
    }));
  };

  const crearRegistro = async (datos: FormularioRegistro): Promise<boolean> => {
    setEstado(prev => ({
      ...prev,
      loading: true,
      error: null,
      success: null,
    }));

    try {
      // Simulación de llamada a API
      // Aquí se integraría con Supabase o la API correspondiente
      await new Promise(resolve => setTimeout(resolve, 1000));

      const nuevoRegistro: RegistroContacto = {
        id: Date.now(), // ID temporal
        ...datos,
        fecha_creacion: new Date().toISOString(),
        fecha_actualizacion: new Date().toISOString(),
      };

      setRegistros(prev => [...prev, nuevoRegistro]);

      setEstado(prev => ({
        ...prev,
        loading: false,
        success: 'Registro creado exitosamente',
      }));

      return true;
    } catch (error) {
      setEstado(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
      }));

      return false;
    }
  };

  const actualizarRegistro = async (id: number, datos: Partial<FormularioRegistro>): Promise<boolean> => {
    setEstado(prev => ({
      ...prev,
      loading: true,
      error: null,
      success: null,
    }));

    try {
      // Simulación de llamada a API
      await new Promise(resolve => setTimeout(resolve, 1000));

      setRegistros(prev => prev.map(registro => 
        registro.id === id 
          ? { ...registro, ...datos, fecha_actualizacion: new Date().toISOString() }
          : registro
      ));

      setEstado(prev => ({
        ...prev,
        loading: false,
        success: 'Registro actualizado exitosamente',
      }));

      return true;
    } catch (error) {
      setEstado(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
      }));

      return false;
    }
  };

  const eliminarRegistro = async (id: number): Promise<boolean> => {
    setEstado(prev => ({
      ...prev,
      loading: true,
      error: null,
      success: null,
    }));

    try {
      // Simulación de llamada a API
      await new Promise(resolve => setTimeout(resolve, 500));

      setRegistros(prev => prev.filter(registro => registro.id !== id));

      setEstado(prev => ({
        ...prev,
        loading: false,
        success: 'Registro eliminado exitosamente',
      }));

      return true;
    } catch (error) {
      setEstado(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
      }));

      return false;
    }
  };

  const buscarRegistros = async (termino: string): Promise<RegistroContacto[]> => {
    if (!termino.trim()) {
      return registros;
    }

    const terminoLower = termino.toLowerCase();
    return registros.filter(registro => 
      registro.nombre.toLowerCase().includes(terminoLower) ||
      registro.email.toLowerCase().includes(terminoLower) ||
      registro.empresa.toLowerCase().includes(terminoLower)
    );
  };

  return {
    // Estado
    ...estado,
    registros,

    // Acciones
    crearRegistro,
    actualizarRegistro,
    eliminarRegistro,
    buscarRegistros,
    limpiarMensajes,
  };
};