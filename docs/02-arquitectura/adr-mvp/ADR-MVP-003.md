# ADR-MVP-003 — Sin panel interno por defecto; moderación desde consola

| Campo | Valor |
|---|---|
| **ID** | `ADR-MVP-003` |
| **Estado** | **Proposed** — pendiente de `forge-reviewer`, `forge-sentinel` y `apex-forge` |
| **Fecha** | 25 de noviembre de 2026 |
| **Decisores** | `apex-forge` + `forge-sentinel` |
| **Relacionado** | `DD-MVP-08`, `DD-MVP-09`, `DD-MVP-10`, `DD-MVP-19`, [Design Doc MVP §5.4, §6 y §8](../design-doc-mvp.md), N-MVP-09, SEC-MVP-007/008/015…020, Q-MVP-01/Q-MVP-02 |

## Contexto

El MVP necesita moderar reseñas antes de publicarlas (RF-MVP-033) y mantener como contenido tiendas, selecciones curadas y configuración pública (RF-MVP-008, RF-MVP-031, RF-MVP-042). El diseño anterior propone un panel admin con RF-062…068, roles, JWT en cookies `httpOnly`, MFA y auditoría inmutable. El cliente no autorizó un panel en este MVP y los requisitos aprobados establecen que **no se asume**: por defecto se usa la consola de Vercel/BD con SSO + MFA y privilegios mínimos. Los requisitos `SEC-MVP-016…020` son condicionales a que se decida crear un panel; `SEC-MVP-015` aplica por defecto.

## Decisión

**No crear `/admin`, login, contraseñas, tokens en frontend, parámetros mágicos ni sesiones de operador en el código del MVP.** La aprobación/rechazo/borrado de reseñas (con motivo interno), la edición de `app_config` y sus proyecciones `curated_selections`/`sites`, y la resolución de baja/rectificación se realizan desde la **consola Vercel/BD con SSO + MFA**, con acceso mínimo y sin credenciales compartidas. La superficie pública de escritura se limita a la Server Action `submitReview`; no hay endpoints de moderación ni de mutación pública.

**A3 — baja/rectificación sin token:** cada reseña publicada muestra un enlace **`wa.me` neutral** («Solicitar baja o corrección»). El moderador verifica de forma **manual** contra el correo HMAC-SHA256 que el autor proporciona (A4), **recalculando el hash con `email_hmac_key_version` persistida en la fila y no con la versión vigente del pepper**; ejecuta después la baja/corrección en la consola. Así, una rotación de pepper no rompe la comparación (DD-MVP-22). **No hay token en URL, query, logs ni `Referer`**, no hay endpoint público de mutación y no se pide documento de identidad. Se cumplen los plazos de **≤ 10 días hábiles** para consultas y **≤ 15 días hábiles** para reclamos (SEC-MVP-008 por «correo usado»). La alternativa con **token de un solo uso queda diferida a un Design Doc nuevo si se autoriza panel**; no se implementa aquí.

**A5 — menores:** si el moderador detecta un menor, se **borran** la reseña, el correo HMAC y los metadatos asociados. Esta es una **excepción explícita** a la regla de conservar evidencia de consentimiento; se documenta en el procedimiento de moderación, sin PII en logs.

Si Q-MVP-01/Q-MVP-02 deciden crear un panel mínimo, este ADR queda **supersedido por un Design Doc nuevo** y aplican íntegramente `SEC-MVP-016…020` (SSO/OIDC + MFA, cookies seguras, RBAC, auditoría `append-only` de 180 días, CSRF/CORS y validación en servidor). Ese sería el momento de reevaluar el token de un solo uso.

## Consecuencias

**Positivas**

- Cero código de autenticación propia: se elimina una superficie de ataque completa y el riesgo de sesiones mal configuradas.
- Menor coste y time-to-market; la moderación puede empezar con la herramienta que el equipo ya usa.
- Coherente con la arquitectura sin worker ni API REST pública.

**Negativas / costes aceptados**

- La moderación depende de personas y de la disciplina de acceso a la consola: requiere procedimiento documentado, SSO + MFA verificables y dueño designado (Q-MVP-02).
- Sin auditoría en la app: la trazabilidad se apoya en los registros de la consola, con retención gobernada por la plataforma (180 días solo si llega a existir panel, SEC-MVP-018).
- El enlace público de baja/rectificación no muta datos por sí mismo: es un `wa.me` neutral, sin token en URL/query/logs/`Referer`; la resolución es manual contra correo HMAC **con la versión persistida** y debe cumplir ≤10/≤15 días hábiles.
- Sin token de un solo uso hay menos superficie de ataque, pero la verificación depende de que el autor recuerde el correo usado; se mitiga con el dedup por HMAC(IP)+producto/alias cuando no lo proporcione (A4).
- El borrado por menor elimina evidencia de consentimiento: es una excepción gobernada y auditada en el procedimiento, no una omisión.

## Alternativas evaluadas

| Alternativa | Por qué se rechaza |
|---|---|
| **Construir el panel mínimo ahora** | Añade auth, roles y auditoría no autorizados; activa `SEC-MVP-016…020` y contradice N-MVP-09. Podría reintroducir cuentas de cliente si se reutiliza mal el modelo anterior. |
| **Reutilizar el panel admin de Fase 2 completo** | Incluye gestión de pedidos, pagos, inventario FEFO y POS; todo eso está fuera de alcance. |
| **Token de un solo uso en la URL de baja/rectificación** | Introduciría un secreto en query, logs e Historial/`Referer`, exigiría almacenar `review_verification_tokens` y un endpoint público de mutación. Diferido a DD nuevo si se autoriza panel (A3). |
| **Delegar la moderación a un CMS con usuarios propios** | No resuelve la titularidad de datos ni el consentimiento versionado, y crea otra superficie de identidad que habría que auditar. |

## Estado

**Proposed.** `forge-sentinel` ya validó en diseño el uso de consola con SSO + MFA, el enlace `wa.me` sin token, el HMAC de correo/IP **con versión persistida** y el borrado por menor (A3/A4/A5, DD-MVP-22; evidencias de release pendientes); `forge-reviewer` debe confirmar la ausencia de rutas de autenticación y de `review_verification_tokens`. Q-MVP-01 y Q-MVP-02 permanecen abiertas: esta decisión es el **por defecto**, no una respuesta inventada a esas preguntas.
