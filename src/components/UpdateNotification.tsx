import React, { useState } from "react";
import {
  Snackbar,
  Alert,
  Button,
  Box,
  IconButton,
  Chip,
  Typography,
} from "@mui/material";
import {
  SystemUpdate as UpdateIcon,
  Close as CloseIcon,
  Refresh as RefreshIcon,
} from "@mui/icons-material";
import { useUpdater } from "../hooks/useUpdater";
import { UpdaterDialog } from "./UpdaterDialog";

export const UpdateNotification: React.FC = () => {
  const { updateAvailable, isChecking, checkForUpdates } = useUpdater();
  const [showDialog, setShowDialog] = useState(false);
  const [notificationDismissed, setNotificationDismissed] = useState(false);

  const handleOpenDialog = () => {
    setShowDialog(true);
    setNotificationDismissed(true);
  };

  const handleCloseDialog = () => {
    setShowDialog(false);
  };

  const handleDismissNotification = () => {
    setNotificationDismissed(true);
  };

  const handleCheckUpdates = () => {
    checkForUpdates(false);
  };

  return (
    <>
      {/* Notificación flotante */}
      <Snackbar
        open={updateAvailable && !notificationDismissed}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        autoHideDuration={null}
      >
        <Alert
          severity="info"
          variant="filled"
          sx={{
            width: "100%",
            alignItems: "center",
            "& .MuiAlert-message": {
              display: "flex",
              alignItems: "center",
              gap: 1,
              flex: 1,
            },
          }}
          icon={<UpdateIcon />}
          action={
            <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
              <Button
                color="inherit"
                size="small"
                onClick={handleOpenDialog}
                variant="outlined"
                sx={{ borderColor: "rgba(255,255,255,0.5)" }}
              >
                Actualizar
              </Button>
              <IconButton
                size="small"
                aria-label="cerrar"
                color="inherit"
                onClick={handleDismissNotification}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>
          }
        >
          <Typography variant="body2">
            Nueva actualización disponible
          </Typography>
        </Alert>
      </Snackbar>

      {/* Indicador en la barra superior (opcional) */}
      {updateAvailable && (
        <Box
          sx={{
            position: "fixed",
            top: 0,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 1300,
            mt: 1,
          }}
        >
          <Chip
            icon={<UpdateIcon />}
            label="Actualización disponible"
            color="primary"
            variant="filled"
            clickable
            onClick={handleOpenDialog}
            sx={{
              cursor: "pointer",
              boxShadow: 2,
              "&:hover": {
                boxShadow: 4,
              },
            }}
          />
        </Box>
      )}

      {/* Botón flotante para verificar actualizaciones manualmente */}
      <Box
        sx={{
          position: "fixed",
          bottom: 16,
          left: 16,
          zIndex: 1000,
        }}
      >
        <IconButton
          color="primary"
          onClick={handleCheckUpdates}
          disabled={isChecking}
          sx={{
            backgroundColor: "background.paper",
            border: 1,
            borderColor: "divider",
            "&:hover": {
              backgroundColor: "action.hover",
            },
            ...(isChecking && {
              animation: "spin 1s linear infinite",
            }),
          }}
          title="Verificar actualizaciones"
        >
          <RefreshIcon />
        </IconButton>
      </Box>

      {/* Diálogo de actualización */}
      <UpdaterDialog open={showDialog} onClose={handleCloseDialog} />

      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}
      </style>
    </>
  );
};
