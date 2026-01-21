// Tipos para el módulo de Eficacia Histórica

export interface Producto {
  producto_id: number;
  producto_nombre: string;
  producto_ingrediente_activo: string | null;
  producto_casa_comercial: string | null;
  producto_tipo: string | null;
}

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
  tipo_busqueda: 'producto' | 'ingrediente_activo';
  termino_busqueda: string;
  producto_seleccionado?: Producto;
  ingrediente_activo_seleccionado?: string;
}

export interface EficaciaHistoricaState {
  filtros: BusquedaFiltros;
  productos_disponibles: Producto[];
  ingredientes_activos_disponibles: IngredienteActivo[];
  pruebas_historicas: PruebaHistorica[];
  loading: boolean;
  error: string | null;
  cargando_productos: boolean;
  cargando_ingredientes: boolean;
  cargando_pruebas: boolean;
}

export interface OpcionBusqueda {
  value: string | number;
  label: string;
  tipo: 'producto' | 'ingrediente_activo';
  data?: Producto | IngredienteActivo;
}

