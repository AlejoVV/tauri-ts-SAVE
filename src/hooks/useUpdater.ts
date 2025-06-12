import { useState, useEffect, useCallback } from 'react';
import { check } from '@tauri-apps/plugin-updater';

export const useUpdater = () => {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [showLatestVersionMessage, setShowLatestVersionMessage] = useState(false);

  const checkForUpdates = useCallback(async (silent = false) => {
    if (!silent) setIsChecking(true);
    
    try {
      const update = await check();
      const hasUpdate = update?.available || false;
      setUpdateAvailable(hasUpdate);
      setLastChecked(new Date());
      
      // Si no es silent y no hay actualización, mostrar mensaje
      if (!silent && !hasUpdate) {
        setShowLatestVersionMessage(true);
      }
      
      return update;
    } catch (error) {
      console.error('Error checking for updates:', error);
      setUpdateAvailable(false);
      return null;
    } finally {
      if (!silent) setIsChecking(false);
    }
  }, []);

  // Verificar actualizaciones automáticamente al iniciar
  useEffect(() => {
    // Verificar inmediatamente
    checkForUpdates(true);
    
    // Verificar cada 6 horas
    const interval = setInterval(() => {
      checkForUpdates(true);
    }, 6 * 60 * 60 * 1000); // 6 horas

    return () => clearInterval(interval);
  }, [checkForUpdates]);

  return {
    updateAvailable,
    isChecking,
    lastChecked,
    checkForUpdates,
    showLatestVersionMessage,
    setShowLatestVersionMessage,
  };
}; 