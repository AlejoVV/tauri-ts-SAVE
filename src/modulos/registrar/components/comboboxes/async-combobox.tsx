"use client";

import React, { useState, useCallback, useRef, useEffect, memo } from "react";
import { Check, ChevronsUpDown, Plus, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export interface AsyncComboboxItem {
  value: string;
  label: string;
  id?: number;
  unidades?: string;
}

interface AsyncComboboxProps {
  value: string;
  onValueChange: (value: string, item?: AsyncComboboxItem) => void;
  onSearch: (query: string) => Promise<AsyncComboboxItem[]>;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  onCreateNew?: () => void;
  createNewLabel?: string;
  disabled?: boolean;
  className?: string;
  debounceMs?: number;
  minCharsToSearch?: number;
}

// Memoized list item component
const AsyncComboboxListItem = memo(
  React.forwardRef<
    HTMLDivElement,
    {
      item: AsyncComboboxItem;
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
        isHighlighted && "bg-accent",
      )}
    >
      <Check
        className={cn(
          "mr-2 h-4 w-4 flex-shrink-0 self-start mt-0.5",
          isSelected ? "opacity-100" : "opacity-0",
        )}
      />
      <span className="whitespace-normal break-words leading-tight flex-1">
        {item.label}
      </span>
    </div>
  )),
);
AsyncComboboxListItem.displayName = "AsyncComboboxListItem";

export function AsyncCombobox({
  value,
  onValueChange,
  onSearch,
  placeholder = "Seleccionar...",
  searchPlaceholder = "Buscar...",
  emptyMessage = "No se encontraron resultados.",
  onCreateNew,
  createNewLabel = "Crear nuevo",
  disabled = false,
  className,
  debounceMs = 300,
  minCharsToSearch = 0,
}: AsyncComboboxProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [items, setItems] = useState<AsyncComboboxItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState<AsyncComboboxItem | null>(null);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const searchAbortControllerRef = useRef<AbortController | null>(null);

  // Scroll reset when search changes
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [searchQuery]);

  // Search function with debounce and abort control
  // client-swr-dedup principle - deduplicate and cache requests
  const performSearch = useCallback(
    async (query: string) => {
      // Cancel previous search
      if (searchAbortControllerRef.current) {
        searchAbortControllerRef.current.abort();
      }

      // Check minimum characters
      if (query.length < minCharsToSearch && query.length > 0) {
        return;
      }

      setLoading(true);
      searchAbortControllerRef.current = new AbortController();

      try {
        const results = await onSearch(query);
        setItems(results);
      } catch (error) {
        // Ignore abort errors
        if (error instanceof Error && error.name !== "AbortError") {
          console.error("Error searching:", error);
          setItems([]);
        }
      } finally {
        setLoading(false);
        searchAbortControllerRef.current = null;
      }
    },
    [onSearch, minCharsToSearch],
  );

  // Debounced search effect
  // async-defer-await - defer await until needed
  useEffect(() => {
    if (!open) return;

    // Clear previous timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set new timer
    debounceTimerRef.current = setTimeout(() => {
      performSearch(searchQuery);
    }, debounceMs);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [searchQuery, open, performSearch, debounceMs]);

  // Load initial results when opening
  useEffect(() => {
    if (open && items.length === 0 && !loading) {
      performSearch("");
    }
  }, [open, items.length, loading, performSearch]);

  // Update selected item when value changes
  useEffect(() => {
    if (value && items.length > 0) {
      const found = items.find((item) => item.value === value);
      if (found) {
        setSelectedItem(found);
      }
    } else if (!value) {
      setSelectedItem(null);
    }
  }, [value, items]);

  // Reset highlighted index when items change
  useEffect(() => {
    setHighlightedIndex(0);
  }, [items]);

  // Auto-scroll to highlighted item
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
        scrollContainer.scrollTop = elementBottom - scrollContainer.clientHeight;
      }
    }
  }, [highlightedIndex]);

  // rerender-functional-setstate - Stable callback
  const handleOpenChange = useCallback((newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      setSearchQuery("");
      setHighlightedIndex(0);
      // Cancel any pending search
      if (searchAbortControllerRef.current) {
        searchAbortControllerRef.current.abort();
      }
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    }
  }, []);

  // rerender-functional-setstate - Stable select handler
  const handleSelect = useCallback(
    (itemValue: string, item: AsyncComboboxItem) => {
      const isDeselecting = value === itemValue;
      onValueChange(isDeselecting ? "" : itemValue, isDeselecting ? undefined : item);
      setSelectedItem(isDeselecting ? null : item);
      setOpen(false);
      setSearchQuery("");
    },
    [value, onValueChange],
  );

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < items.length - 1 ? prev + 1 : prev
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : prev));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (items[highlightedIndex]) {
          handleSelect(items[highlightedIndex].value, items[highlightedIndex]);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, highlightedIndex, items, handleSelect]);

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
            className,
          )}
          disabled={disabled}
        >
          <span className="text-left line-clamp-2 flex-1 break-words">
            {selectedItem ? selectedItem.label : placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50 self-start mt-1" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[--radix-popover-trigger-width] max-w-[500px] md:max-w-[700px] lg:max-w-[850px] p-0"
        align="start"
      >
        <div className="flex flex-col">
          {/* Search input */}
          <div className="border-b px-3 relative">
            <Input
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 border-none shadow-none focus-visible:ring-0 px-0 pr-8"
              autoFocus
            />
            {loading && (
              <Loader2 className="h-4 w-4 animate-spin absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            )}
          </div>

          {/* Results area with scroll */}
          <div ref={scrollRef} className="max-h-[300px] overflow-y-auto">
            {items.length === 0 && !loading ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                {searchQuery.length > 0 && searchQuery.length < minCharsToSearch
                  ? `Escribe al menos ${minCharsToSearch} caracteres para buscar`
                  : emptyMessage}
              </div>
            ) : loading && items.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin mx-auto mb-2" />
                Buscando...
              </div>
            ) : (
              <div className="py-1">
                {items.map((item, index) => (
                  <AsyncComboboxListItem
                    key={item.value}
                    ref={(el) => (itemRefs.current[index] = el)}
                    item={item}
                    isSelected={value === item.value}
                    isHighlighted={highlightedIndex === index}
                    onSelect={() => handleSelect(item.value, item)}
                  />
                ))}
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
