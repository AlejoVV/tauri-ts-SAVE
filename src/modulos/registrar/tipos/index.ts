// Tipos para el módulo de registro

export interface RegistroContacto {
  id?: number;
  nombre: string;
  email: string;
  telefono?: string;
  empresa: string;
  cargo?: string;
  fecha_creacion?: string;
  fecha_actualizacion?: string;
}

export interface FormularioRegistro {
  nombre: string;
  email: string;
  telefono: string;
  empresa: string;
  cargo: string;
}

export interface EstadoRegistro {
  loading: boolean;
  error: string | null;
  success: string | null;
}

export interface RespuestaAPI {
  success: boolean;
  message: string;
  data?: any;
}