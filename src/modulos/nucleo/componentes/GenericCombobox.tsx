import React, {
  useState,
  useCallback,
  useMemo,
  memo,
  useRef,
  useEffect,
} from "react";
import { Check, ChevronsUpDown, Plus, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export interface ComboboxItem {
  value: string;
  label: string;
  id?: number;
  unidades?: string; // Para productos - valor de producto_unidades
  tipoPrueba?: string; // Para objetivos - valor de objetivo_tipo_prueba
}

interface GenericComboboxProps {
  items: ComboboxItem[];
  value: string;
  onValueChange: (value: string, item?: ComboboxItem) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  onCreateNew?: () => void;
  createNewLabel?: string;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
}

// Memoized list item component (rerender-memo - Vercel best practice)
const ComboboxListItem = memo(
  React.forwardRef<
    HTMLDivElement,
    {
      item: ComboboxItem;
      isSelected: boolean;
      onSelect: () => void;
      isHighlighted: boolean;
    }
  >(({ item, isSelected, onSelect, isHighlighted }, ref) => (
    <div
      ref={ref}
      onClick={onSelect}
      className={cn(
        "relative flex items-start cursor-pointer select-none py-2 px-3 text-sm outline-none transition-colors",
        "hover:bg-accent hover:text-accent-foreground",
        isSelected && "bg-primary/10 font-medium",
        isHighlighted && "bg-accent"
      )}
    >
      <Check
        className={cn(
          "mr-2 h-4 w-4 flex-shrink-0 self-start mt-0.5",
          isSelected ? "opacity-100" : "opacity-0"
        )}
      />
      <span className="whitespace-normal break-words leading-tight flex-1">
        {item.label}
      </span>
    </div>
  ))
);
ComboboxListItem.displayName = "ComboboxListItem";

export function GenericCombobox({
  items,
  value,
  onValueChange,
  placeholder = "Seleccionar...",
  searchPlaceholder = "Buscar...",
  emptyMessage = "No se encontraron resultados.",
  onCreateNew,
  createNewLabel = "Crear nuevo",
  disabled = false,
  loading = false,
  className,
}: GenericComboboxProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  // js-cache-property-access - Cache selectedItem lookup
  const selectedItem = useMemo(
    () => items.find((item) => item.value === value),
    [items, value]
  );

  // Volver scroll arriba cuando cambia la búsqueda
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [searchQuery]);

  // Función para normalizar strings (quitar acentos, convertir a minúsculas)
  // js-cache-function-results - Memoized normalization
  const normalizeString = useCallback(
    (str: string) =>
      str
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase(),
    []
  );

  // Filtrar y ordenar items basado en la búsqueda
  // rerender-memo - Expensive filtering memoized
  const filteredAndSortedItems = useMemo(() => {
    // js-early-exit - Return early if no search
    if (!searchQuery.trim()) {
      // Si hay valor seleccionado, ponerlo primero
      if (value) {
        const selected = items.filter((item) => item.value === value);
        const others = items.filter((item) => item.value !== value);
        return [...selected, ...others];
      }
      return items;
    }

    const normalizedSearch = normalizeString(searchQuery.trim());

    // js-combine-iterations - Single pass filter + sort
    const selected: ComboboxItem[] = [];
    const matches: ComboboxItem[] = [];

    for (const item of items) {
      const normalizedLabel = normalizeString(item.label);

      if (normalizedLabel.includes(normalizedSearch)) {
        if (item.value === value) {
          selected.push(item);
        } else {
          matches.push(item);
        }
      }
    }

    return [...selected, ...matches];
  }, [items, value, searchQuery, normalizeString]);

  // Limitar resultados para mejor rendimiento
  // rendering-content-visibility principle
  const displayedItems = useMemo(() => {
    const limit = 150; // Aumentado de 100 para mejor UX

    // js-early-exit - Si hay pocos items, devolver todos
    if (filteredAndSortedItems.length <= limit) {
      return filteredAndSortedItems;
    }

    // Asegurar que el item seleccionado siempre esté visible
    const selectedIndex = filteredAndSortedItems.findIndex(
      (item) => item.value === value
    );

    if (selectedIndex !== -1 && selectedIndex < limit) {
      return filteredAndSortedItems.slice(0, limit);
    } else if (selectedIndex !== -1) {
      // Si el seleccionado está fuera del límite, incluirlo
      return [
        filteredAndSortedItems[selectedIndex],
        ...filteredAndSortedItems.slice(0, limit - 1),
      ];
    }

    return filteredAndSortedItems.slice(0, limit);
  }, [filteredAndSortedItems, value]);

  // Resetear highlightedIndex cuando abren el popover o cambian los items filtrados
  useEffect(() => {
    setHighlightedIndex(0);
  }, [open, displayedItems]);

  // Scroll automático al item resaltado
  useEffect(() => {
    const highlightedElement = itemRefs.current[highlightedIndex];
    if (highlightedElement && scrollRef.current) {
      const scrollContainer = scrollRef.current;
      const elementTop = highlightedElement.offsetTop;
      const elementBottom = elementTop + highlightedElement.offsetHeight;
      const scrollTop = scrollContainer.scrollTop;
      const scrollBottom = scrollTop + scrollContainer.clientHeight;

      if (elementTop < scrollTop) {
        scrollContainer.scrollTop = elementTop;
      } else if (elementBottom > scrollBottom) {
        scrollContainer.scrollTop =
          elementBottom - scrollContainer.clientHeight;
      }
    }
  }, [highlightedIndex]);

  // rerender-functional-setstate - Stable callback
  const handleOpenChange = useCallback((newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      setSearchQuery("");
      setHighlightedIndex(0);
    }
  }, []);

  // rerender-functional-setstate - Stable select handler
  const handleSelect = useCallback(
    (itemValue: string, item: ComboboxItem) => {
      const isDeselecting = value === itemValue;
      onValueChange(
        isDeselecting ? "" : itemValue,
        isDeselecting ? undefined : item
      );
      setOpen(false);
      setSearchQuery("");
    },
    [value, onValueChange]
  );

  // Manejar navegación con teclado
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < displayedItems.length - 1 ? prev + 1 : prev
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : prev));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (displayedItems[highlightedIndex]) {
          handleSelect(
            displayedItems[highlightedIndex].value,
            displayedItems[highlightedIndex]
          );
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, highlightedIndex, displayedItems, handleSelect]);

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between bg-transparent h-9 text-sm",
            disabled && "opacity-50 cursor-not-allowed",
            className
          )}
          disabled={disabled || loading}
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-3 w-3 animate-spin" />
              Cargando...
            </span>
          ) : (
            <span className="text-left line-clamp-2 flex-1 break-words">
              {selectedItem ? selectedItem.label : placeholder}
            </span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50 self-start mt-1" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[--radix-popover-trigger-width] max-w-[500px] md:max-w-[700px] lg:max-w-[850px] p-0"
        align="start"
      >
        <div className="flex flex-col">
          {/* Search input */}
          <div className="border-b px-3">
            <Input
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 border-none shadow-none focus-visible:ring-0 px-0"
              autoFocus
            />
          </div>

          {/* Results area with scroll */}
          <div ref={scrollRef} className="max-h-[300px] overflow-y-auto">
            {filteredAndSortedItems.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                {emptyMessage}
              </div>
            ) : (
              <div className="py-1">
                {displayedItems.map((item, index) => (
                  <ComboboxListItem
                    key={item.value}
                    ref={(el) => (itemRefs.current[index] = el)}
                    item={item}
                    isSelected={value === item.value}
                    isHighlighted={highlightedIndex === index}
                    onSelect={() => handleSelect(item.value, item)}
                  />
                ))}

                {/* Info message when showing limited results */}
                {filteredAndSortedItems.length > displayedItems.length && (
                  <div className="px-3 py-2 text-xs text-muted-foreground text-center border-t mt-1">
                    Mostrando {displayedItems.length} de{" "}
                    {filteredAndSortedItems.length} resultados.
                    {searchQuery
                      ? " Refina tu búsqueda."
                      : " Busca para filtrar."}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Create new button */}
          {onCreateNew && (
            <div className="border-t">
              <div
                onClick={() => {
                  setOpen(false);
                  setSearchQuery("");
                  onCreateNew();
                }}
                className="relative flex items-center cursor-pointer select-none py-2 px-3 text-sm text-primary hover:bg-accent hover:text-accent-foreground"
              >
                <Plus className="mr-2 h-4 w-4" />
                {createNewLabel}
              </div>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
