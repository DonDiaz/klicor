# Estructura recomendada para `Perfil` en el dashboard

## Objetivo

Definir la mejor forma de organizar el bloque `Perfil` dentro del dashboard de Klicor, con un criterio claro de producto, UX y escalabilidad.

Este documento deja una decisión explícita:

- **la información de suscripción debe quedar dentro de `Perfil`**
- **no debe vivir como una sección principal separada del editor**

---

## Diagnóstico del problema

Hoy el dashboard mezcla varias capas de información:

- datos de identidad del negocio
- seguridad y recuperación
- estado operativo de la cuenta
- enlaces públicos
- apariencia visual
- suscripción

Cuando esas capas se presentan sin una jerarquía clara, el panel se siente:

- más pesado
- menos intuitivo
- más parecido a un panel técnico que a un editor de negocio

Además, cuando la suscripción aparece como bloque independiente, transmite la idea de que “pagar” es una tarea principal del producto, cuando en realidad el flujo principal del usuario es:

1. editar su presencia pública
2. compartirla
3. cobrar o captar clientes

La suscripción condiciona el acceso, pero **no es el centro del uso diario**.

---

## Principio rector

En Klicor, `Perfil` no debe entenderse solo como “nombre e imagen”.

`Perfil` debe representar la **identidad operativa de la cuenta**.

Eso incluye:

- quién es el negocio
- cómo se identifica públicamente
- cómo se recupera la cuenta
- en qué estado operativo se encuentra la cuenta
- si la cuenta está activa, en prueba, vencida o suspendida

Por esa razón, la suscripción pertenece a `Perfil`.

---

## Decisión de producto

### La suscripción sí o sí debe quedar dentro de `Perfil`

Razones:

1. **Es metadata de la cuenta, no contenido público**
   La suscripción no modifica la landing como contenido. Modifica permisos, continuidad y estado operativo.

2. **Afecta edición y acceso**
   Si el plan vence, se afecta la capacidad de editar. Eso la acerca más a seguridad/estado de cuenta que a enlaces o diseño.

3. **Reduce ruido visual**
   Tener `Suscripción` como bloque independiente compite con tareas que sí son del flujo principal del editor.

4. **Ordena mejor el dashboard**
   Deja el editor centrado en tres cosas claras:
   - perfil
   - enlaces/cobros
   - apariencia

5. **Escala mejor**
   En el futuro puedes agregar:
   - renovaciones
   - historial
   - facturación
   - alertas de vencimiento

   y todo sigue viviendo dentro del contexto de cuenta, no mezclado con el contenido del perfil público.

---

## Estructura recomendada del dashboard

### 1. Resumen superior

Debe ser corto y operativo.

Contenido recomendado:

- estado de la cuenta
- link público
- QR oficial

No debe incluir:

- demasiados accesos rápidos
- demasiadas tarjetas
- elementos secundarios que distraigan del editor

---

### 2. Bloques principales del editor

Orden recomendado:

1. **Perfil**
2. **Enlaces y cobros**
3. **Apariencia**

La vista previa puede vivir al lado o colapsada, pero no como bloque principal.

---

## Estructura interna recomendada para `Perfil`

Dentro de `Perfil`, el orden correcto debería ser este:

### A. Identidad del negocio

Campos:

- nombre del negocio
- username
- imagen del negocio

Este es el primer bloque porque define la identidad pública visible.

### B. Seguridad y recuperación

Campos:

- correo de respaldo
- teléfono de recuperación
- estado de verificación

Este bloque va después de identidad porque protege lo que ya se definió arriba.

### C. Suscripción y estado de cuenta

Campos recomendados:

- estado actual
  - período de prueba
  - activa
  - vencida
  - suspendida
- fecha de corte o vencimiento
- valor del plan
- CTA principal
  - activar plan
  - renovar plan
- mensaje corto de impacto
  - por ejemplo: “Tu cuenta puede seguir editando”
  - o: “Tu cuenta quedará en modo restringido si no renuevas”

Este bloque debe vivir **dentro de `Perfil`**, idealmente al final del acordeón, porque:

- primero se edita la identidad
- luego se protege la cuenta
- y finalmente se revisa su estado operativo

Ese orden es natural y fácil de entender.

---

## Qué no debería ir dentro de `Perfil`

No deberían quedarse aquí:

- enlaces a redes
- correo como botón público
- llave Bre-B
- QR oficial de cobro
- configuración del VCF
- estilos visuales

Esos elementos pertenecen a la experiencia pública del perfil y deben vivir fuera de `Perfil`.

---

## Dónde deberían vivir las otras piezas

### `Enlaces y cobros`

Debe agrupar:

- redes sociales
- sitio web
- correo público
- WhatsApp
- llave Bre-B
- QR oficial de cobro
- futuros métodos de cobro

Razón:

todo eso forma parte del conjunto de canales visibles o accionables desde la landing.

### `Apariencia`

Debe agrupar:

- colores
- estilos
- presets
- transparencia
- tipografía visual
- forma de avatar y botones

Razón:

todo eso afecta cómo se ve la página, no cómo opera la cuenta.

---

## Regla de UX para la suscripción

La suscripción debe ser visible, pero no dominante.

Eso significa:

- sí debe estar accesible
- sí debe mostrar su estado con claridad
- sí debe tener CTA directo
- pero no debe competir visualmente con el flujo principal del editor

La mejor forma de lograrlo es:

- ubicarla dentro de `Perfil`
- convertirla en un bloque de estado claro
- darle copy corto y preciso

No conviene convertirla en una pantalla o sección separada salvo que más adelante exista un módulo completo de facturación.

---

## Propuesta final de jerarquía

### Dashboard

- Resumen superior
  - estado
  - link público
  - QR oficial

- Perfil
  - identidad del negocio
  - seguridad y recuperación
  - suscripción y estado de cuenta

- Enlaces y cobros
  - redes
  - correo
  - WhatsApp
  - llave Bre-B
  - QR oficial
  - futuros métodos de pago

- Apariencia
  - presets
  - controles visuales

- Vista previa
  - colapsada por defecto o lateral

---

## Decisión final

Para Klicor, la estructura correcta es:

- **`Suscripción` dentro de `Perfil`**
- **no como sección principal independiente**

Eso mejora:

- claridad
- carga mental
- orden del dashboard
- escalabilidad futura
- coherencia entre cuenta, seguridad y estado operativo

---

## Siguiente paso recomendado

Cuando se implemente esta reorganización, el trabajo debería hacerse así:

1. mover el bloque actual de suscripción dentro del acordeón `Perfil`
2. dejar el dashboard superior solo con resumen operativo
3. renombrar `Enlaces` a `Enlaces y cobros`
4. preparar ese bloque para múltiples métodos de cobro más adelante
