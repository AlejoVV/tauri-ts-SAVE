import MenuOpenIcon from "@mui/icons-material/MenuOpen";
import IconButton from "@mui/material/IconButton";
import InventoryIcon from "@mui/icons-material/Inventory";
import ListAltIcon from "@mui/icons-material/ListAlt";
import ScienceIcon from "@mui/icons-material/Science";
import AddBoxIcon from "@mui/icons-material/AddBox";
import SettingsIcon from "@mui/icons-material/Settings";
import DescriptionIcon from "@mui/icons-material/Description";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import Tooltip from "@mui/material/Tooltip";
import { useState } from "react";
import { cn } from "@/lib/utils";

const itemsMenu = [
  {
    id: "objetivos",
    label: "Objetivos",
    icon: <InventoryIcon fontSize="large" color="inherit" />,
  },
  {
    id: "maestra",
    label: "Maestra",
    icon: <ListAltIcon fontSize="large" color="inherit" />,
  },
  {
    id: "eficacia",
    label: "Eficacia",
    icon: <ScienceIcon fontSize="large" color="inherit" />,
  },
  {
    id: "registrar",
    label: "Registrar",
    icon: <AddBoxIcon fontSize="large" color="inherit" />,
  },
  {
    id: "gestionar",
    label: "Gestionar",
    icon: <SettingsIcon fontSize="large" color="inherit" />,
  },
  {
    id: "informes",
    label: "Informes",
    icon: <DescriptionIcon fontSize="large" color="inherit" />,
  },
  {
    id: "eficacia-historica",
    label: "Eficacia Histórica",
    icon: <TrendingUpIcon fontSize="large" color="inherit" />,
  },
];

interface BarraLateralProps {
  activeView: string;
  onViewChange: (viewId: string) => void;
}

export function BarraLateral({ activeView, onViewChange }: BarraLateralProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className={cn("shadow-md h-screen bg-blue-500 duration-500", isOpen ? "w-38" : "w-12")}>
      <div className={cn("flex flex-row p-2", isOpen ? "justify-end" : "justify-center")}>
        <IconButton
          size="small"
          aria-label="menu"
          className={cn("cursor-pointer duration-500", !isOpen && "rotate-180")}
          onClick={() => setIsOpen(!isOpen)}
        >
          <MenuOpenIcon fontSize="large" className="text-white" />
        </IconButton>
      </div>
      <ul>
        {itemsMenu.map((item, index) => (
          <Tooltip
            key={index}
            title={<p className="text-sm font-semibold">{item.label}</p>}
            placement="right"
            disableHoverListener={isOpen}
            disableTouchListener={isOpen}
            disableFocusListener={isOpen}
          >
            <li
              className={cn(
                "font-semibold text-xl px-2 py-1 rounded-md duration-200 cursor-pointer flex flex-row items-center gap-2",
                activeView === item.id
                  ? "bg-white text-blue-500"
                  : "text-white hover:bg-white hover:text-blue-500"
              )}
              onClick={() => onViewChange(item.id)}
            >
              <div className="text-2xl">{item.icon}</div>
              {isOpen && (
                <p className="overflow-hidden text-xl">{item.label}</p>
              )}
            </li>
          </Tooltip>
        ))}
      </ul>
    </nav>
  );
}
