// Hook para manejar los datos del formulario de registro
import { useState, useEffect, useCallback } from "react"
import {
  obtenerCompanias,
  obtenerContactosPorCompania,
  obtenerFincas,
  obtenerObjetivos,
  obtenerProductos,
  obtenerEspeciesVegetales,
  buscarProductos,
  obtenerProductoPorNombre,
  companiasACombobox,
  contactosACombobox,
  fincasACombobox,
  objetivosACombobox,
  productosACombobox,
  especiesACombobox,
  type ComboboxItem,
} from "../servicios/datosFormularioService"
import type { AsyncComboboxItem } from "../components/comboboxes/async-combobox"

interface UseFormularioRegistroReturn {
  // Datos para los comboboxes
  companias: ComboboxItem[]
  contactos: ComboboxItem[]
  fincas: ComboboxItem[]
  objetivos: ComboboxItem[]
  productos: ComboboxItem[]
  especies: ComboboxItem[]
  
  // Estados de carga
  loading: {
    companias: boolean
    contactos: boolean
    fincas: boolean
    objetivos: boolean
    productos: boolean
    especies: boolean
  }
  
  // Errores
  errors: {
    companias: string | null
    contactos: string | null
    fincas: string | null
    objetivos: string | null
    productos: string | null
    especies: string | null
  }
  
  // Valores seleccionados
  selectedCompania: string
  selectedContacto: string
  selectedFinca: string
  selectedObjetivo: string
  selectedProducto: string
  selectedEspecie: string
  
  // Detalles del producto seleccionado
  productoCasaComercial: string
  productoTipo: string
  
  // Detalles del objetivo seleccionado
  objetivoTipoPrueba: string
  
  // Setters
  setSelectedCompania: (value: string) => void
  setSelectedContacto: (value: string) => void
  setSelectedFinca: (value: string) => void
  setSelectedObjetivo: (value: string, tipoPrueba?: string) => void
  setSelectedProducto: (value: string, unidades?: string, casaComercial?: string, tipo?: string) => void
  setSelectedEspecie: (value: string) => void
  
  // Funciones de recarga
  recargarCompanias: () => Promise<void>
  recargarContactos: () => Promise<void>
  recargarFincas: () => Promise<void>
  recargarObjetivos: () => Promise<void>
  recargarProductos: () => Promise<void>
  recargarEspecies: () => Promise<void>
  
  // Función de búsqueda asíncrona para productos
  buscarProductosAsync: (query: string) => Promise<AsyncComboboxItem[]>
  
  // Estado de bloqueo del contacto (depende de la compañía)
  contactoDisabled: boolean
  
  // Unidades del producto seleccionado
  unidadesProducto: string
}

export function useFormularioRegistro(): UseFormularioRegistroReturn {
  // Estados para los datos
  const [companias, setCompanias] = useState<ComboboxItem[]>([])
  const [contactos, setContactos] = useState<ComboboxItem[]>([])
  const [fincas, setFincas] = useState<ComboboxItem[]>([])
  const [objetivos, setObjetivos] = useState<ComboboxItem[]>([])
  const [productos, setProductos] = useState<ComboboxItem[]>([])
  const [especies, setEspecies] = useState<ComboboxItem[]>([])
  
  // Estados de carga
  const [loading, setLoading] = useState({
    companias: false,
    contactos: false,
    fincas: false,
    objetivos: false,
    productos: false,
    especies: false,
  })
  
  // Estados de error
  const [errors, setErrors] = useState({
    companias: null as string | null,
    contactos: null as string | null,
    fincas: null as string | null,
    objetivos: null as string | null,
    productos: null as string | null,
    especies: null as string | null,
  })
  
  // Valores seleccionados
  const [selectedCompania, setSelectedCompaniaState] = useState("")
  const [selectedContacto, setSelectedContacto] = useState("")
  const [selectedFinca, setSelectedFinca] = useState("")
  const [selectedObjetivo, setSelectedObjetivoState] = useState("")
  const [selectedProducto, setSelectedProductoState] = useState("")
  const [selectedEspecie, setSelectedEspecie] = useState("")
  
  // Unidades y detalles del producto seleccionado
  const [unidadesProducto, setUnidadesProducto] = useState("cc/lt")
  const [productoCasaComercial, setProductoCasaComercial] = useState("")
  const [productoTipo, setProductoTipo] = useState("")
  
  // Detalles del objetivo seleccionado
  const [objetivoTipoPrueba, setObjetivoTipoPrueba] = useState("")
  
  // Cargar compañías
  const recargarCompanias = useCallback(async () => {
    setLoading((prev) => ({ ...prev, companias: true }))
    setErrors((prev) => ({ ...prev, companias: null }))
    try {
      const data = await obtenerCompanias()
      setCompanias(companiasACombobox(data))
    } catch (error) {
      setErrors((prev) => ({ ...prev, companias: "Error al cargar compañías" }))
    } finally {
      setLoading((prev) => ({ ...prev, companias: false }))
    }
  }, [])
  
  // Cargar contactos por compañía
  const recargarContactos = useCallback(async () => {
    if (!selectedCompania) {
      setContactos([])
      return
    }
    
    setLoading((prev) => ({ ...prev, contactos: true }))
    setErrors((prev) => ({ ...prev, contactos: null }))
    try {
      const data = await obtenerContactosPorCompania(selectedCompania)
      setContactos(contactosACombobox(data))
    } catch (error) {
      setErrors((prev) => ({ ...prev, contactos: "Error al cargar contactos" }))
    } finally {
      setLoading((prev) => ({ ...prev, contactos: false }))
    }
  }, [selectedCompania])
  
  // Cargar fincas
  const recargarFincas = useCallback(async () => {
    setLoading((prev) => ({ ...prev, fincas: true }))
    setErrors((prev) => ({ ...prev, fincas: null }))
    try {
      const data = await obtenerFincas()
      setFincas(fincasACombobox(data))
    } catch (error) {
      setErrors((prev) => ({ ...prev, fincas: "Error al cargar fincas" }))
    } finally {
      setLoading((prev) => ({ ...prev, fincas: false }))
    }
  }, [])
  
  // Cargar objetivos
  const recargarObjetivos = useCallback(async () => {
    setLoading((prev) => ({ ...prev, objetivos: true }))
    setErrors((prev) => ({ ...prev, objetivos: null }))
    try {
      const data = await obtenerObjetivos()
      setObjetivos(objetivosACombobox(data))
    } catch (error) {
      setErrors((prev) => ({ ...prev, objetivos: "Error al cargar objetivos" }))
    } finally {
      setLoading((prev) => ({ ...prev, objetivos: false }))
    }
  }, [])
  
  // Cargar productos
  const recargarProductos = useCallback(async () => {
    setLoading((prev) => ({ ...prev, productos: true }))
    setErrors((prev) => ({ ...prev, productos: null }))
    try {
      const data = await obtenerProductos()
      setProductos(productosACombobox(data))
    } catch (error) {
      setErrors((prev) => ({ ...prev, productos: "Error al cargar productos" }))
    } finally {
      setLoading((prev) => ({ ...prev, productos: false }))
    }
  }, [])
  
  // Cargar especies
  const recargarEspecies = useCallback(async () => {
    setLoading((prev) => ({ ...prev, especies: true }))
    setErrors((prev) => ({ ...prev, especies: null }))
    try {
      const data = await obtenerEspeciesVegetales()
      setEspecies(especiesACombobox(data))
    } catch (error) {
      setErrors((prev) => ({ ...prev, especies: "Error al cargar especies" }))
    } finally {
      setLoading((prev) => ({ ...prev, especies: false }))
    }
  }, [])
  
  // Handler para cuando cambia la compañía seleccionada
  const setSelectedCompania = useCallback((value: string) => {
    setSelectedCompaniaState(value)
    // Limpiar contacto seleccionado cuando cambia la compañía
    setSelectedContacto("")
  }, [])
  
  // Handler para cuando cambia el objetivo seleccionado
  // Acepta tipo de prueba opcional que viene del GenericCombobox
  const setSelectedObjetivo = useCallback((value: string, tipoPrueba?: string) => {
    setSelectedObjetivoState(value)
    setObjetivoTipoPrueba(tipoPrueba || "")
  }, [])
  
  // Handler para cuando cambia el producto seleccionado
  // Acepta unidades, casa comercial y tipo opcionales que vienen del AsyncCombobox
  const setSelectedProducto = useCallback((value: string, unidades?: string, casaComercial?: string, tipo?: string) => {
    setSelectedProductoState(value)
    
    // Actualizar unidades
    if (unidades) {
      setUnidadesProducto(unidades)
    } else if (value) {
      // Si no vienen unidades, intentar buscar el producto
      obtenerProductoPorNombre(value).then(producto => {
        if (producto?.producto_unidades) {
          setUnidadesProducto(producto.producto_unidades)
        } else {
          setUnidadesProducto("cc/lt")
        }
        
        // Actualizar casa comercial y tipo
        setProductoCasaComercial(producto?.producto_casa_comercial || "")
        setProductoTipo(producto?.producto_tipo || "")
      })
    } else {
      setUnidadesProducto("cc/lt")
      setProductoCasaComercial("")
      setProductoTipo("")
    }
    
    // Si vienen casa comercial y tipo, actualizarlos directamente
    if (casaComercial !== undefined) {
      setProductoCasaComercial(casaComercial || "")
    }
    if (tipo !== undefined) {
      setProductoTipo(tipo || "")
    }
  }, [])
  
  // Función de búsqueda asíncrona para productos
  // js-cache-function-results - Stable function reference
  const buscarProductosAsync = useCallback(async (query: string): Promise<AsyncComboboxItem[]> => {
    try {
      const productos = await buscarProductos(query, 100)
      return productosACombobox(productos)
    } catch (error) {
      console.error("Error al buscar productos:", error)
      return []
    }
  }, [])
  
  // Cargar datos iniciales
  // async-parallel - Parallel data fetching where appropriate
  // Note: productos no se carga aquí porque ahora usa búsqueda asíncrona
  useEffect(() => {
    recargarCompanias()
    recargarFincas()
    recargarObjetivos()
    // recargarProductos() - Ya no necesario, se usa búsqueda asíncrona
    recargarEspecies()
  }, [recargarCompanias, recargarFincas, recargarObjetivos, recargarEspecies])
  
  // Recargar contactos cuando cambia la compañía
  useEffect(() => {
    recargarContactos()
  }, [recargarContactos])
  
  // El contacto está deshabilitado si no hay compañía seleccionada
  const contactoDisabled = !selectedCompania
  
  return {
    companias,
    contactos,
    fincas,
    objetivos,
    productos,
    especies,
    loading,
    errors,
    selectedCompania,
    selectedContacto,
    selectedFinca,
    selectedObjetivo,
    selectedProducto,
    selectedEspecie,
    setSelectedCompania,
    setSelectedContacto,
    setSelectedFinca,
    setSelectedObjetivo,
    setSelectedProducto,
    setSelectedEspecie,
    recargarCompanias,
    recargarContactos,
    recargarFincas,
    recargarObjetivos,
    recargarProductos,
    recargarEspecies,
    buscarProductosAsync,
    contactoDisabled,
    unidadesProducto,
    productoCasaComercial,
    productoTipo,
    objetivoTipoPrueba,
  }
}
