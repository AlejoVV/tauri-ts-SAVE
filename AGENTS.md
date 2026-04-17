# AGENTS.md — Estándares de Código · Herramienta SAVE

Guía de referencia para AI coding agents y desarrolladores sobre las convenciones, arquitectura y patrones de este proyecto.

---

## Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| Desktop shell | Tauri v2 (Rust 2021 edition) |
| Frontend | React 18 + TypeScript 5.6 + Vite 6 |
| Estilos | Tailwind CSS v4 (vía Vite plugin) + shadcn/ui (new-york) |
| UI components | Radix UI + MUI v7 (`@mui/material`, `@mui/x-date-pickers`) |
| Tablas | `material-react-table` v3 |
| Iconos | `lucide-react` (shadcn) + `@mui/icons-material` (MUI) |
| Estado / datos | TanStack React Query v5 |
| Base de datos | Supabase (PostgreSQL) vía `@supabase/supabase-js` |
| Generación docs | `docx` + `file-saver` |
| Fechas | `date-fns` v4 |

---

## Estructura de carpetas

```
src/
├── components/ui/          # Componentes shadcn/ui compartidos
├── lib/
│   └── utils.ts            # Utilidad cn() para clases Tailwind
├── modulos/
│   ├── nucleo/             # Layout, Supabase client, tipos globales
│   │   ├── componentes/layout/
│   │   └── lib/            # supabase.ts (tipos DB), supabaseClient.ts
│   ├── ordenes-trabajo/
│   ├── objetivos/
│   ├── eficacia/
│   ├── registrar/
│   ├── gestionar/
│   └── informes/
├── App.tsx                 # Router de vistas con useState + switch
└── main.tsx                # Entry point, QueryClientProvider

src-tauri/
├── src/
│   ├── main.rs             # Binario mínimo → llama lib::run()
│   └── lib.rs              # Builder Tauri, plugins, comandos invoke
├── capabilities/           # Permisos de ventana
└── tauri.conf.json
```

### Estructura interna de cada módulo

Cada módulo bajo `src/modulos/<nombre>/` sigue esta convención:

```
<modulo>/
├── componentes/            # Componentes React del módulo
├── servicios/
│   └── index.ts            # Funciones async que llaman a Supabase
├── hooks/
│   └── index.ts            # Custom hooks (useState + useEffect)
├── tipos/
│   └── index.ts            # Interfaces y types del dominio
└── utils/
    └── index.ts            # Funciones puras auxiliares
```

---

## TypeScript

### Configuración (tsconfig.json)

- Target: `ES2020`, módulos `ESNext`
- `strict: true` — sin excepciones
- `noUnusedLocals: true`, `noUnusedParameters: true`
- `noFallthroughCasesInSwitch: true`
- Path alias: `@/*` → `./src/*`

### Alias de importación

```typescript
// ✅ Siempre usar alias @/
import { cn } from "@/lib/utils";
import type { MiTipo } from "@/modulos/eficacia/tipos";

// ❌ Evitar rutas relativas profundas
import { cn } from "../../../lib/utils";
```

### Tipos

- Usar `interface` para objetos de dominio.
- Usar `type` para alias, uniones y tipos derivados.
- Los tipos de base de datos se extraen desde Supabase: `Tables<"nombre_tabla">`.

```typescript
import type { Tables } from "../../nucleo/lib/supabase";
export type VistaMaestraTotalRow = Tables<"vistamaestratotal">;

export interface MontajeInProgress {
  id: string;
  nombreMontaje: string;
  estado: "En Proceso" | "Listo para Cálculo" | "Sin Configurar" | "Eficacia guardada";
}
```

- Preferir `import type` para importaciones de solo tipos.
- Evitar `any`; cuando sea inevitable, documentar el motivo con un comentario.

---

## Nomenclatura

| Elemento | Convención | Ejemplo |
|----------|-----------|---------|
| Carpetas de módulo | kebab-case en español | `ordenes-trabajo`, `eficacia` |
| Sub-carpetas | español | `componentes`, `servicios`, `tipos`, `hooks` |
| Archivos de componente | PascalCase | `TableOrdenesMaestra.tsx` |
| Archivos de servicio/hook/tipo | camelCase o `index.ts` | `workOrderService.ts`, `index.ts` |
| Componentes React | PascalCase | `EficaciaMain`, `RegisterWorkOrderPage` |
| Funciones de servicio | camelCase, verbo en inglés o español | `getMontajes`, `createMontajeBasico` |
| Hooks | `use` + PascalCase | `useEfficacyTests`, `useMontajes` |
| Interfaces de dominio | PascalCase en español | `MontajeInProgress`, `CondicionesIniciales` |
| Variables/props | camelCase | `activeView`, `onViewChange` |

---

## Patrones de componentes React

### Estructura estándar de un componente

```tsx
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface MiComponenteProps {
  titulo: string;
  onAccion: () => void;
}

export function MiComponente({ titulo, onAccion }: MiComponenteProps) {
  const [estado, setEstado] = useState(false);

  return (
    <div className={cn("flex flex-col gap-4", estado && "opacity-50")}>
      <h2>{titulo}</h2>
      <Button onClick={onAccion}>Acción</Button>
    </div>
  );
}
```

- Usar **functional components** siempre.
- Exportar con nombre (`export function`), no como `export default` (excepción: `App.tsx` y páginas de módulo que lo requieran).
- Las props se tipan con `interface` local al archivo si no se reusan fuera.

### Clases CSS

- Usar siempre la utilidad `cn()` de `@/lib/utils` para combinar clases:

```typescript
import { cn } from "@/lib/utils";
className={cn("base-class", condicion && "conditional-class")}
```

- Tailwind v4 está configurado vía el plugin de Vite; usar CSS variables del tema con prefijo `--` donde sea necesario (ver `src/index.css`).

### shadcn/ui

- Los componentes shadcn viven en `src/components/ui/`.
- Estilo: **new-york**, color base: **neutral**, con CSS variables.
- Al agregar nuevos componentes shadcn, usar el CLI: `npx shadcn add <componente>`.
- No modificar los archivos generados en `src/components/ui/` directamente; extender mediante composición.

---

## Patrones de servicios (Supabase)

### Firma de retorno estándar

Todas las funciones de mutación retornan:

```typescript
Promise<{ success: boolean; data?: T; error?: string }>
```

Las funciones de consulta lanzan (`throw`) el error para que React Query lo capture, o retornan `null`/`[]` como fallback:

```typescript
export const getMontajes = async (): Promise<MontajeInProgress[]> => {
  try {
    const { data, error } = await supabase.from("montajes_de_laboratorio").select("*");
    if (error) throw error;
    return data ?? [];
  } catch (error) {
    console.error("Error al obtener montajes:", error);
    throw error;
  }
};

export const createMontaje = async (
  datos: MontajeBasico
): Promise<{ success: boolean; montajeId?: number; error?: string }> => {
  try {
    // ...lógica...
    return { success: true, montajeId };
  } catch (error) {
    console.error("Error al crear montaje:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
};
```

### Cliente Supabase

- Importar siempre desde `@/modulos/nucleo/lib/supabaseClient`:

```typescript
import { supabase } from "@/modulos/nucleo/lib/supabaseClient";
```

- Los tipos generados de la base de datos viven en `@/modulos/nucleo/lib/supabase`.

---

## Patrones de hooks

```typescript
export const useMiRecurso = () => {
  const [data, setData] = useState<MiTipo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getMiRecurso();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar");
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  return { data, loading, error, refetch: fetchData };
};
```

- Exponer siempre `refetch` para que el componente pueda recargar.
- Separar lógica de fetching en servicios; el hook solo orquesta estado.

---

## Manejo de errores

- En servicios de mutación: capturar con `try/catch`, retornar `{ success: false, error: mensaje }`.
- En servicios de consulta: relanzar el error (`throw`) para que React Query lo gestione.
- Registrar siempre con `console.error("Descripción:", error)` antes de retornar/relanzar.
- Nunca silenciar un error con un `catch` vacío.

```typescript
// ❌ MAL
try { await algo(); } catch {}

// ✅ BIEN
try {
  await algo();
} catch (error) {
  console.error("Falló algo:", error);
  return { success: false, error: error instanceof Error ? error.message : "Error desconocido" };
}
```

---

## Navegación / vistas

La app no usa React Router. La navegación se maneja con `useState<string>` en `App.tsx` + un `switch` en `renderContent()`. Los IDs de vista son: `objetivos`, `maestra`, `eficacia`, `registrar`, `gestionar`, `informes`.

Al agregar una nueva vista:
1. Crear el componente página en `src/modulos/<nuevo>/`.
2. Importarlo en `App.tsx`.
3. Agregar el case en `renderContent()`.
4. Agregar el ítem en `BarraLateral.tsx` (`src/modulos/nucleo/componentes/layout/`).

---

## Rust / Tauri

- La lógica Rust vive en `src-tauri/src/lib.rs`.
- Los comandos `invoke` se registran en el macro `tauri::generate_handler![]`.
- Minimizar la lógica en Rust; la app actual opera principalmente vía Supabase desde el frontend.
- Agregar permisos en `src-tauri/capabilities/` antes de usar nuevos plugins de Tauri.

---

## Scripts disponibles

```bash
npm run dev        # Inicia Vite en modo desarrollo (puerto 1420)
npm run build      # tsc + vite build
npm run tauri      # CLI de Tauri (tauri dev, tauri build, etc.)
```

---

## Lo que NO hacer

- No importar `supabase` directamente desde rutas relativas profundas; usar el alias `@/`.
- No usar `any` sin justificación; preferir `unknown` + type guards.
- No mezclar MUI y shadcn/Radix en el mismo componente sin necesidad; preferir shadcn para componentes nuevos.
- No crear componentes nuevos directamente en `src/components/`; ubicarlos dentro del módulo correspondiente en `src/modulos/<modulo>/componentes/`.
- No agregar comentarios que solo parafrasean el código (ej: `// Retorna el resultado`). Los comentarios deben explicar el *por qué*, no el *qué*.
