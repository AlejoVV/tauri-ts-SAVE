// Utilidades para el módulo de Eficacia Histórica

/**
 * Formatea una fecha ISO string a formato local
 */
export const formatearFecha = (fechaISO: string | null | undefined): string => {
  if (!fechaISO) return 'N/A';
  
  try {
    return new Date(fechaISO).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  } catch {
    return 'Fecha inválida';
  }
};

/**
 * Formatea un número de dosis con sus unidades
 */
export const formatearDosis = (dosis: string | number | null | undefined, unidades: string | null | undefined): string => {
  if (!dosis) return 'N/A';
  
  const dosisStr = typeof dosis === 'number' ? dosis.toString() : dosis;
  const unidadesStr = unidades || '';
  
  return unidadesStr ? `${dosisStr} ${unidadesStr}` : dosisStr;
};

/**
 * Obtiene un color distintivo para la fuente de datos
 */
export const obtenerColorFuente = (fuente: 'pruebas_anteriores' | 'pruebas_ordenes_trabajo'): string => {
  return fuente === 'pruebas_anteriores' ? 'green' : 'purple';
};

/**
 * Verifica si un string contiene otro string ignorando mayúsculas y acentos
 */
export const busquedaFlexible = (texto: string, termino: string): boolean => {
  if (!texto || !termino) return false;
  
  const normalizarTexto = (str: string) => 
    str.toLowerCase()
       .normalize('NFD')
       .replace(/[\u0300-\u036f]/g, ''); // Remover acentos
  
  return normalizarTexto(texto).includes(normalizarTexto(termino));
};

