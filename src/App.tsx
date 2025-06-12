// import ViewTable from "./components/ViewTable";
// import TableMaterial from "./components/TableMaterial";
//import ObjetivosConPreciosTable from "./components/TableObjetivosConPrecio";
import TableOrdenesMaestra from "./components/TableOrdenesMaestra";
import ObjetivosConPreciosTable from "./components/TableObjetivosPreciosSupabase";
import Sidebar from "./components/Sidebar";
import { useState } from "react";
import { Box, Typography, Paper } from "@mui/material";
import InventoryIcon from "@mui/icons-material/Inventory";
import ListAltIcon from "@mui/icons-material/ListAlt";

const viewConfig = {
  objetivos: {
    title: "Objetivos con Precios",
    icon: <InventoryIcon sx={{ mr: 1 }} />,
    description: "Gestión de objetivos y precios",
  },
  maestra: {
    title: "Vista Maestra",
    icon: <ListAltIcon sx={{ mr: 1 }} />,
    description: "Tabla maestra con órdenes de trabajo",
  },
};

function App() {
  const [activeView, setActiveView] = useState<string>("objetivos");

  const renderContent = () => {
    switch (activeView) {
      case "objetivos":
        return <ObjetivosConPreciosTable />;
      case "maestra":
        return <TableOrdenesMaestra />;
      default:
        return <ObjetivosConPreciosTable />;
    }
  };

  const currentView = viewConfig[activeView as keyof typeof viewConfig];

  return (
    <div className="flex flex-row h-screen w-screen">
      <Sidebar activeView={activeView} onViewChange={setActiveView} />
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <Paper
          elevation={1}
          sx={{
            p: 2,
            borderRadius: 0,
            borderBottom: "1px solid #e0e0e0",
            backgroundColor: "#f8f9fa",
          }}
        >
          <Box display="flex" alignItems="center">
            {currentView.icon}
            <Box>
              <Typography variant="h5" component="h1" fontWeight="bold">
                {currentView.title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {currentView.description}
              </Typography>
            </Box>
          </Box>
        </Paper>

        {/* Content */}
        {renderContent()}
      </div>
    </div>
  );
}

export default App;
