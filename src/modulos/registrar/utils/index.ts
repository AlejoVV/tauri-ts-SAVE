// Utilidades para el módulo de registro

import { FormularioRegistro } from '../tipos';

/**
 * Valida los datos del formulario de registro
 */
export const validarFormularioRegistro = (datos: FormularioRegistro): string[] => {
  const errores: string[] = [];

  if (!datos.nombre.trim()) {
    errores.push('El nombre es requerido');
  }

  if (!datos.email.trim()) {
    errores.push('El email es requerido');
  } else if (!esEmailValido(datos.email)) {
    errores.push('El email no tiene un formato válido');
  }

  if (!datos.empresa.trim()) {
    errores.push('La empresa es requerida');
  }

  if (datos.telefono && !esTelefonoValido(datos.telefono)) {
    errores.push('El teléfono no tiene un formato válido');
  }

  return errores;
};

/**
 * Valida si un email tiene formato correcto
 */
export const esEmailValido = (email: string): boolean => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

/**
 * Valida si un teléfono tiene formato correcto
 */
export const esTelefonoValido = (telefono: string): boolean => {
  // Acepta formatos como: +57 300 123 4567, 300-123-4567, 3001234567
  const regex = /^[\+]?[1-9][\d]{0,15}$/;
  const telefonoLimpio = telefono.replace(/[\s\-\(\)]/g, '');
  return regex.test(telefonoLimpio);
};

/**
 * Formatea un teléfono para mostrar
 */
export const formatearTelefono = (telefono: string): string => {
  const telefonoLimpio = telefono.replace(/[\s\-\(\)]/g, '');
  
  if (telefonoLimpio.length === 10) {
    return `${telefonoLimpio.slice(0, 3)} ${telefonoLimpio.slice(3, 6)} ${telefonoLimpio.slice(6)}`;
  }
  
  return telefono;
};

/**
 * Capitaliza la primera letra de cada palabra
 */
export const capitalizarNombre = (nombre: string): string => {
  return nombre
    .toLowerCase()
    .split(' ')
    .map(palabra => palabra.charAt(0).toUpperCase() + palabra.slice(1))
    .join(' ');
};

/**
 * Limpia y formatea los datos del formulario
 */
export const limpiarDatosFormulario = (datos: FormularioRegistro): FormularioRegistro => {
  return {
    nombre: capitalizarNombre(datos.nombre.trim()),
    email: datos.email.toLowerCase().trim(),
    telefono: datos.telefono.trim(),
    empresa: datos.empresa.trim(),
    cargo: datos.cargo.trim(),
  };
};