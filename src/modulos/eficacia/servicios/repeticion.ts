import { supabase } from "../../nucleo/lib/supabaseClient";

/**
 * Marca pruebas específicas para repetición cambiando su estado_proceso a "Repetición"
 * También elimina las pruebas de montajes existentes y elimina montajes que queden vacíos
 */
export const marcarPruebasParaRepeticion = async (
  pruebaIds: string[]
): Promise<{ success: boolean; error?: string }> => {
  try {
    if (!pruebaIds || pruebaIds.length === 0) {
      return { success: true }; // No hay pruebas para marcar
    }

    // Convertir string IDs a números
    const pruebaIdsNumeros = pruebaIds.map(id => parseInt(id, 10)).filter(id => !isNaN(id));

    if (pruebaIdsNumeros.length === 0) {
      return { success: false, error: "IDs de prueba inválidos" };
    }

    // 1. Obtener los montajes que contienen estas pruebas
    const { data: pruebasEnMontajes, error: montajesError } = await supabase
      .from("pruebas_en_montajes")
      .select("montaje_id, prueba_id")
      .in("prueba_id", pruebaIdsNumeros);

    if (montajesError) {
      console.error("Error al obtener montajes de las pruebas:", montajesError);
      return { success: false, error: "Error al obtener montajes de las pruebas" };
    }

    // Obtener IDs únicos de montajes afectados
    const montajesAfectados = [...new Set(pruebasEnMontajes?.map(p => p.montaje_id) || [])];

    // 2. Eliminar las pruebas de los montajes
    if (pruebasEnMontajes && pruebasEnMontajes.length > 0) {
      const { error: deleteError } = await supabase
        .from("pruebas_en_montajes")
        .delete()
        .in("prueba_id", pruebaIdsNumeros);

      if (deleteError) {
        console.error("Error al eliminar pruebas de montajes:", deleteError);
        return { success: false, error: "Error al eliminar pruebas de montajes" };
      }

      console.log(`Eliminadas ${pruebasEnMontajes.length} pruebas de montajes`);
    }

    // 3. Verificar y eliminar montajes que quedaron vacíos
    for (const montajeId of montajesAfectados) {
      if (montajeId) {
        // Verificar si el montaje tiene pruebas restantes
        const { data: pruebasRestantes, error: countError } = await supabase
          .from("pruebas_en_montajes")
          .select("id")
          .eq("montaje_id", montajeId);

        if (countError) {
          console.error(`Error al verificar pruebas restantes en montaje ${montajeId}:`, countError);
          continue; // Continuar con el siguiente montaje
        }

        // Si no hay pruebas restantes, eliminar el montaje
        if (!pruebasRestantes || pruebasRestantes.length === 0) {
          // Primero eliminar registros de eficacia relacionados
          const { error: deleteEficaciaError } = await supabase
            .from("eficacia_de_pruebas")
            .delete()
            .eq("montaje_id", montajeId);

          if (deleteEficaciaError) {
            console.error(`Error al eliminar eficacia del montaje ${montajeId}:`, deleteEficaciaError);
          }

          // Eliminar resultados de lecturas relacionados
          const { error: deleteLecturasError } = await supabase
            .from("resultados_lecturas")
            .delete()
            .eq("montaje_id", montajeId);

          if (deleteLecturasError) {
            console.error(`Error al eliminar lecturas del montaje ${montajeId}:`, deleteLecturasError);
          }

          // Finalmente eliminar el montaje
          const { error: deleteMontajeError } = await supabase
            .from("montajes_de_laboratorio")
            .delete()
            .eq("id", montajeId);

          if (deleteMontajeError) {
            console.error(`Error al eliminar montaje ${montajeId}:`, deleteMontajeError);
          } else {
            console.log(`Montaje ${montajeId} eliminado por quedar vacío`);
          }
        }
      }
    }

    // 4. Actualizar el estado de proceso de las pruebas seleccionadas
    const { error: updateError } = await supabase
      .from("pruebas_ordenes_trabajo")
      .update({ prueba_estado_proceso: "Repetición" })
      .in("prueba_id", pruebaIdsNumeros);

    if (updateError) {
      console.error("Error al marcar pruebas para repetición:", updateError);
      return { success: false, error: "Error al marcar pruebas para repetición" };
    }

    console.log(`Estado actualizado a 'Repetición' para ${pruebaIdsNumeros.length} pruebas`);
    return { success: true };
  } catch (error) {
    console.error("Error inesperado al marcar pruebas para repetición:", error);
    return { success: false, error: "Error inesperado al marcar pruebas para repetición" };
  }
};