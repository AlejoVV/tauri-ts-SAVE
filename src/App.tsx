// import ViewTable from "./components/ViewTable";
// import TableMaterial from "./components/TableMaterial";
//import ObjetivosConPreciosTable from "./components/TableObjetivosConPrecio";
import ObjetivosConPreciosTable from "./components/TableObjetivosPreciosSupabase";
import Sidebar from "./components/Sidebar";

function App() {
  return (
    <div className="flex flex-row h-screen w-screen">
      <Sidebar />
      <ObjetivosConPreciosTable />
    </div>
  );
}

export default App;
