// import ViewTable from "./components/ViewTable";
// import TableMaterial from "./components/TableMaterial";
//import ObjetivosConPreciosTable from "./components/TableObjetivosConPrecio";
import TableOrdenesMaestra from "./modulos/ordenes-trabajo/componentes/TableOrdenesMaestra";
import ObjetivosConPreciosTable from "./modulos/objetivos/componentes/TableObjetivosPreciosSupabase";
import { EficaciaMain } from "./modulos/eficacia/componentes/eficacia-main";
import Sidebar from "./modulos/nucleo/componentes/layout/BarraLateral";
import { useState } from "react";

function App() {
  const [activeView, setActiveView] = useState<string>("objetivos");

  const renderContent = () => {
    switch (activeView) {
      case "objetivos":
        return <ObjetivosConPreciosTable />;
      case "maestra":
        return <TableOrdenesMaestra />;
      case "eficacia":
        return <EficaciaMain />;
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
