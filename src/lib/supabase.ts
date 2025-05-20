export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          operationName?: string
          query?: string
          variables?: Json
          extensions?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
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
          precio_id: number
          precio_objetivo_id: number | null
          precio_tipo_producto: string | null
        }
        Insert: {
          precio: number
          precio_id?: number
          precio_objetivo_id?: number | null
          precio_tipo_producto?: string | null
        }
        Update: {
          precio?: number
          precio_id?: number
          precio_objetivo_id?: number | null
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
      pruebas_ordenes_trabajo: {
        Row: {
          prueba_cantidad: string | null
          prueba_compania: string | null
          prueba_contacto: string | null
          prueba_dosis_producto: string
          prueba_especie_id: number | null
          prueba_estado_facturacion: string | null
          prueba_estado_foto: string | null
          prueba_estado_lab: string | null
          prueba_estado_proceso: string | null
          prueba_fecha_creacion: string
          prueba_fecha_entrega_calculada: string | null
          prueba_fecha_entrega_informe: string | null
          prueba_fecha_entrega_remision: string | null
          prueba_fecha_recibido: string | null
          prueba_finca_id: number | null
          prueba_id: number
          prueba_inst: string | null
          prueba_notas_varias: string | null
          prueba_numero_muestra: string | null
          prueba_objetivo_id: number | null
          prueba_obs: string | null
          prueba_orden_id: number
          prueba_precio: number | null
          prueba_producto_id: number | null
          prueba_producto_unid: string | null
          prueba_semana_entrega: number | null
          prueba_usuario_foto: string | null
        }
        Insert: {
          prueba_cantidad?: string | null
          prueba_compania?: string | null
          prueba_contacto?: string | null
          prueba_dosis_producto: string
          prueba_especie_id?: number | null
          prueba_estado_facturacion?: string | null
          prueba_estado_foto?: string | null
          prueba_estado_lab?: string | null
          prueba_estado_proceso?: string | null
          prueba_fecha_creacion?: string
          prueba_fecha_entrega_calculada?: string | null
          prueba_fecha_entrega_informe?: string | null
          prueba_fecha_entrega_remision?: string | null
          prueba_fecha_recibido?: string | null
          prueba_finca_id?: number | null
          prueba_id: number
          prueba_inst?: string | null
          prueba_notas_varias?: string | null
          prueba_numero_muestra?: string | null
          prueba_objetivo_id?: number | null
          prueba_obs?: string | null
          prueba_orden_id: number
          prueba_precio?: number | null
          prueba_producto_id?: number | null
          prueba_producto_unid?: string | null
          prueba_semana_entrega?: number | null
          prueba_usuario_foto?: string | null
        }
        Update: {
          prueba_cantidad?: string | null
          prueba_compania?: string | null
          prueba_contacto?: string | null
          prueba_dosis_producto?: string
          prueba_especie_id?: number | null
          prueba_estado_facturacion?: string | null
          prueba_estado_foto?: string | null
          prueba_estado_lab?: string | null
          prueba_estado_proceso?: string | null
          prueba_fecha_creacion?: string
          prueba_fecha_entrega_calculada?: string | null
          prueba_fecha_entrega_informe?: string | null
          prueba_fecha_entrega_remision?: string | null
          prueba_fecha_recibido?: string | null
          prueba_finca_id?: number | null
          prueba_id?: number
          prueba_inst?: string | null
          prueba_notas_varias?: string | null
          prueba_numero_muestra?: string | null
          prueba_objetivo_id?: number | null
          prueba_obs?: string | null
          prueba_orden_id?: number
          prueba_precio?: number | null
          prueba_producto_id?: number | null
          prueba_producto_unid?: string | null
          prueba_semana_entrega?: number | null
          prueba_usuario_foto?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pruebas_ordenes_trabajo_ibfk_1"
            columns: ["prueba_orden_id"]
            isOneToOne: false
            referencedRelation: "ordenes_trabajo"
            referencedColumns: ["orden_id"]
          },
          {
            foreignKeyName: "pruebas_ordenes_trabajo_ibfk_2"
            columns: ["prueba_objetivo_id"]
            isOneToOne: false
            referencedRelation: "objetivos"
            referencedColumns: ["objetivo_id"]
          },
          {
            foreignKeyName: "pruebas_ordenes_trabajo_ibfk_3"
            columns: ["prueba_producto_id"]
            isOneToOne: false
            referencedRelation: "productos"
            referencedColumns: ["producto_id"]
          },
          {
            foreignKeyName: "pruebas_ordenes_trabajo_ibfk_4"
            columns: ["prueba_especie_id"]
            isOneToOne: false
            referencedRelation: "especie_vegetal"
            referencedColumns: ["especie_id"]
          },
          {
            foreignKeyName: "pruebas_ordenes_trabajo_ibfk_5"
            columns: ["prueba_finca_id"]
            isOneToOne: false
            referencedRelation: "fincas"
            referencedColumns: ["finca_id"]
          },
        ]
      }
      resultados_eficacia: {
        Row: {
          eficacia: number | null
          prueba_id: number
        }
        Insert: {
          eficacia?: number | null
          prueba_id: number
        }
        Update: {
          eficacia?: number | null
          prueba_id?: number
        }
        Relationships: []
      }
      usuarios: {
        Row: {
          username: string | null
          usuario_email: string | null
          usuario_id: number
          usuario_pass: string | null
          usuario_permisos: number | null
        }
        Insert: {
          username?: string | null
          usuario_email?: string | null
          usuario_id?: number
          usuario_pass?: string | null
          usuario_permisos?: number | null
        }
        Update: {
          username?: string | null
          usuario_email?: string | null
          usuario_id?: number
          usuario_pass?: string | null
          usuario_permisos?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      vistacontactoscompanias: {
        Row: {
          compania: string | null
          contacto_apellidos: string | null
          contacto_cargo: string | null
          contacto_celular_opcional: string | null
          contacto_celular_principal: string | null
          contacto_email: string | null
          contacto_nombres: string | null
          encabezado: string | null
          nombre_completo: string | null
          profesion_nombre: string | null
        }
        Relationships: []
      }
      vistamaestra: {
        Row: {
          contacto: string | null
          descuento: string | null
          dosis_producto: string | null
          especie_nombre: string | null
          estado_fact: string | null
          estado_ot: string | null
          facturara: string | null
          fecha_entrega_info: string | null
          fecha_entrega_remision: string | null
          fecha_recibo_muestra: string | null
          finca_nombre: string | null
          instrucciones: string | null
          notas_varias: string | null
          objetivo_nombre: string | null
          observaciones: string | null
          orden_compra: string | null
          producto_casa_comercial: string | null
          producto_nombre: string | null
          producto_tipo: string | null
          producto_unid: string | null
          prueba_cantidad: string | null
          prueba_estado_foto: string | null
          prueba_estado_lab: string | null
          prueba_estado_proceso: string | null
          prueba_fecha_creacion: string | null
          prueba_id: number | null
          prueba_numero_muestra: string | null
          prueba_orden_id: number | null
          prueba_precio: number | null
          prueba_usuario_foto: string | null
          tipo_prueba: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pruebas_ordenes_trabajo_ibfk_1"
            columns: ["prueba_orden_id"]
            isOneToOne: false
            referencedRelation: "ordenes_trabajo"
            referencedColumns: ["orden_id"]
          },
        ]
      }
      vistamaestratotal: {
        Row: {
          contacto: string | null
          contacto_cargo: string | null
          contacto_celular_opcional: string | null
          contacto_celular_principal: string | null
          contacto_email: string | null
          descuento: string | null
          dosis_producto: string | null
          especie_nombre: string | null
          estado_fact: string | null
          estado_ot: string | null
          facturara: string | null
          fecha_entrega_info: string | null
          fecha_recibo_muestra: string | null
          finca_nombre: string | null
          notas_varias: string | null
          objetivo_nombre: string | null
          observaciones: string | null
          orden_compra: string | null
          orden_numero_factura: number | null
          producto_casa_comercial: string | null
          producto_nombre: string | null
          producto_tipo: string | null
          producto_unid: string | null
          profesion_nombre: string | null
          prueba_cantidad: string | null
          prueba_estado_foto: string | null
          prueba_estado_lab: string | null
          prueba_estado_proceso: string | null
          prueba_fecha_creacion: string | null
          prueba_fecha_entrega_calculada: string | null
          prueba_id: number | null
          prueba_numero_muestra: string | null
          prueba_orden_id: number | null
          prueba_precio: number | null
          prueba_semana_entrega: number | null
          prueba_usuario_foto: string | null
          tipo_prueba: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pruebas_ordenes_trabajo_ibfk_1"
            columns: ["prueba_orden_id"]
            isOneToOne: false
            referencedRelation: "ordenes_trabajo"
            referencedColumns: ["orden_id"]
          },
        ]
      }
      vistaobjetivosprecios: {
        Row: {
          objetivo_general: string | null
          objetivo_nombre: string | null
          objetivo_tipo_prueba: string | null
          precio: number | null
          tipo_producto: string | null
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
