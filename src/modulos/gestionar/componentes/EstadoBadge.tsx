import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface EstadoBadgeProps {
  value: string | null;
}

export function EstadoBadge({ value }: EstadoBadgeProps) {
  if (!value) {
    return <span className="text-sm font-medium text-muted-foreground">—</span>;
  }

  const normalized = value.toLowerCase();

  const colorClass =
    normalized.includes("facturado") ||
    normalized.includes("cerrado") ||
    normalized.includes("aprobado")
      ? "bg-emerald-100 text-emerald-800 border-emerald-200"
      : normalized.includes("pendiente") ||
          normalized.includes("proceso") ||
          normalized.includes("curso")
        ? "bg-amber-100 text-amber-800 border-amber-200"
        : normalized.includes("anulado") || normalized.includes("cancelado")
          ? "bg-red-100 text-red-800 border-red-200"
          : "bg-neutral-100 text-neutral-700 border-neutral-200";

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium leading-none",
        colorClass
      )}
    >
      {value}
    </span>
  );
}

interface TypedEstadoBadgeProps {
  estado: string | null;
  type: "lab" | "fact" | "ot" | "proceso";
}

const TYPED_VARIANTS: Record<string, string> = {
  lab: "bg-blue-100 text-blue-800 hover:bg-blue-100",
  fact: "bg-green-100 text-green-800 hover:bg-green-100",
  ot: "bg-purple-100 text-purple-800 hover:bg-purple-100",
  proceso: "bg-amber-100 text-amber-800 hover:bg-amber-100",
};

export function TypedEstadoBadge({ estado, type }: TypedEstadoBadgeProps) {
  if (!estado) return <span className="text-muted-foreground">-</span>;
  return (
    <Badge variant="secondary" className={TYPED_VARIANTS[type]}>
      {estado}
    </Badge>
  );
}
