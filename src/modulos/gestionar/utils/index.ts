export * from '@/modulos/registrar/utils';

import { format } from "date-fns";
import { es } from "date-fns/locale";

export function formatDate(dateString: string | null): string {
  if (!dateString) return "-";
  try {
    return format(new Date(dateString), "dd/MM/yyyy", { locale: es });
  } catch (error) {
    console.error("Error al formatear fecha:", error);
    return "-";
  }
}
