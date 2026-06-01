export function formatearFecha(fechaISO: string | null | undefined): string {
  if (!fechaISO) return 'N/A';
  try {
    return new Date(fechaISO).toLocaleDateString('es-ES', { year: 'numeric', month: '2-digit', day: '2-digit' });
  } catch (error) {
    console.error('Error al formatear fecha:', error);
    return 'Fecha inválida';
  }
}

export function formatearDosis(dosis: string | number | null | undefined, unidades: string | null | undefined): string {
  if (!dosis) return 'N/A';
  const dosisStr = typeof dosis === 'number' ? dosis.toString() : dosis;
  return unidades ? `${dosisStr} ${unidades}` : dosisStr;
}

export function obtenerColorFuente(fuente: 'pruebas_anteriores' | 'pruebas_ordenes_trabajo'): string {
  return fuente === 'pruebas_anteriores' ? 'green' : 'purple';
}

export function busquedaFlexible(texto: string, termino: string): boolean {
  if (!texto || !termino) return false;
  const normalizar = (str: string) => str.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  return normalizar(texto).includes(normalizar(termino));
}
