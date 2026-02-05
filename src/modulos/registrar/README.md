# Módulo Registrar - Documentación

## Flujo de Trabajo Implementado

Este módulo permite registrar órdenes de trabajo y pruebas asociadas siguiendo un flujo optimizado y eficiente.

### Características Principales

#### 1. Inicialización del Formulario

Al ingresar al módulo Registrar:
- El sistema consulta automáticamente la última Orden de Trabajo (OT) y la incrementa en 1
- El sistema consulta automáticamente la última Prueba y la incrementa en 1
- Ambos valores se muestran automáticamente en los campos correspondientes

#### 2. Registro Inicial (Primera Prueba)

Cuando el usuario completa el formulario y hace clic en "Guardar y Continuar":
- Se crea una nueva orden en la tabla `ordenes_trabajo`
- Se crea la primera prueba asociada en la tabla `pruebas_ordenes_trabajo`
- La tabla inferior se actualiza inmediatamente mostrando la prueba registrada
- Se muestra un mensaje de éxito con los IDs creados

#### 3. Registro de Pruebas Adicionales

Para continuar registrando pruebas en la misma Orden de Trabajo:
- Los campos de orden (Facturar a, Contacto, Finca, Descuento) quedan bloqueados
- Se limpian automáticamente los campos específicos de prueba:
  - Objetivo
  - Cantidad de pruebas
  - Especie vegetal
  - Producto
  - Dosis
  - Número de muestra
  - Fecha de recepción
  - Observaciones
  - Análisis solicitado
  - Notas varias

- El campo Prueba se incrementa automáticamente
- Al hacer clic en "Guardar y Continuar", se agrega la nueva prueba a la orden existente
- La tabla inferior se actualiza en tiempo real mostrando todas las pruebas de la orden

### Arquitectura Técnica

#### Archivos Creados/Modificados

1. **servicios/registroService.ts**
   - Maneja las operaciones de creación de órdenes y pruebas
   - Obtiene los próximos IDs disponibles
   - Implementa caché para IDs de entidades (siguiendo best practices)

2. **hooks/useWorkOrderRegistration.ts**
   - Hook personalizado para manejar el estado del formulario
   - Gestiona el flujo de registro y actualización
   - Controla los triggers para refrescar la tabla

3. **work-order-form.tsx**
   - Componente principal del formulario
   - Implementa el flujo completo de registro
   - Usa refs para optimizar el rendimiento (siguiendo best practices)

4. **components/work-order-tests-table.tsx**
   - Tabla actualizable en tiempo real
   - Muestra todas las pruebas de una orden de trabajo
   - Se refresca automáticamente al agregar pruebas

### Best Practices Implementadas

#### De Vercel React Best Practices:

1. **async-parallel**: Carga de IDs de orden y prueba en paralelo
2. **async-defer-await**: Diferir await hasta donde se necesita el resultado
3. **rerender-use-ref-transient-values**: Uso de refs para valores de formulario
4. **rerender-functional-setstate**: setState funcional para callbacks estables
5. **js-cache-function-results**: Caché de IDs de entidades para lookups repetidos
6. **js-early-exit**: Retorno temprano para validaciones
7. **rerender-dependencies**: Dependencias primitivas en effects

### Flujo de Datos

```
Usuario completa formulario
         ↓
Clic en "Guardar y Continuar"
         ↓
¿Es primera prueba de la orden?
    ↓               ↓
   SÍ              NO
    ↓               ↓
Crear OT     Agregar prueba
y prueba      a OT existente
    ↓               ↓
    └───────┬───────┘
            ↓
  Incrementar ID prueba
            ↓
  Limpiar campos prueba
            ↓
  Actualizar tabla
            ↓
  Mostrar mensaje éxito
```

### Validaciones

- **Compañía (Facturar a)**: Campo obligatorio
- **Campos bloqueados**: Después de crear la primera prueba, los campos de orden quedan bloqueados
- **IDs únicos**: El sistema garantiza que no haya duplicados

### Mensajes de Estado

- **Éxito**: "Orden de Trabajo #X y Prueba #Y creadas exitosamente"
- **Éxito (prueba adicional)**: "Prueba #Y agregada a la Orden de Trabajo #X"
- **Error**: Mensajes específicos según el tipo de error

### Persistencia

Todas las operaciones se guardan en Supabase:
- Tabla: `ordenes_trabajo`
- Tabla: `pruebas_ordenes_trabajo`
- Vista: `vistamaestratotal` (para consulta en la tabla)

### Campos Persistentes Entre Pruebas

Al agregar pruebas adicionales a una orden, estos campos mantienen su valor:
- Facturar a (bloqueado)
- Contacto (bloqueado)
- Finca de la cepa (bloqueado)
- Descuento (bloqueado)

### Actualización en Tiempo Real

La tabla inferior se actualiza automáticamente usando un trigger numérico que se incrementa cada vez que se guarda una prueba, causando que el efecto en `WorkOrderTestsTable` se ejecute nuevamente.

## Uso

1. Seleccione la compañía en "Facturar a"
2. Complete los campos requeridos del formulario
3. Haga clic en "Guardar y Continuar"
4. Para agregar más pruebas a la misma orden, complete los campos específicos de prueba y vuelva a hacer clic en "Guardar y Continuar"

## Notas Técnicas

- Los IDs se obtienen dinámicamente de la base de datos al cargar el componente
- El sistema usa refs para evitar re-renders innecesarios
- La tabla se actualiza de forma optimista sin necesidad de recargar la página
- Se implementa caché en memoria para lookups frecuentes de IDs
