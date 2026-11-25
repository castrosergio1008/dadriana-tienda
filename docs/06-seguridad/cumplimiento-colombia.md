# Cumplimiento en Colombia — Adriana_tienda

> **Aviso importante:** Este documento es una **guía informativa y técnica** preparada por `forge-sentinel` para alinear el diseño e implementación con el marco legal colombiano aplicable. **No constituye asesoría legal.** Antes de publicar la política de privacidad, los textos de consentimiento y la inscripción en el RNBD, el cliente debe validarlos con su abogado/contador. Las normas y su interpretación cambian: verificar vigencia.

| Campo | Valor |
|---|---|
| Propietario | `forge-sentinel` |
| Responsable del tratamiento | Adriana_tienda (razón social y NIT: `<VALUE>` — completar cliente) |
| Contacto de datos | `<VALUE>` (correo de la organización, p. ej. privacidad@<DOMINIO>) |
| Normativa núcleo | Ley 1581 de 2012, Decreto 1377 de 2013, Ley 1273 de 2009 |

---

## 1. Mapa normativo y implicación técnica

| Norma | Qué exige | Cómo se refleja en el aplicativo |
|---|---|---|
| **Ley 1581 de 2012** (Habeas Data) | Tratamiento con autorización previa, informada y libre; principios de legalidad, finalidad, veracidad, transparencia, acceso restringido, seguridad y confidencialidad; derechos del titular | `Consent` con versión/fecha/IP; DTOs mínimos; cifrado de PII; flujo SARA; supresión y revocatoria |
| **Decreto 1377 de 2013** | Desarrollo de la Ley 1581: aviso de privacidad, reglas para la autorización, registro de bases de datos | Aviso de privacidad publicado, textos de consentimiento versionados, evaluación RNBD |
| **Ley 1273 de 2009** | Tipifica delitos contra la información y los datos: acceso no autorizado, daño a sistemas, interceptación, fraude informático y abuso de mecanismos de pago | MFA, RBAC, auditoría inmutable, cifrado, webhooks firmados, control de reembolsos (ver SEC-005, SEC-015, SEC-017, SEC-025) |
| **Ley 1480 de 2011** (Estatuto del Consumidor) | Información clara de precio/entrega, derecho de retracto en ventas a distancia (5 días hábiles), reversión del pago | Precio total con IVA (1900 bp sobre BIGINT centavos, C-02), política de devoluciones, flujo `RETURN_REQUESTED` y reembolso |
| **Ley 527 de 1999** | Validez jurídica de mensajes de datos y firma electrónica | Consentimiento y confirmaciones por email quedan registrados con timestamp e IP |
| **Reglas DIAN (facturación electrónica)** | Factura de venta electrónica con CUFE, numeración, notas crédito y contingencia | Integración con proveedor tecnológico; nunca emitir factura sin pago confirmado |

---

## 2. Clasificación de datos y bases de uso

| Dato (campos del esquema) | Categoría | Finalidad | Base de uso | Retención propuesta* |
|---|---|---|---|---|
| `email`, `firstName`, `lastName` | Personal | Identificación, compra, comunicaciones | Ejecución del contrato / consentimiento | `<VALUE>` (p. ej. 24 meses tras última actividad) |
| `phone` (cifrado), `phoneHash` | Personal | Entrega, soporte, WhatsApp si autoriza | Consentimiento / contrato | `<VALUE>` |
| `documentType`, `documentNumber` (cifrados) | Personal | Facturación y trazabilidad | Obligación legal / contrato | `<VALUE>` — validar con contador |
| `birthDate` | Personal (puede ser sensible en contexto) | Promociones de cumpleaños | Consentimiento explícito | `<VALUE>` |
| `addresses` | Personal | Entrega y facturación | Contrato | `<VALUE>` |
| `passwordHash`, `tokenHash`, `sessions` | Credenciales | Autenticación | Contrato / seguridad | Duración de la sesión + `<VALUE>` |
| `orders`, `payments`, `invoices` | Personal + financiero | Cumplimiento, garantía, fiscal | Contrato / obligación legal | `<VALUE>` — **validar con contador** (norma fiscal/comercial vigente) |
| `consents`, `newsletter_subscriptions` | Personal + evidencia | Acreditar autorización y revocar | Consentimiento | `<VALUE>` tras revocatoria (conservar prueba mínima) |
| `audit_logs`, `webhook_events` | Operativo / evidencia | Seguridad, no-repudio, conciliación | Interés legítimo / seguridad | `<VALUE>` — alinear con retención fiscal |
| Reseñas (con seudónimo) | Personal / público | Contenido | Consentimiento | Mientras el contenido esté publicado |
| IP y userAgent en logs/auditoría | Personal (identificable) | Seguridad y fraude | Seguridad | `<VALUE>` (corto, p. ej. 90 días) |

\* Los valores `<VALUE>` deben ser definidos por el cliente con su contador/abogado y registrados en la política de retención. **No inventar plazos legales en el código.**

> **Datos sensibles:** No recoger datos de salud (alergias, condiciones de piel), biométricos ni datos de menores de 18 años sin una necesidad demostrada y autorización expresa del titular o su representante. Si el catálogo sugiere "rutinas según tu condición", **no** pedir esa condición en un formulario.

> **BLOQUEANTE:** No se habilita ningún campo nuevo en formularios de cliente sin su finalidad, base de uso y retención documentados aquí.

---

## 3. Derechos del titular y procedimiento SARA

La Ley 1581/2012 reconoce, entre otros, los derechos a **conocer, actualizar y rectificar** la información; **solicitar copia**; **consultar**; **revocar la autorización** y/o **solicitar la supresión**; y **oponerse al tratamiento** cuando proceda. También se aplican las garantías sobre decisiones automatizadas según el desarrollo reglamentario.

| Solicitud | Canal | Plazo objetivo (días hábiles) | Acción técnica |
|---|---|---|---|
| **Consulta** | `privacidad@<DOMINIO>` / formulario en `/privacidad` | **10** (Ley 1581) | Exportar datos del titular en formato legible, previa verificación de identidad |
| **Reclamo** (rectificación, supresión, revocatoria) | El mismo canal + correo certificado si aplica | **15** (Ley 1581) | Corregir/eliminar; registrar `Consent` de revocatoria y `audit_logs` |
| **Revocatoria de marketing** | Link "Cancelar suscripción" en cada correo + preferencias de cuenta | Inmediato (≤ 24 h) | `newsletter.status=UNSUBSCRIBED`, `consents.granted=false`, baja del proveedor de email |
| **Revocatoria de cookies** | Footer "Preferencias de cookies" | Inmediato | Borrar cookies no esenciales y detener GA4/GTM/píxeles |
| **Supresión total** | Solicitud verificada | `<VALUE>` | Anonimizar/purge respetando retención fiscal; conservar solo evidencia mínima del tratamiento |

**Reglas del procedimiento:**
1. **Verificar identidad** antes de entregar o borrar datos (token firmado enviado al email registrado; para documentos, validación adicional).
2. Registrar la solicitud con `requestId`, fecha de radicación, tipo de derecho y resolución en `audit_logs`.
3. Nunca confirmar la existencia de una cuenta a un tercero mediante respuestas distintas (ver SEC-007).
4. Si la supresión entra en conflicto con una obligación fiscal, **bloquear el tratamiento** distinto de la conservación legal e informar al titular.

> **BLOQUEANTE:** Sin un procedimiento SARA documentado y un canal de contacto público, no se publica la recolección de datos personales.

---

## 4. Política de privacidad y aviso de tratamiento

La política debe estar publicada en `/privacidad`, ser accesible desde el footer y el checkout, y estar **versionada**. Debe contener como mínimo:

1. Identidad y datos de contacto del responsable (razón social, NIT, dirección, correo).
2. Qué datos se recogen y para qué finalidades (tabla de la sección 2).
3. Base de uso y si la entrega es obligatoria u opcional (qué pasa si no se entrega).
4. Tratamiento de datos sensibles y de menores (política de no recolección).
5. Destinatarios: pasarela (Wompi/ePayco), transportadora, proveedor DIAN, email/WhatsApp, analítica (solo con consentimiento).
6. Transferencias internacionales cuando aplique (Vercel, Neon, Cloudflare, Sentry) y medidas de protección.
7. Plazos de retención y criterios de eliminación.
8. Derechos del titular y cómo ejercerlos (canal y plazos).
9. Uso de cookies y cómo cambiar las preferencias.
10. Seguridad de la información (medidas técnicas: cifrado, control de acceso, auditoría).
11. Fecha de entrada en vigor y versión; historial de cambios.

> **BLOQUEANTE:** La política no puede decir "no compartimos sus datos" cuando se envían a la pasarela, transportadora o proveedor DIAN. La veracidad es un principio legal (Ley 1581).

---

## 5. Consentimiento en formularios y newsletter

### 5.1 Reglas de diseño

| Regla | Implementación |
|---|---|
| **Libre y expreso** | Checkbox sin premarcar; el botón de compra no depende de aceptar marketing |
| **Informado** | Texto claro junto al checkbox con enlace a la política versión vigente |
| **Granular** | Un consentimiento para términos/tratamiento (necesario para la compra) y otro separado para marketing y otro para cookies |
| **Versionado** | `Consent.version` guarda la versión del texto aceptado |
| **Evidencia** | `Consent` registra `granted`, `ip`, `userAgent`, `createdAt`, `userId`/`anonymousId` |
| **Revocable** | Igual de fácil darlo que quitarlo; link en cada email y preferencias de cuenta |
| **Doble confirmación (newsletter)** | Alta en estado `PENDING`; se activa solo al hacer clic en el token del email |

### 5.2 Plantilla de cláusula de consentimiento (documental — validar con abogado)

```text
Acepto el Tratamiento de mis datos personales de acuerdo con la Política de Privacidad
versión <VALUE> (fecha <VALUE>), para las finalidades de: (i) gestionar mi compra,
entrega y facturación; (ii) atención al cliente; y (iii) [si aplica] enviarme
comunicaciones comerciales por email/WhatsApp sobre productos y promociones.

Entiendo que puedo revocar este autorización en cualquier momento escribiendo a
privacidad@<DOMINIO> o usando el enlace "Cancelar suscripción" incluido en cada mensaje,
y que la revocatoria no afecta las operaciones realizadas con anterioridad.

[ ] Acepto el tratamiento de mis datos para la compra y la atención (obligatorio)
[ ] Acepto recibir comunicaciones comerciales (opcional)
```

### 5.3 Plantilla de aviso breve en el checkout

```text
Al confirmar tu pedido aceptas nuestros Términos y Condiciones y el Tratamiento de tus
datos para procesar la compra, la entrega y la facturación. Consulta nuestra
Política de Privacidad. No compartiremos tus datos con terceros distintos de los
necesarios para entregar tu pedido (pasarela de pago, transportadora y facturación).
```

> **BLOQUEANTE:** Ningún checkbox de marketing premarcado, ninguna "aceptación implícita" por seguir navegando y ningún registro de consentimiento sin versión y fecha.

---

## 6. Cookies

| Categoría | Ejemplos | Consentimiento | Combatibilidad |
|---|---|---|---|
| **Necesarias** | Sesión, carrito, CSRF, consentimiento, balanceo | No requieren autorización previa (estrictamente necesarias) | No se pueden desactivar desde el banner |
| **Analítica** | GA4, Vercel Analytics | Requiere aceptación | Se cargan solo tras aceptar la categoría |
| **Marketing** | Píxeles de Meta/Google, remarketing | Requiere aceptación | Se cargan solo tras aceptar la categoría |

**Reglas del banner y la política:**
- El banner aparece en el primer acceso y **no** asume aceptación por defecto: botones "Aceptar todas" y "Rechazar opcionales" con el mismo peso visual.
- "Configurar" permite elegir por categoría; la decisión se persiste en cookie de consentimiento con versión y fecha (`Consent`).
- Hasta que haya consentimiento, **no** se inyectan scripts de GA4/GTM/píxeles (ver SEC-029). Comprobar en la pestaña Red.
- La política de cookies enumera cada cookie, su finalidad, duración y si es propia o de tercero.
- El footer incluye "Preferencias de cookies" accesible en todo momento.

> **BLOQUEANTE:** Cargar analítica o píxeles antes del consentimiento bloquea el lanzamiento.

---

## 7. Retención y eliminación

| Tipo de dato | Criterio de retención | Eliminación |
|---|---|---|
| Cuenta inactiva | `<VALUE>` desde último login | Aviso previo por email; anonimizar PII y conservar solo lo fiscalmente exigido |
| Carrito abandonado | `expiresAt` (30 días propuestos) | Job de purga |
| Sesiones | Hasta `expiresAt` + `<VALUE>` | Borrado programado; revocación inmediata al logout |
| Pedidos/facturas | Según obligación fiscal/contable vigente (**validar con contador**) | No borrar mientras exista la obligación; bloquear el tratamiento |
| Logs de seguridad | `<VALUE>` días | Rotación y purga automática |
| `audit_logs` | `<VALUE>` (alineado con fiscal) | Export inmutable; no borrado por app (SEC-017) |
| Newsletter | Hasta revocatoria o inactividad `<VALUE>` | Baja inmediata del proveedor de email |
| Consentimientos | Vigencia del tratamiento + prescripción (**validar**) | Conservar evidencia mínima de la revocatoria |

**Procedimiento de supresión:**
1. Verificar identidad y existencia de obligaciones de retención.
2. Anonimizar/cifrar-inutilizar los campos personales; eliminar derivados (índice de búsqueda, caché Redis, R2 si aplica).
3. Registrar la acción en `audit_logs` y el `Consent` de revocatoria.
4. Confirmar al titular por escrito.

> **BLOQUEANTE:** No existe un "botón de borrar" que elimine registros fiscales sin validación. La supresión se implementa como **bloqueo + anonimización** cuando hay retención legal.

---

## 8. Registro Nacional de Bases de Datos (RNBD)

- La Ley 1581 y su normativa de desarrollo prevén la inscripción de bases de datos que contengan datos personales ante la autoridad de protección de datos (Superintendencia de Industria y Comercio), con las excepciones que la ley establece (p. ej., bases de datos de uso exclusivamente personal, algunas de las cuales no requieren inscripción).
- **Acción antes del go-live:** el cliente debe determinar, con su abogado, si Adriana_tienda debe inscribir sus bases de datos (clientes, pedidos, newsletter, proveedores/empleados) y completar el trámite con la información vigente que exija la SIC.
- **Soporte técnico que debemos preparar:**
  - Inventario de bases de datos y campos (sección 2 de este documento).
  - Finalidades, destinatarios y transferencias internacionales.
  - Política de privacidad publicada y procedimiento SARA.
  - Responsable del tratamiento y canal de contacto.
- Si aplica, la inscripción y su número de registro se anotan en la política de privacidad (`<VALUE>`).

> **BLOQUEANTE:** Si el análisis legal concluye que aplica, el RNBD y la política publicada deben estar listos antes de recolectar datos de clientes en producción.

---

## 9. Ley 1273 de 2009 — delitos informáticos y controles técnicos

| Conducta tipificada (descripción general) | Control que la previene | Requisito |
|---|---|---|
| Acceso no autorizado a sistemas o datos | MFA (Admin/Superadmin en MVP; Vendedor en Fase 2, C-04), RBAC server-side, sesiones de 8 h, mínimo privilegio de BD | SEC-003, SEC-005, SEC-002 |
| Daño o deterioro de sistemas/bases de datos | Backups cifrados, PITR, control de cambios, WAF | SEC-019, SEC-030 |
| Interceptación/lectura ilícita de datos | TLS 1.2+, cifrado en reposo, secretos en gestor | SEC-013, SEC-012, SEC-015 |
| Fraude informático (manipulación para obtener beneficio) | Validación en servidor, precios recalculados, idempotencia, conciliación | SEC-006, SEC-025, SEC-026 |
| Abuso de mecanismos de pago | Checkout-hosted, webhooks firmados, reembolsos con MFA y umbrales, anti-fraude | SEC-025, SEC-026, `pagos-y-pci.md` |
| Obstaculización de sistemas | Rate limiting, colas con backpressure, monitoreo | SEC-011, SEC-017 |

La auditoría inmutable (`audit_logs` con hash encadenado) es la evidencia técnica frente a estos delitos. **Sin ella no hay no-repudio.**

---

## 10. Checklist de cumplimiento para el lanzamiento

| # | Ítem | Estado | Bloqueante |
|---|---|---|---|
| 1 | Responsable del tratamiento identificado (razón social, NIT, correo) | ☐ | Sí |
| 2 | Política de privacidad versionada y publicada en `/privacidad` | ☐ | Sí |
| 3 | Aviso de tratamiento en checkout y formularios | ☐ | Sí |
| 4 | Catálogo de datos con finalidad, base y retención (sección 2) | ☐ | Sí |
| 5 | Consentimiento granular, sin premarcar, con versión y evidencia | ☐ | Sí |
| 6 | Double opt-in de newsletter y revocatoria en un clic | ☐ | Sí |
| 7 | Banner de cookies con rechazo de opcionales; analítica bloqueada hasta consentir | ☐ | Sí |
| 8 | Procedimiento SARA con plazos 10/15 días hábiles y verificación de identidad | ☐ | Sí |
| 9 | Decisión RNBD documentada (aplica / no aplica + justificación) | ☐ | Sí |
| 10 | Plazos de retención validados por contador/abogado | ☐ | Sí |
| 11 | Textos legales revisados por asesoría jurídica del cliente | ☐ | Sí |
| 12 | Política de devoluciones/retracto (Ley 1480) coherente con el flujo de reembolsos | ☐ | Sí |

---

## 11. Referencias

- Ley 1581 de 2012 — Protección de datos personales (Habeas Data).
- Decreto 1377 de 2013 — Reglamentación parcial de la Ley 1581; aviso de privacidad y registros.
- Ley 1273 de 2009 — Modificación del Código Penal, protección de la información y los datos.
- Ley 1480 de 2011 — Estatuto del Consumidor.
- Ley 527 de 1999 — Mensajes de datos y firma electrónica.
- Documentación interna: `plan-seguridad.md`, `requisitos-seguridad.md` (SEC-009, SEC-017, SEC-029), `pagos-y-pci.md`.
