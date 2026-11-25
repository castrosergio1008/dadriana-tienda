# Plan de Respuesta a Incidentes — Adriana_tienda

| Campo | Valor |
|---|---|
| Propietario | `forge-sentinel` |
| Comandante de incidente | `apex-forge` |
| Alcance | Storefront, admin, APIs, BD, pasarela/webhooks, secretos, infra y datos personales |
| Referencias | NIST SP 800-61 (detección/contención/erradicación/recuperación/lecciones), Ley 1581/2012, `modelo-amenazas.md` |

> **BLOQUEANTE:** Todo incidente con datos personales, fraude de pago o compromiso de credenciales se escala de inmediato a `forge-sentinel` y al Comandante. Nunca se silencia ni se "arregla sin registrar".

---

## 1. Clasificación

| Nivel | Definición | Ejemplos | Tiempo de respuesta objetivo | Escalado |
|---|---|---|---|---|
| **SEV1 — Crítico** | Compromiso de datos personales, secretos o dinero; caída total del checkout/admin | Fuga de PII, webhook falso con cobros, admin tomado, PAN en logs, ransomware | Detección→triaje **15 min**; contención **30 min** | Inmediato: Comandante, `sentinel`, `infra`, cliente/legal |
| **SEV2 — Alto** | Degradación fuerte o riesgo alto sin confirmación de fuga | Credential stuffing exitoso en una cuenta, error de conciliación, XSS reportado, dependencia crítica explotable | Triaje **30 min**; contención **2 h** | `sentinel`, dueño del componente, `qualis` |
| **SEV3 — Medio** | Fallo de seguridad sin explotación confirmada | CSP violada, configuración errónea, 429 mal calibrado, datasets sin cifrar en staging | Triaje **4 h**; resolución **2 días** | Dueño del componente + `sentinel` |
| **SEV4 — Bajo** | Hallazgo de hardening / nit | Header faltante, log excesivo, documento desactualizado | Resolución **10 días** | Backlog con `seguridad` |

Se puede **escalar** de nivel en cualquier momento; el criterio es impacto, no la etiqueta inicial.

---

## 2. Equipo de respuesta

| Rol | Responsabilidad en el incidente | Nombre/contacto |
|---|---|---|
| Comandante (`apex-forge`) | Decisor único; autoriza contención drástica, rollback y comunicación | `<VALUE>` |
| **`forge-sentinel`** | Clasifica, dirige la investigación de seguridad, documenta evidencia y veredicto | `<VALUE>` |
| `forge-infra` | Aísla entornos, rota secretos, aplica reglas WAF, restore/backups | `<VALUE>` |
| `forge-backend` / `forge-frontend` | Parchea, despliega fix, analiza logs y datos | `<VALUE>` |
| `forge-qualis` | Verifica el fix con tests, valida canary y rollback | `<VALUE>` |
| Cliente (negocio/legal) | Notificaciones a titulares/autoridades, relación con la pasarela, respuesta jurídica | `<VALUE>` |
| Comunicación | Un solo portavoz; evita mensajes contradictorios | `<VALUE>` |

> Regla: **un solo canal de mando** (puente de incidente + canal `#incidente-<VALUE>`). Todo lo que se decida se escribe en la bitácora con timestamp.

---

## 3. Procedimiento

### 3.1 Detección y reporte
- Fuentes: Sentry, alertas de Vercel/Cloudflare, monitoreo de WAF, reportes de clientes, avisos de la pasarela, escaneo de secretos, revisión de auditoría.
- Cualquier miembro del equipo puede abrir un incidente; **no hace falta prueba completa** para escalar.
- Primer registro: qué se vio, cuándo (hora y zona), quién lo vio, sistemas afectados y `requestId` si aplica.

### 3.2 Triaje (≤ 15 min para SEV1)
1. Clasificar SEV.
2. Nombrar Comandante y responsable de bitácora.
3. Determinar si hay **datos personales, secretos o dinero** involucrados (dispara obligación legal y de comunicación).
4. Abrir canal de incidente y congelar deploys no relacionados.

### 3.3 Contención
- **Inmediata:** revocar sesiones y tokens comprometidos, rotar secretos afectados, desactivar el usuario/rol implicado, bloquear IP/range en Cloudflare, poner endpoint en modo mantenimiento.
- **Si hay fuga de PII:** preservar evidencia **antes** de borrar nada; no reiniciar servidores sin volcado de logs.
- **Si hay fraude de pago:** pausar despachos, congelar liquidaciones, contactar a la pasarela.
- **Rollback:** si el incidente empezó con un deploy, `forge-infra` ejecuta rollback a la versión anterior; `forge-qualis` valida.
- Registrar cada acción con hora y responsable.

### 3.4 Erradicación
- Identificar causa raíz (entry point, credencial, dependencia, configuración).
- Eliminar persistencia: webhooks maliciosos, tokens, usuarios fantasma, claves, archivos en R2.
- Aplicar parche con PR de emergencia: sigue requiriendo LGTM de `forge-reviewer` y OK de `forge-sentinel` (no se salta el gate; se acelera).
- Rotar **todos** los secretos que pudieron estar expuestos, en todos los entornos.

### 3.5 Recuperación
- Restaurar desde backup cifrado verificado (SEC-019) si hubo pérdida/deterioro.
- Revalidar integridad: conciliación de pagos, stock por lote y `site_id` (FEFO, C-01), traza de movimientos de lotes, auditoría, facturas DIAN.
- Reactivar por fases (canary) con monitoreo reforzado durante **24 h**.
- Cerrar el incidente solo cuando el Comandante y `forge-sentinel` firman.

### 3.6 Postmortem sin culpa (≤ 5 días hábiles para SEV1/SEV2)
- Formato: resumen, impacto (pedidos, clientes, COP), cronología, causa raíz, factores contribuyentes, qué funcionó, qué falló, **acciones correctivas con dueño y fecha**.
- **Sin buscar culpables:** el objetivo es aprender, no sancionar. Se enfatiza el sistema (controles, procesos), no la persona.
- Acciones correctivas se convierten en tickets con criterios de aceptación y, si son seguridad, en nuevos requisitos SEC-xxx.
- Se comparte versión interna; la versión pública se coordina con el cliente/legal.

---

## 4. Tiempos objetivo (resumen)

| Hito | SEV1 | SEV2 | SEV3 |
|---|---|---|---|
| Detección → triaje | 15 min | 30 min | 4 h |
| Triaje → contención | 30 min | 2 h | 1 día |
| Contención → erradicación | 4 h | 1 día | 3 días |
| Recuperación completa | 24 h | 3 días | 10 días |
| Postmortem | 5 días hábiles | 10 días hábiles | Opcional |
| Comunicación inicial al cliente afectado | ≤ 72 h (o antes si lo exige la autoridad) | Según impacto | No aplica |

> Los plazos son **objetivos internos**, no sustituyen los plazos legales (Ley 1581 y normativa de protección de datos) ni los contratos con la pasarela. Validar con el asesor jurídico.

---

## 5. Plantillas de comunicación

### 5.1 Internet — aviso al cliente (datos personales)

```text
Asunto: Información importante sobre tu cuenta en Adriana_tienda

Hola <NOMBRE>:

Queremos informarte que el <FECHA> detectamos [descripción clara y honesta del hecho].
Como medida inmediata [contención aplicada] y ya [acción correctiva].

¿Qué datos podrían haberse visto afectados?
<LISTA DE CAMPOS — sin especulación; si no se sabe, decirlo>

¿Qué debes hacer?
[ACCIONES: cambiar contraseña / revisar correo / no hacer clic en enlaces sospechosos]
Si usaste la misma contraseña en otros sitios, te recomendamos cambiarla allí también.

No te pediremos tu contraseña, código de verificación ni datos de tarjeta por correo
o WhatsApp. Si recibes un mensaje haciéndolo, no respondas y repórtalo.

Puedes escribirnos a <CORREO_DE_CONTACTO> o al canal de atención <VALUE>.
Lamentamos lo ocurrido y estamos tomando las medidas para que no vuelva a suceder.

Equipo Adriana_tienda
```

### 5.2 Interno — primer aviso

```text
[INCIDENTE SEV<n>] <TITULO BREVE>
Hora de detección: <FECHA/HORA ZONA>
Detectado por: <NOMBRE> — fuente: <SENTRY/WAF/CLIENTE/OTRO>
Sistemas afectados: <VALUE>
Datos/pagos involucrados: <SÍ/NO — cuáles>
Comandante: <NOMBRE> | Responsable de bitácora: <NOMBRE>
Canal: #incidente-<VALUE>
Acción inmediata: <VALUE>
```

### 5.3 Pasarela / proveedor

```text
Asunto: Reporte de incidente — comercio <VALUE> — referencia <VALUE>
Fecha y hora (UTC): <VALUE>
Descripción: <VALUE>
Órdenes/pagos potencialmente afectados: <VALUE>
Medidas tomadas: <VALUE>
Solicitud: <congelación / revisión de transacciones / bloqueo de token / otra>
Contacto técnico: <VALUE>
```

### 5.4 Autoridad (solo por cliente/legal)

```text
Se remitirá el formato que exija la autoridad competente, con: identidad del responsable,
descripción del incidente, tipo y número de datos afectados, fecha, causas, medidas
tomadas y plan de notificación a los titulares. No enviar este borrador sin revisión jurídica.
```

> **BLOQUEANTE:** No se envía comunicación a clientes ni autoridades sin aprobación del Comandante y revisión del cliente/legal. Tampoco se promete "no hubo impacto" sin evidencia.

---

## 6. Canales de reporte de vulnerabilidades

| Canal | Uso |
|---|---|
| Correo | `security@<DOMINIO>` (monitoreado por `forge-sentinel`) |
| Web | Enlace "Reportar un problema de seguridad" en el footer → `/seguridad` con las reglas de divulgación |
| Clave PGP | Huella publicada en `/seguridad` (`<VALUE>`) para reportes confidenciales |
| Pasarela | Canal de soporte de Wompi/ePayco para temas de pago |
| Teléfono/WhatsApp | `<VALUE>` (atención al cliente; no para secretos) |

**Política de divulgación (publicar en `/seguridad`):**
- Agradecemos los reportes de buena fe; no se requiere ser cliente.
- **No** probar contra datos reales de terceros, no hacer DoS, no exfiltrar datos; usar cuentas de prueba propias.
- Incluir: descripción, pasos para reproducir, impacto estimado, evidencia (capturas/logs sin PII) y fecha.
- Acuse de recibo en **48 h hábiles**; respuesta de triaje en **5 días hábiles**; divulgación coordinada con plazo objetivo de **90 días**.
- Reconocimiento público si el reportero lo desea; **sin recompensa económica prevista en el MVP** (no anunciar un bug bounty que no existe).

---

## 7. Bitácora y evidencia

Cada incidente guarda, con retención `<VALUE>`:

- Cronología con timestamps y responsables.
- Logs estructurados y `requestId` correlacionados (sin PII sensible; SEC-018).
- Volcados de `audit_logs` y `webhook_events` del periodo.
- Commits/PRs del fix, evidencia de aprobación (`forge-reviewer` + `forge-sentinel`).
- Copia de las comunicaciones enviadas y de las decisiones del Comandante.
- Postmortem y acciones correctivas con estado.

> **BLOQUEANTE:** La bitácora es parte de la evidencia de cumplimiento (Ley 1581 / Ley 1273). Borrarla o no documentar un SEV1 bloquea el siguiente release hasta corregirse.

---

## 8. Checklist de preparación

| # | Ítem | Estado | Bloqueante |
|---|---|---|---|
| 1 | Contactos del equipo y del cliente actualizados | ☐ | No (30 días) |
| 2 | Canal `security@<DOMINIO>` y página `/seguridad` publicados | ☐ | No (30 días) |
| 3 | Alertas de Sentry/WAF configuradas con umbrales | ☐ | Sí |
| 4 | Procedimiento de rotación de secretos probado | ☐ | Sí |
| 5 | Restore de backup probado (SEC-019) | ☐ | Sí |
| 6 | Plan de rollback verificado en staging | ☐ | Sí |
| 7 | Simulacro de SEV1 con cronología y postmortem de prueba | ☐ | No (60 días) |
| 8 | Plantillas de comunicación revisadas por cliente/legal | ☐ | No (30 días) |
