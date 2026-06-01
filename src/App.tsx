import { TableOrdenesMaestra } from "@/modulos/maestra/componentes/TableOrdenesMaestra";
import { ObjetivosConPreciosTable } from "@/modulos/objetivos/componentes/TableObjetivosPreciosSupabase";
import { EficaciaMain } from "@/modulos/eficacia/componentes/EficaciaMain";
import { Informes } from "@/modulos/informes";
import { RegisterWorkOrderPage } from "@/modulos/registrar/componentes/RegisterWorkOrderPage";
import { ManageWorkOrderPage } from "@/modulos/gestionar/componentes/ManageWorkOrderPage";
import { EficaciaHistorica } from "@/modulos/eficacia-historica";
import { BarraLateral } from "@/modulos/nucleo/componentes/layout/BarraLateral";
import { useState } from "react";

function App() {
  const [activeView, setActiveView] = useState<string>("eficacia");

  const renderContent = () => {
    switch (activeView) {
      case "objetivos":
        return <ObjetivosConPreciosTable />;
      case "maestra":
        return <TableOrdenesMaestra />;
      case "eficacia":
        return <EficaciaMain />;
      case "registrar":
        return <RegisterWorkOrderPage />;
      case "gestionar":
        return <ManageWorkOrderPage />;
      case "informes":
        return <Informes />;
      case "eficacia-historica":
        return <EficaciaHistorica />;
      default:
        return <ObjetivosConPreciosTable />;
    }
  };

  return (
    <div className="flex flex-row h-screen w-screen">
      <BarraLateral activeView={activeView} onViewChange={setActiveView} />
      <div className="flex-1 overflow-hidden">{renderContent()}</div>
    </div>
  );
}

export default App;
