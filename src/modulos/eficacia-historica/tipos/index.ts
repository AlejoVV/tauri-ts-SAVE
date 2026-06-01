import type { Tables } from '@/modulos/nucleo/lib/supabase';

export type Producto = Pick<
  Tables<'productos'>,
  | 'producto_id'
  | 'producto_nombre'
  | 'producto_ingrediente_activo'
  | 'producto_casa_comercial'
  | 'producto_tipo'
>;

export interface IngredienteActivo {
  ingrediente_activo: string;
  cantidad_productos: number;
}

export interface PruebaHistorica {
  numero_prueba: string;
  producto: string;
  dosis: string;
  unidades: string;
  especie_vegetal: string;
  objetivo?: string;
  finca?: string;
  fecha_creacion?: string;
  casa_comercial?: string;
  contacto?: string;
  fuente: 'pruebas_anteriores' | 'pruebas_ordenes_trabajo';
}

export interface BusquedaFiltros {
  tipoBusqueda: 'producto' | 'ingrediente_activo';
  terminoBusqueda: string;
  productoSeleccionado?: Producto;
  ingredienteActivoSeleccionado?: string;
}

export interface EficaciaHistoricaState {
  filtros: BusquedaFiltros;
  productosDisponibles: Producto[];
  ingredientesActivosDisponibles: IngredienteActivo[];
  pruebasHistoricas: PruebaHistorica[];
  error: string | null;
  cargandoProductos: boolean;
  cargandoIngredientes: boolean;
  cargandoPruebas: boolean;
}
