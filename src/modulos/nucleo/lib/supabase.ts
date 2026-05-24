export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      catalogo_eficacia: {
        Row: {
          aplicacion_de_tratamiento: string | null
          condicion_de_inoculacion: string | null
          condiciones_ambientales: string | null
          metodo_calculo_de_eficacia: string | null
          nombre_cientifico: string | null
          numero_de_aplicaciones: string | null
          numero_de_repeticiones: string | null
          objetivo_eficacia: string
          plaga_enfermedad: string | null
          registro_de_datos: string | null
          tipo_de_evaluacion: string | null
          unidades_por_repeticion: string | null
        }
        Insert: {
          aplicacion_de_tratamiento?: string | null
          condicion_de_inoculacion?: string | null
          condiciones_ambientales?: string | null
          metodo_calculo_de_eficacia?: string | null
          nombre_cientifico?: string | null
          numero_de_aplicaciones?: string | null
          numero_de_repeticiones?: string | null
          objetivo_eficacia: string
          plaga_enfermedad?: string | null
          registro_de_datos?: string | null
          tipo_de_evaluacion?: string | null
          unidades_por_repeticion?: string | null
        }
        Update: {
          aplicacion_de_tratamiento?: string | null
          condicion_de_inoculacion?: string | null
          condiciones_ambientales?: string | null
          metodo_calculo_de_eficacia?: string | null
          nombre_cientifico?: string | null
          numero_de_aplicaciones?: string | null
          numero_de_repeticiones?: string | null
          objetivo_eficacia?: string
          plaga_enfermedad?: string | null
          registro_de_datos?: string | null
          tipo_de_evaluacion?: string | null
          unidades_por_repeticion?: string | null
        }
        Relationships: []
      }
      catalogo_eficacia_v2: {
        Row: {
          aplicacion_de_tratamiento: string | null
          condicion_de_inoculacion: string | null
          condiciones_ambientales: string | null
          duracion: string
          metodo_calculo_de_eficacia: string | null
          nombre_cientifico: string | null
          numero_de_aplicaciones: string | null
          numero_de_repeticiones: string | null
          objetivo_eficacia: string
          plaga_enfermedad: string | null
          registro_de_datos: string | null
          tipo_de_evaluacion: string
          tipo_insumo: string
          unidades_por_repeticion: string | null
        }
        Insert: {
          aplicacion_de_tratamiento?: string | null
          condicion_de_inoculacion?: string | null
          condiciones_ambientales?: string | null
          duracion: string
          metodo_calculo_de_eficacia?: string | null
          nombre_cientifico?: string | null
          numero_de_aplicaciones?: string | null
          numero_de_repeticiones?: string | null
          objetivo_eficacia: string
          plaga_enfermedad?: string | null
          registro_de_datos?: string | null
          tipo_de_evaluacion: string
          tipo_insumo: string
          unidades_por_repeticion?: string | null
        }
        Update: {
          aplicacion_de_tratamiento?: string | null
          condicion_de_inoculacion?: string | null
          condiciones_ambientales?: string | null
          duracion?: string
          metodo_calculo_de_eficacia?: string | null
          nombre_cientifico?: string | null
          numero_de_aplicaciones?: string | null
          numero_de_repeticiones?: string | null
          objetivo_eficacia?: string
          plaga_enfermedad?: string | null
          registro_de_datos?: string | null
          tipo_de_evaluacion?: string
          tipo_insumo?: string
          unidades_por_repeticion?: string | null
        }
        Relationships: []
      }
      companias: {
        Row: {
          compania_id: number
          compania_nombre: string
        }
        Insert: {
          compania_id?: number
          compania_nombre: string
        }
        Update: {
          compania_id?: number
          compania_nombre?: string
        }
        Relationships: []
      }
      contacto_compania: {
        Row: {
          compania_id: number
          contacto_id: number
        }
        Insert: {
          compania_id: number
          contacto_id: number
        }
        Update: {
          compania_id?: number
          contacto_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "contacto_compania_compania_id_fkey"
            columns: ["compania_id"]
            isOneToOne: false
            referencedRelation: "companias"
            referencedColumns: ["compania_id"]
          },
          {
            foreignKeyName: "contacto_compania_contacto_id_fkey"
            columns: ["contacto_id"]
            isOneToOne: false
            referencedRelation: "contactos"
            referencedColumns: ["contacto_id"]
          },
        ]
      }
      contactos: {
        Row: {
          contacto_apellidos: string | null
          contacto_cargo: string | null
          contacto_celular_opcional: string | null
          contacto_celular_principal: string | null
          contacto_email: string | null
          contacto_genero: string | null
          contacto_id: number
          contacto_nombre_completo: string | null
          contacto_nombres: string | null
          contacto_profesion: string | null
        }
        Insert: {
          contacto_apellidos?: string | null
          contacto_cargo?: string | null
          contacto_celular_opcional?: string | null
          contacto_celular_principal?: string | null
          contacto_email?: string | null
          contacto_genero?: string | null
          contacto_id?: number
          contacto_nombre_completo?: string | null
          contacto_nombres?: string | null
          contacto_profesion?: string | null
        }
        Update: {
          contacto_apellidos?: string | null
          contacto_cargo?: string | null
          contacto_celular_opcional?: string | null
          contacto_celular_principal?: string | null
          contacto_email?: string | null
          contacto_genero?: string | null
          contacto_id?: number
          contacto_nombre_completo?: string | null
          contacto_nombres?: string | null
          contacto_profesion?: string | null
        }
        Relationships: []
      }
      eficacia_de_pruebas: {
        Row: {
          eficacia: number | null
          fecha_calculo: string | null
          id: number
          montaje_id: number | null
          prueba_id: number | null
        }
        Insert: {
          eficacia?: number | null
          fecha_calculo?: string | null
          id?: never
          montaje_id?: number | null
          prueba_id?: number | null
        }
        Update: {
          eficacia?: number | null
          fecha_calculo?: string | null
          id?: never
          montaje_id?: number | null
          prueba_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "eficacia_de_pruebas_montaje_id_fkey"
            columns: ["montaje_id"]
            isOneToOne: false
            referencedRelation: "montajes_de_laboratorio"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eficacia_de_pruebas_prueba_id_fkey"
            columns: ["prueba_id"]
            isOneToOne: false
            referencedRelation: "pruebas_ordenes_trabajo"
            referencedColumns: ["prueba_id"]
          },
          {
            foreignKeyName: "eficacia_de_pruebas_prueba_id_fkey"
            columns: ["prueba_id"]
            isOneToOne: false
            referencedRelation: "vistamaestra"
            referencedColumns: ["prueba_id"]
          },
          {
            foreignKeyName: "eficacia_de_pruebas_prueba_id_fkey"
            columns: ["prueba_id"]
            isOneToOne: false
            referencedRelation: "vistamaestratotal"
            referencedColumns: ["prueba_id"]
          },
        ]
      }
      especie_vegetal: {
        Row: {
          especie_id: number
          especie_nombre: string
        }
        Insert: {
          especie_id?: number
          especie_nombre: string
        }
        Update: {
          especie_id?: number
          especie_nombre?: string
        }
        Relationships: []
      }
      fincas: {
        Row: {
          finca_id: number
          finca_nombre: string
          finca_ubicacion: string | null
        }
        Insert: {
          finca_id?: number
          finca_nombre: string
          finca_ubicacion?: string | null
        }
        Update: {
          finca_id?: number
          finca_nombre?: string
          finca_ubicacion?: string | null
        }
        Relationships: []
      }
      montajes_de_laboratorio: {
        Row: {
          asignado_a: string | null
          cantidad_lecturas: number | null
          cantidad_repeticiones: number | null
          condiciones_iniciales: Json | null
          duracion_prueba: string | null
          fecha_creacion: string | null
          id: number
          nombre: string | null
          nombre_cientifico: string | null
          nombres_lecturas: Json | null
          tipo_evaluacion: string | null
          tipo_insumo: string | null
          variedad: string | null
        }
        Insert: {
          asignado_a?: string | null
          cantidad_lecturas?: number | null
          cantidad_repeticiones?: number | null
          condiciones_iniciales?: Json | null
          duracion_prueba?: string | null
          fecha_creacion?: string | null
          id?: number
          nombre?: string | null
          nombre_cientifico?: string | null
          nombres_lecturas?: Json | null
          tipo_evaluacion?: string | null
          tipo_insumo?: string | null
          variedad?: string | null
        }
        Update: {
          asignado_a?: string | null
          cantidad_lecturas?: number | null
          cantidad_repeticiones?: number | null
          condiciones_iniciales?: Json | null
          duracion_prueba?: string | null
          fecha_creacion?: string | null
          id?: number
          nombre?: string | null
          nombre_cientifico?: string | null
          nombres_lecturas?: Json | null
          tipo_evaluacion?: string | null
          tipo_insumo?: string | null
          variedad?: string | null
        }
        Relationships: []
      }
      objetivos: {
        Row: {
          objetivo_descripcion: string | null
          objetivo_dias_entrega_resultados: number | null
          objetivo_general: string | null
          objetivo_id: number
          objetivo_nombre: string
          objetivo_procedimiento: string | null
          objetivo_tipo_prueba: string | null
        }
        Insert: {
          objetivo_descripcion?: string | null
          objetivo_dias_entrega_resultados?: number | null
          objetivo_general?: string | null
          objetivo_id?: number
          objetivo_nombre: string
          objetivo_procedimiento?: string | null
          objetivo_tipo_prueba?: string | null
        }
        Update: {
          objetivo_descripcion?: string | null
          objetivo_dias_entrega_resultados?: number | null
          objetivo_general?: string | null
          objetivo_id?: number
          objetivo_nombre?: string
          objetivo_procedimiento?: string | null
          objetivo_tipo_prueba?: string | null
        }
        Relationships: []
      }
      ordenes_trabajo: {
        Row: {
          orden_compra: string | null
          orden_descuento: string | null
          orden_estado_ot: string | null
          orden_fecha_creacion: string | null
          orden_id: number
          orden_numero_factura: number | null
        }
        Insert: {
          orden_compra?: string | null
          orden_descuento?: string | null
          orden_estado_ot?: string | null
          orden_fecha_creacion?: string | null
          orden_id?: number
          orden_numero_factura?: number | null
        }
        Update: {
          orden_compra?: string | null
          orden_descuento?: string | null
          orden_estado_ot?: string | null
          orden_fecha_creacion?: string | null
          orden_id?: number
          orden_numero_factura?: number | null
        }
        Relationships: []
      }
      precios_objetivo_tipo: {
        Row: {
          precio: number
          precio_objetivo_id: number | null
          precio_id: number
          precio_tipo_producto: string | null
        }
        Insert: {
          precio: number
          precio_objetivo_id?: number | null
          precio_id?: number
          precio_tipo_producto?: string | null
        }
        Update: {
          precio?: number
          precio_objetivo_id?: number | null
          precio_id?: number
          precio_tipo_producto?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_precio_objetivo_tipo_objetivo"
            columns: ["precio_objetivo_id"]
            isOneToOne: false
            referencedRelation: "objetivos"
            referencedColumns: ["objetivo_id"]
          },
          {
            foreignKeyName: "precios_objetivo_tipo_ibfk_1"
            columns: ["precio_objetivo_id"]
            isOneToOne: false
            referencedRelation: "objetivos"
            referencedColumns: ["objetivo_id"]
          },
        ]
      }
      productos: {
        Row: {
          producto_casa_comercial: string | null
          producto_id: number
          producto_ingrediente_activo: string | null
          producto_nombre: string
          producto_objetivo: string | null
          producto_tipo: string | null
          producto_unidades: string | null
        }
        Insert: {
          producto_casa_comercial?: string | null
          producto_id?: number
          producto_ingrediente_activo?: string | null
          producto_nombre: string
          producto_objetivo?: string | null
          producto_tipo?: string | null
          producto_unidades?: string | null
        }
        Update: {
          producto_casa_comercial?: string | null
          producto_id?: number
          producto_ingrediente_activo?: string | null
          producto_nombre?: string
          producto_objetivo?: string | null
          producto_tipo?: string | null
          producto_unidades?: string | null
        }
        Relationships: []
      }
      pruebas_anteriores: {
        Row: {
          c_comercial: string | null
          cantidad_de_pruebas: string | null
          contacto: string | null
          costo: number | null
          dosis: string | null
          especie_vegetal: string | null
          estado_fact: string | null
          estado_ot: string | null
          facturar_a: string | null
          fecha_entrega_inf: string | null
          fecha_ingreso_ot: string | null
          finca_de_la_cepa: string | null
          no_prueba: number
          num_factura: number | null
          objetivo: string | null
          observaciones: string | null
          ot: number | null
          producto: string | null
          tipo_de_producto: string | null
          tipo_de_prueba: string | null
          unidades: string | null
        }
        Insert: {
          c_comercial?: string | null
          cantidad_de_pruebas?: string | null
          contacto?: string | null
          costo?: number | null
          dosis?: string | null
          especie_vegetal?: string | null
          estado_fact?: string | null
          estado_ot?: string | null
          facturar_a?: string | null
          fecha_entrega_inf?: string | null
          fecha_ingreso_ot?: string | null
          finca_de_la_cepa?: string | null
          no_prueba: number
          num_factura?: number | null
          objetivo?: string | null
          observaciones?: string | null
          ot?: number | null
          producto?: string | null
          tipo_de_producto?: string | null
          tipo_de_prueba?: string | null
          unidades?: string | null
        }
        Update: {
          c_comercial?: string | null
          cantidad_de_pruebas?: string | null
          contacto?: string | null
          costo?: number | null
          dosis?: string | null
          especie_vegetal?: string | null
          estado_fact?: string | null
          estado_ot?: string | null
          facturar_a?: string | null
          fecha_entrega_inf?: string | null
          fecha_ingreso_ot?: string | null
          finca_de_la_cepa?: string | null
          no_prueba?: number
          num_factura?: number | null
          objetivo?: string | null
          observaciones?: string | null
          ot?: number | null
          producto?: string | null
          tipo_de_producto?: string | null
          tipo_de_prueba?: string | null
          unidades?: string | null
        }
        Relationships: []
      }
      pruebas_en_montajes: {
        Row: {
          id: number
          montaje_id: number | null
          prueba_id: number | null
        }
        Insert: {
          id?: never
          montaje_id?: number | null
          prueba_id?: number | null
        }
        Update: {
          id?: never
          montaje_id?: number | null
          prueba_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "pruebas_en_montajes_montaje_id_fkey"
            columns: ["montaje_id"]
            isOneToOne: false
            referencedRelation: "montajes_de_laboratorio"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pruebas_en_montajes_prueba_id_fkey"
            columns: ["prueba_id"]
            isOneToOne: false
            referencedRelation: "pruebas_ordenes_trabajo"
            referencedColumns: ["prueba_id"]
          },
          {
            foreignKeyName: "pruebas_en_montajes_prueba_id_fkey"
            columns: ["prueba_id"]
            isOneToOne: false
            referencedRelation: "vistamaestra"
            referencedColumns: ["prueba_id"]
          },
          {
            foreignKeyName: "pruebas_en_montajes_prueba_id_fkey"
            columns: ["prueba_id"]
            isOneToOne: false
            referencedRelation: "vistamaestratotal"
            referencedColumns: ["prueba_id"]
          },
        ]
      }
      pruebas_ordenes_trabajo: {
        Row: {
          prueba_cantidad: string | null
          prueba_compania: string | null
          prueba_compania_id: number | null
          prueba_contacto: string | null
          prueba_contacto_id: number | null
          prueba_costo: number | null
          prueba_dosis: string | null
          prueba_dosis_producto: string | null
          prueba_especie_id: number | null
          prueba_estado: string | null
          prueba_estado_lab: string | null
          prueba_estado_proceso: string | null
          prueba_fecha_creacion: string | null
          prueba_fecha_entrega_informe: string | null
          prueba_fecha_entrega_remision: string | null
          prueba_fecha_ingreso: string | null
          prueba_finca_id: number | null
          prueba_id: number
          prueba_numero_muestra: string | null
          prueba_objetivo_id: number | null
          prueba_obs: string | null
          prueba_observaciones: string | null
          prueba_orden_id: number | null
          prueba_producto_id: number | null
          prueba_semana_entrega: number | null
          prueba_tipo_producto: string | null
          prueba_unidades: string | null
        }
        Insert: {
          prueba_cantidad?: string | null
          prueba_compania_id?: number | null
          prueba_contacto_id?: number | null
          prueba_costo?: number | null
          prueba_dosis?: string | null
          prueba_especie_id?: number | null
          prueba_estado?: string | null
          prueba_fecha_entrega_informe?: string | null
          prueba_fecha_ingreso?: string | null
          prueba_finca_id?: number | null
          prueba_id?: number
          prueba_objetivo_id?: number | null
          prueba_observaciones?: string | null
          prueba_orden_id?: number | null
          prueba_producto_id?: number | null
          prueba_tipo_producto?: string | null
          prueba_unidades?: string | null
        }
        Update: {
          prueba_cantidad?: string | null
          prueba_compania_id?: number | null
          prueba_contacto_id?: number | null
          prueba_costo?: number | null
          prueba_dosis?: string | null
          prueba_especie_id?: number | null
          prueba_estado?: string | null
          prueba_fecha_entrega_informe?: string | null
          prueba_fecha_ingreso?: string | null
          prueba_finca_id?: number | null
          prueba_id?: number
          prueba_objetivo_id?: number | null
          prueba_observaciones?: string | null
          prueba_orden_id?: number | null
          prueba_producto_id?: number | null
          prueba_tipo_producto?: string | null
          prueba_unidades?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_prueba_compania"
            columns: ["prueba_compania_id"]
            isOneToOne: false
            referencedRelation: "companias"
            referencedColumns: ["compania_id"]
          },
          {
            foreignKeyName: "fk_prueba_contacto"
            columns: ["prueba_contacto_id"]
            isOneToOne: false
            referencedRelation: "contactos"
            referencedColumns: ["contacto_id"]
          },
          {
            foreignKeyName: "fk_prueba_especie"
            columns: ["prueba_especie_id"]
            isOneToOne: false
            referencedRelation: "especie_vegetal"
            referencedColumns: ["especie_id"]
          },
          {
            foreignKeyName: "fk_prueba_finca"
            columns: ["prueba_finca_id"]
            isOneToOne: false
            referencedRelation: "fincas"
            referencedColumns: ["finca_id"]
          },
          {
            foreignKeyName: "fk_prueba_objetivo"
            columns: ["prueba_objetivo_id"]
            isOneToOne: false
            referencedRelation: "objetivos"
            referencedColumns: ["objetivo_id"]
          },
          {
            foreignKeyName: "fk_prueba_orden"
            columns: ["prueba_orden_id"]
            isOneToOne: false
            referencedRelation: "ordenes_trabajo"
            referencedColumns: ["orden_id"]
          },
          {
            foreignKeyName: "fk_prueba_producto"
            columns: ["prueba_producto_id"]
            isOneToOne: false
            referencedRelation: "productos"
            referencedColumns: ["producto_id"]
          },
        ]
      }
      resultados_lecturas: {
        Row: {
          es_testigo: boolean | null
          fecha_lectura: string | null
          fecha_registro: string | null
          id: number
          montaje_id: number | null
          nombre_lectura: string | null
          observaciones: string | null
          prueba_id: number | null
          replica_numero: number | null
          valor_resultado: number | null
        }
        Insert: {
          es_testigo?: boolean | null
          fecha_lectura?: string | null
          fecha_registro?: string | null
          id?: never
          montaje_id?: number | null
          nombre_lectura?: string | null
          observaciones?: string | null
          prueba_id?: number | null
          replica_numero?: number | null
          valor_resultado?: number | null
        }
        Update: {
          es_testigo?: boolean | null
          fecha_lectura?: string | null
          fecha_registro?: string | null
          id?: never
          montaje_id?: number | null
          nombre_lectura?: string | null
          observaciones?: string | null
          prueba_id?: number | null
          replica_numero?: number | null
          valor_resultado?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "resultados_lecturas_montaje_id_fkey"
            columns: ["montaje_id"]
            isOneToOne: false
            referencedRelation: "montajes_de_laboratorio"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resultados_lecturas_prueba_id_fkey"
            columns: ["prueba_id"]
            isOneToOne: false
            referencedRelation: "pruebas_ordenes_trabajo"
            referencedColumns: ["prueba_id"]
          },
          {
            foreignKeyName: "resultados_lecturas_prueba_id_fkey"
            columns: ["prueba_id"]
            isOneToOne: false
            referencedRelation: "vistamaestra"
            referencedColumns: ["prueba_id"]
          },
          {
            foreignKeyName: "resultados_lecturas_prueba_id_fkey"
            columns: ["prueba_id"]
            isOneToOne: false
            referencedRelation: "vistamaestratotal"
            referencedColumns: ["prueba_id"]
          },
        ]
      }
    }
    Views: {
      vistamaestra: {
        Row: {
          compania_nombre: string | null
          contacto_nombre_completo: string | null
          especie_nombre: string | null
          finca_nombre: string | null
          objetivo_nombre: string | null
          orden_id: number | null
          producto_nombre: string | null
          prueba_cantidad: string | null
          prueba_costo: number | null
          prueba_dosis: string | null
          prueba_estado: string | null
          prueba_fecha_entrega_informe: string | null
          prueba_fecha_ingreso: string | null
          prueba_id: number | null
          prueba_observaciones: string | null
          prueba_tipo_producto: string | null
          prueba_unidades: string | null
        }
        Relationships: []
      }
      vistamaestratotal: {
        Row: {
          compania_nombre: string | null
          contacto_email: string | null
          contacto_nombre_completo: string | null
          especie_nombre: string | null
          finca_nombre: string | null
          objetivo_nombre: string | null
          orden_id: number | null
          producto_nombre: string | null
          producto_unid: string | null
          prueba_cantidad: string | null
          prueba_costo: number | null
          prueba_dosis: string | null
          prueba_estado: string | null
          prueba_fecha_entrega_informe: string | null
          prueba_fecha_ingreso: string | null
          prueba_id: number | null
          prueba_observaciones: string | null
          prueba_orden_id: number | null
          prueba_tipo_producto: string | null
          prueba_unidades: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
