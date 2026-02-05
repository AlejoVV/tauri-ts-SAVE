# Guía de Pruebas - Módulo Registrar

## Casos de Prueba

### 1. Inicialización del Formulario

**Objetivo**: Verificar que los campos OT y Prueba se inicializan correctamente

**Pasos**:
1. Navegar al módulo Registrar
2. Observar los campos OT y Prueba

**Resultado esperado**:
- El campo OT debe mostrar el último orden_id + 1
- El campo Prueba debe mostrar el último prueba_id + 1
- Ambos campos deben estar en solo lectura

### 2. Registro de Primera Prueba

**Objetivo**: Verificar que se puede crear una orden de trabajo con su primera prueba

**Pasos**:
1. Completar el campo "Facturar a" (obligatorio)
2. Opcionalmente completar "Contacto"
3. Completar los demás campos del formulario
4. Hacer clic en "Guardar y Continuar"

**Resultado esperado**:
- Se muestra un mensaje de éxito verde: "Orden de Trabajo #X y Prueba #Y creadas exitosamente"
- La tabla inferior se actualiza mostrando la nueva prueba
- Los campos de orden (Facturar a, Contacto, Finca, Descuento) se bloquean
- Los campos específicos de prueba se limpian
- El campo Prueba se incrementa en 1
- Aparece una alerta azul indicando que la orden está en progreso

### 3. Registro de Segunda Prueba

**Objetivo**: Verificar que se puede agregar una segunda prueba a la misma orden

**Pasos**:
1. Verificar que los campos de orden están bloqueados
2. Completar los campos específicos de prueba (Objetivo, Producto, etc.)
3. Hacer clic en "Guardar y Continuar"

**Resultado esperado**:
- Se muestra un mensaje de éxito: "Prueba #Y agregada a la Orden de Trabajo #X"
- La tabla se actualiza mostrando ambas pruebas
- Los campos específicos de prueba se limpian nuevamente
- El campo Prueba se incrementa en 1
- Los campos de orden permanecen bloqueados con sus valores originales

### 4. Registro de Múltiples Pruebas

**Objetivo**: Verificar que se pueden agregar múltiples pruebas sucesivas

**Pasos**:
1. Repetir el paso 3 varias veces (por ejemplo, 5 pruebas)

**Resultado esperado**:
- Cada prueba se registra correctamente
- La tabla muestra todas las pruebas en orden
- El campo Prueba se incrementa correctamente en cada guardado
- Los campos de orden permanecen bloqueados

### 5. Validación de Campo Obligatorio

**Objetivo**: Verificar que no se puede guardar sin seleccionar compañía

**Pasos**:
1. Dejar el campo "Facturar a" vacío
2. Completar otros campos
3. Hacer clic en "Guardar y Continuar"

**Resultado esperado**:
- El botón está deshabilitado mientras "Facturar a" esté vacío
- Si de alguna forma se intenta guardar, se muestra un error: "Debe seleccionar una compañía"

### 6. Visualización de la Tabla

**Objetivo**: Verificar que la tabla muestra correctamente las pruebas

**Resultado esperado**:
- La tabla muestra todas las pruebas de la orden actual
- Las columnas muestran: Finca, Objetivo, Producto, Dosis, Unidad, Facturar A, Contacto, Observaciones, Especie, Estado Lab, Prueba ID, N° Muestra, Estado Fact., Estado OT, Estado Proceso, Fecha Creación, Fecha Recibo, Fecha Entrega
- Los estados se muestran como badges con colores
- Las fechas están en formato dd/MM/yyyy
- La tabla es responsive y permite filtrado, ordenamiento y paginación

### 7. Limpieza de Campos

**Objetivo**: Verificar que los campos correctos se limpian después de guardar

**Después de guardar, deben limpiarse**:
- ✓ Objetivo
- ✓ Cantidad de pruebas (vuelve a 1)
- ✓ Especie vegetal
- ✓ Producto
- ✓ Dosis
- ✓ Número de muestra
- ✓ Fecha de recepción
- ✓ Observaciones
- ✓ Análisis solicitado
- ✓ Notas varias

**Deben permanecer**:
- ✓ Facturar a (bloqueado)
- ✓ Contacto (bloqueado)
- ✓ Finca de la cepa (bloqueado)
- ✓ Descuento (bloqueado)

### 8. Estados de Carga

**Objetivo**: Verificar que se muestran indicadores de carga apropiados

**Resultado esperado**:
- Mientras se guardan los datos, el botón muestra "Guardando..." con un spinner
- El botón está deshabilitado durante el guardado
- No se puede hacer doble clic para crear duplicados

### 9. Manejo de Errores

**Objetivo**: Verificar que los errores se manejan correctamente

**Escenarios a probar**:
- Error de conexión a la base de datos
- Error al obtener IDs
- Error al crear orden o prueba

**Resultado esperado**:
- Se muestra una alerta roja con el mensaje de error
- El formulario permanece editable
- Se puede intentar guardar nuevamente

### 10. Actualización en Tiempo Real

**Objetivo**: Verificar que la tabla se actualiza inmediatamente

**Pasos**:
1. Guardar una prueba
2. Observar la tabla

**Resultado esperado**:
- La tabla se actualiza sin necesidad de recargar la página
- La nueva prueba aparece inmediatamente en la tabla
- El contador de pruebas se actualiza correctamente

## Pruebas de Rendimiento

### Carga de Datos Iniciales

**Objetivo**: Verificar que los IDs se cargan rápidamente

**Resultado esperado**:
- Los campos OT y Prueba deben mostrar valores en menos de 2 segundos
- Las consultas se realizan en paralelo (async-parallel)

### Guardado de Datos

**Objetivo**: Verificar que el guardado es eficiente

**Resultado esperado**:
- El guardado debe completarse en menos de 3 segundos
- El feedback visual debe ser inmediato

### Caché de IDs

**Objetivo**: Verificar que el caché funciona correctamente

**Pasos**:
1. Seleccionar una compañía
2. Guardar primera prueba
3. Seleccionar la misma compañía en campos de prueba
4. Observar tiempo de respuesta

**Resultado esperado**:
- La segunda vez que se busca un ID, debe ser instantáneo (caché en memoria)

## Casos Edge

### Sin Registros Previos

**Escenario**: Base de datos sin órdenes ni pruebas previas

**Resultado esperado**:
- OT = 1
- Prueba = 1

### Valores Grandes

**Escenario**: Orden = 9999, Prueba = 99999

**Resultado esperado**:
- El sistema debe manejar correctamente valores grandes
- Los campos deben mostrar los valores completos

### Compañía sin Contactos

**Escenario**: Seleccionar una compañía que no tiene contactos

**Resultado esperado**:
- El campo Contacto queda vacío pero habilitado
- Se muestra "No hay contactos para esta empresa"
- Se permite crear un nuevo contacto

### Productos con Búsqueda

**Escenario**: Base de datos con 1500+ productos

**Resultado esperado**:
- El combobox de productos usa búsqueda asíncrona
- Solo carga 100 resultados a la vez
- La búsqueda es eficiente y rápida

## Checklist de Pruebas

- [ ] Inicialización correcta de IDs
- [ ] Creación de primera orden y prueba
- [ ] Agregado de pruebas adicionales
- [ ] Limpieza correcta de campos
- [ ] Bloqueo de campos de orden
- [ ] Validación de campos obligatorios
- [ ] Actualización en tiempo real de la tabla
- [ ] Manejo de errores
- [ ] Estados de carga
- [ ] Mensajes de éxito
- [ ] Caché de IDs
- [ ] Rendimiento aceptable
- [ ] Casos edge manejados

## Herramientas de Depuración

### Console.log

Los servicios tienen console.error para errores. Para ver más detalles:

```javascript
// En registroService.ts, agregar temporalmente:
console.log('Siguiente Orden ID:', siguienteOrdenId);
console.log('Siguiente Prueba ID:', siguientePruebaId);
```

### Supabase Dashboard

Verificar directamente en Supabase:
- Tabla `ordenes_trabajo`
- Tabla `pruebas_ordenes_trabajo`
- Vista `vistamaestratotal`

### React DevTools

Verificar los hooks:
- Estado de `useWorkOrderRegistration`
- Estado de `useFormularioRegistro`
- Props de `WorkOrderTestsTable`
