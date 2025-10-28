// Servicios para el módulo de registro
// Aquí se implementarán las llamadas a APIs, Supabase, etc.

import { FormularioRegistro, RegistroContacto } from '../tipos';

export class RegistroService {
  // Placeholder para futuras implementaciones
  static async crearRegistro(datos: FormularioRegistro): Promise<RegistroContacto> {
    // Implementar llamada a Supabase o API
    throw new Error('Método no implementado');
  }

  static async obtenerRegistros(): Promise<RegistroContacto[]> {
    // Implementar llamada a Supabase o API
    throw new Error('Método no implementado');
  }

  static async actualizarRegistro(id: number, datos: Partial<FormularioRegistro>): Promise<RegistroContacto> {
    // Implementar llamada a Supabase o API
    throw new Error('Método no implementado');
  }

  static async eliminarRegistro(id: number): Promise<boolean> {
    // Implementar llamada a Supabase o API
    throw new Error('Método no implementado');
  }
}