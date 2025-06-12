import MenuOpenIcon from "@mui/icons-material/MenuOpen";
import IconButton from "@mui/material/IconButton";
import InventoryIcon from "@mui/icons-material/Inventory";
import ListAltIcon from "@mui/icons-material/ListAlt";
import Tooltip from "@mui/material/Tooltip";
import { useState } from "react";

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
];

interface SidebarProps {
  activeView: string;
  onViewChange: (viewId: string) => void;
}

function Sidebar({ activeView, onViewChange }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav
      className={`shadow-md h-screen bg-blue-500 duration-500 ${
        isOpen ? "w-38" : "w-12"
      }`}
    >
      <div
        className={`flex flex-row ${
          isOpen ? "justify-end" : "justify-center"
        } p-2`}
      >
        <IconButton
          size="small"
          aria-label="menu"
          className={`cursor-pointer duration-500 ${!isOpen && " rotate-180"}`}
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
              className={`font-semibold text-xl px-2 py-1 rounded-md duration-200 cursor-pointer flex flex-row items-center gap-2 ${
                activeView === item.id
                  ? "bg-white text-blue-500"
                  : "text-white hover:bg-white hover:text-blue-500"
              }`}
              onClick={() => onViewChange(item.id)}
            >
              <div className="text-2xl">{item.icon}</div>
              {isOpen && (
                <p
                  className={`${
                    !isOpen && "w-0 translate-x-24"
                  } overflow-hidden text-xl`}
                >
                  {item.label}
                </p>
              )}
            </li>
          </Tooltip>
        ))}
      </ul>
    </nav>
  );
}

export default Sidebar;
