import React, { useState, useEffect } from "react";
import { check } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  LinearProgress,
  Box,
  Alert,
  IconButton,
} from "@mui/material";
import {
  Close as CloseIcon,
  SystemUpdate as UpdateIcon,
} from "@mui/icons-material";

interface UpdaterDialogProps {
  open: boolean;
  onClose: () => void;
}

export const UpdaterDialog: React.FC<UpdaterDialogProps> = ({
  open,
  onClose,
}) => {
  const [updateStatus, setUpdateStatus] = useState<
    "checking" | "available" | "downloading" | "ready" | "none" | "error"
  >("none");
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [updateInfo, setUpdateInfo] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const checkForUpdates = async () => {
    try {
      setUpdateStatus("checking");
      setErrorMessage("");

      const update = await check();

      if (update?.available) {
        setUpdateInfo(update);
        setUpdateStatus("available");
      } else {
        setUpdateStatus("none");
        setTimeout(() => {
          onClose();
        }, 2000);
      }
    } catch (error) {
      console.error("Error checking for updates:", error);
      setErrorMessage(
        "Error al verificar actualizaciones: " + (error as Error).message
      );
      setUpdateStatus("error");
    }
  };

  const downloadAndInstall = async () => {
    if (!updateInfo) return;

    try {
      setUpdateStatus("downloading");

      await updateInfo.downloadAndInstall((event: any) => {
        switch (event.event) {
          case "Started":
            setDownloadProgress(0);
            break;
          case "Progress":
            const progress =
              (event.data.chunkLength / event.data.contentLength) * 100;
            setDownloadProgress(progress);
            break;
          case "Finished":
            setUpdateStatus("ready");
            break;
        }
      });

      // Una vez descargado, preguntar si reiniciar
      setTimeout(() => {
        setUpdateStatus("ready");
      }, 1000);
    } catch (error) {
      console.error("Error downloading update:", error);
      setErrorMessage(
        "Error al descargar la actualización: " + (error as Error).message
      );
      setUpdateStatus("error");
    }
  };

  const restartApp = async () => {
    try {
      await relaunch();
    } catch (error) {
      console.error("Error restarting app:", error);
      setErrorMessage(
        "Error al reiniciar la aplicación: " + (error as Error).message
      );
      setUpdateStatus("error");
    }
  };

  useEffect(() => {
    if (open) {
      checkForUpdates();
    }
  }, [open]);

  const getStatusMessage = () => {
    switch (updateStatus) {
      case "checking":
        return "Verificando actualizaciones...";
      case "available":
        return `Nueva versión disponible: ${updateInfo?.version}`;
      case "downloading":
        return "Descargando actualización...";
      case "ready":
        return "Actualización lista para instalar";
      case "none":
        return "Tu aplicación está actualizada";
      case "error":
        return "Error en la actualización";
      default:
        return "";
    }
  };

  const getStatusColor = () => {
    switch (updateStatus) {
      case "available":
        return "info";
      case "ready":
        return "success";
      case "error":
        return "error";
      default:
        return "info";
    }
  };

  return (
    <Dialog
      open={open}
      onClose={updateStatus === "downloading" ? undefined : onClose}
      maxWidth="sm"
      fullWidth
      disableEscapeKeyDown={updateStatus === "downloading"}
    >
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <UpdateIcon />
        Actualizaciones
        {updateStatus !== "downloading" && (
          <IconButton
            aria-label="cerrar"
            onClick={onClose}
            sx={{ position: "absolute", right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        )}
      </DialogTitle>

      <DialogContent>
        <Box sx={{ mb: 2 }}>
          <Alert severity={getStatusColor() as any}>{getStatusMessage()}</Alert>
        </Box>

        {errorMessage && (
          <Box sx={{ mb: 2 }}>
            <Alert severity="error">{errorMessage}</Alert>
          </Box>
        )}

        {updateStatus === "available" && updateInfo && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" gutterBottom>
              <strong>Versión actual:</strong> {updateInfo.currentVersion}
            </Typography>
            <Typography variant="body2" gutterBottom>
              <strong>Nueva versión:</strong> {updateInfo.version}
            </Typography>
            {updateInfo.body && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" gutterBottom>
                  <strong>Notas de la versión:</strong>
                </Typography>
                <Typography
                  variant="body2"
                  component="pre"
                  sx={{ whiteSpace: "pre-wrap", fontSize: "0.875rem" }}
                >
                  {updateInfo.body}
                </Typography>
              </Box>
            )}
          </Box>
        )}

        {updateStatus === "downloading" && (
          <Box sx={{ width: "100%", mt: 2 }}>
            <LinearProgress variant="determinate" value={downloadProgress} />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {Math.round(downloadProgress)}% completado
            </Typography>
          </Box>
        )}

        {updateStatus === "ready" && (
          <Box sx={{ mt: 2 }}>
            <Alert severity="success">
              La actualización se ha descargado correctamente. Reinicia la
              aplicación para aplicar los cambios.
            </Alert>
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        {updateStatus === "available" && (
          <>
            <Button onClick={onClose} color="inherit">
              Más tarde
            </Button>
            <Button
              onClick={downloadAndInstall}
              variant="contained"
              color="primary"
            >
              Descargar e instalar
            </Button>
          </>
        )}

        {updateStatus === "ready" && (
          <>
            <Button onClick={onClose} color="inherit">
              Reiniciar más tarde
            </Button>
            <Button onClick={restartApp} variant="contained" color="primary">
              Reiniciar ahora
            </Button>
          </>
        )}

        {(updateStatus === "none" || updateStatus === "error") && (
          <Button onClick={onClose} variant="contained">
            Cerrar
          </Button>
        )}

        {updateStatus === "checking" && (
          <Button onClick={onClose} color="inherit">
            Cancelar
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};
