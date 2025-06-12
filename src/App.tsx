// import ViewTable from "./components/ViewTable";
// import TableMaterial from "./components/TableMaterial";
//import ObjetivosConPreciosTable from "./components/TableObjetivosConPrecio";
import TableOrdenesMaestra from "./components/TableOrdenesMaestra";
import ObjetivosConPreciosTable from "./components/TableObjetivosPreciosSupabase";
import Sidebar from "./components/Sidebar";
import { useState } from "react";

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

  return (
    <div className="flex flex-row h-screen w-screen">
      <Sidebar activeView={activeView} onViewChange={setActiveView} />
      <div className="flex-1 overflow-hidden">{renderContent()}</div>
    </div>
  );
}

export default App;
