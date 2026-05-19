// Hooks del módulo de eficacia

import { useState, useEffect } from "react";
import { getEfficacyTestsForMontage } from "../servicios/index";
import type { EfficacyTestData } from "../tipos/index";

/**
 * Hook para obtener las pruebas disponibles para montajes de eficacia
 */
export const useEfficacyTests = () => {
  const [tests, setTests] = useState<EfficacyTestData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTests = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getEfficacyTestsForMontage();
      setTests(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar las pruebas");
      console.error("Error al obtener pruebas de eficacia:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTests();
  }, []);

  return {
    tests,
    loading,
    error,
    refetch: fetchTests,
  };
}; 