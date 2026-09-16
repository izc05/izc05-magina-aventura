# Mágina Aventura — Mi Olivo, economía de aceitunas y canje QR

**Fecha:** 2026-09-16  
**Estado:** diseño aprobado en evolución; listo para revisión antes de implementación  
**Rama:** `feat/rewards-redemption-v1`  
**Base:** `feat/07d-reward-delivery-plan`

## 1. Objetivo

Convertir Mi Olivo en el centro emocional y de progresión de Mágina Aventura y conectar esa progresión con una economía interna simple, auditable y útil.

El usuario debe sentir que:

1. realiza actividades reales en Mágina Aventura;
2. su progreso permanente hace crecer su olivo;
3. gana aceitunas que puede gastar;
4. personaliza su olivo y su experiencia en la app;
5. puede canjear aceitunas por recompensas digitales, cupones, experiencias y productos físicos;
6. los premios físicos se entregan mediante un flujo QR seguro y auditable.

La experiencia debe sentirse como un minijuego premium integrado en la aplicación, no como una tienda separada ni como una criptomoneda.

---

## 2. Tres conceptos y una sola moneda

### XP

El XP es progreso permanente de Mágina Aventura.

- No se gasta.
- No disminuye cuando el usuario canjea recompensas.
- Procede únicamente de acciones válidas según las reglas de progresión.
- La actividad deportiva valiosa debe estar verificada por servidor antes de producir XP definitivo y recompensas económicas definitivas.
- Los umbrales de nivel son configurables y no deben quedar codificados en componentes de UI.

### Mi Olivo

Mi Olivo es la representación visual del progreso histórico del usuario.

- El nivel del olivo deriva del XP acumulado.
- Gastar aceitunas nunca hace retroceder el árbol.
- El olivo no muere ni se deteriora por no abrir la app.
- La progresión debe premiar actividad real, exploración, retos, descubrimientos y constancia, no obligaciones diarias artificiales.

### Aceitunas 🫒

Las aceitunas son la única moneda interna de la economía del juego.

- Son ganables y gastables.
- No son transferibles entre usuarios en V1.
- No son convertibles directamente en dinero.
- No son una criptomoneda ni un activo financiero.
- No se compran directamente con euros en V1.
- Su saldo se deriva de un ledger auditable, no de un contador editable sin trazabilidad.

El aceite/AOVE es producto, recompensa, coleccionable o elemento narrativo, pero no una segunda moneda.

---

## 3. Bucle principal

```text
actividad / reto / descubrimiento
        ↓
validación
        ↓
XP permanente + aceitunas
        ↓
crece Mi Olivo
        ↓
se desbloquean objetos / contenido
        ↓
usuario entra en Recompensas
        ↓
compra digital o reserva premio físico
        ↓
QR / token de un solo uso
        ↓
validación por comercio / almazara
        ↓
entrega
        ↓
canje consumido + auditoría
```

La motivación combina dos horizontes:

- **largo plazo:** hacer crecer el olivo y construir su historia;
- **corto/medio plazo:** acumular aceitunas para personalización, cupones y recompensas.

---

## 4. Dirección visual de Mi Olivo

### Estilo

Semirrealista tipo juego premium, adulto y ligado a Sierra Mágina.

No se busca fotorealismo completo ni estética infantil. El objetivo es un olivo reconocible, bello y con identidad propia, con suficiente estilización para poder evolucionar visualmente y animarse con buen rendimiento móvil.

### Tecnología visual V1

La primera versión debe priorizar una escena 2.5D por capas frente a un árbol 3D pesado.

Capas recomendadas:

1. paisaje/fondo;
2. terreno;
3. árbol;
4. objetos y recuerdos;
5. partículas/atmósfera;
6. HUD.

La arquitectura visual debe permitir sustituir o ampliar capas sin cambiar las reglas de progresión.

### Movimiento

- hojas con movimiento suave;
- ramas con oscilación ligera;
- cambios de luz discretos;
- partículas estacionales cuando proceda;
- animación especial al alcanzar una etapa importante;
- reacción visual al recibir XP o aceitunas.

No debe haber animaciones constantes que dificulten la lectura, el rendimiento o la autonomía del dispositivo.

---

## 5. Evolución del olivo

V1 define 50 niveles y 10 grandes etapas visuales, con aproximadamente cinco niveles por etapa.

1. Brote
2. Plantón
3. Olivo joven
4. Olivo en desarrollo
5. Olivo fuerte
6. Olivo adulto
7. Olivo maduro
8. Olivo centenario
9. Olivo monumental
10. Leyenda de Mágina

Cada nivel puede producir cambios pequeños. Cada transición de etapa produce una transformación claramente perceptible.

Los cambios visuales pueden afectar a:

- altura y volumen;
- grosor del tronco;
- forma del tronco;
- ramas principales;
- densidad y silueta de la copa;
- hojas;
- frutos visibles;
- textura de corteza;
- raíces/suelo;
- iluminación de presentación.

Los niveles máximos no deben convertirse en un crecimiento infinito del árbol. Tras alcanzar Leyenda de Mágina, el XP histórico continúa acumulándose y las nuevas metas se desplazan hacia temporadas, retos, colecciones, cosméticos y prestigio.

### Umbrales de XP

Los umbrales exactos son configuración de producto y Admin. La curva debe cumplir:

- primeras evoluciones relativamente rápidas;
- progresión media sostenida;
- etapas Centenario, Monumental y Leyenda como hitos de largo plazo;
- posibilidad de rebalancear sin migrar código de UI.

La tabla de XP propuesta durante diseño se considera configuración beta inicial, no contrato inmutable.

---

## 6. Historia del olivo

Mi Olivo debe conservar una cronología significativa del usuario.

Ejemplos de hitos:

- fecha de nacimiento del olivo;
- primera ruta verificada;
- primer municipio explorado;
- 50 km / 100 km / hitos acumulativos;
- descubrimientos importantes;
- cambios de etapa;
- retos de temporada;
- colecciones completadas;
- primeras recompensas físicas;
- cosechas especiales.

La pantalla `Historia de mi olivo` funciona como pasaporte de aventura y no debe inventar sucesos ni fechas.

---

## 7. Personalización y coleccionables

Dos usuarios con el mismo nivel no deberían tener necesariamente la misma escena.

### Árbol

- variaciones de copa permitidas por etapa;
- frutos/estado de cosecha;
- efectos cosméticos compatibles con el estilo visual.

### Terreno

- piedras;
- flores;
- hierbas;
- caminos;
- bancos;
- fuentes;
- hitos senderistas;
- elementos de patrimonio simplificados;
- recuerdos de eventos.

### Fondos

- Sierra Mágina;
- Cuadros;
- amanecer;
- atardecer;
- noche;
- primavera;
- otoño;
- fondos de temporada o evento.

### Prestigio

- placas de municipios;
- emblemas de retos;
- marcos de perfil;
- recuerdos de temporadas;
- objetos raros y legendarios.

Los cosméticos no deben otorgar ventajas deportivas injustas.

---

## 8. Rareza

Los objetos pueden utilizar una taxonomía simple:

- común;
- raro;
- épico;
- legendario.

La rareza describe disponibilidad/prestigio, no poder competitivo.

Un objeto puede requerir simultáneamente:

- precio en aceitunas;
- nivel mínimo;
- etapa mínima del olivo;
- logro/reto previo;
- ventana temporal;
- disponibilidad de stock cuando sea físico.

Ejemplo:

```text
Banco del Centenario
Rareza: épica
Requisito: Olivo Centenario
Precio: 2.000 🫒
```

---

## 9. Economía de aceitunas

### Fuentes

Las aceitunas pueden proceder de:

- niveles alcanzados;
- retos completados;
- logros;
- descubrimientos relevantes;
- hitos de colección;
- eventos especiales;
- actividades verificadas cuando una política explícita lo permita.

Las fuentes deben tener una clave idempotente para evitar doble concesión.

### Sumideros

Las aceitunas pueden gastarse en:

- personalización de Mi Olivo;
- fondos y escenas;
- cosméticos del perfil/app;
- coleccionables;
- cupones;
- experiencias;
- merchandising;
- productos locales;
- AOVE y otros premios físicos.

### Control de inflación

La economía no debe fijar permanentemente precios ni recompensas en código.

Admin debe poder modificar:

- importe de recompensa;
- precio;
- stock;
- disponibilidad;
- ventanas temporales;
- requisitos;
- límites por usuario;
- límites por campaña/temporada.

Antes de producción deben medirse al menos:

- aceitunas emitidas por usuario activo;
- aceitunas gastadas;
- saldo medio/mediano;
- concentración de saldo;
- tiempo medio hasta primer canje;
- tasa de canje por categoría;
- recompensas agotadas;
- coste físico estimado de recompensas emitidas.

---

## 10. Catálogo de recompensas

El catálogo se divide visualmente en dos familias principales.

### Digitales

- objetos del olivo;
- terrenos;
- fondos;
- marcos;
- cosméticos de perfil;
- animaciones/efectos permitidos;
- coleccionables.

Los artículos digitales se entregan de forma inmediata y auditable cuando el cargo de aceitunas se confirma.

### Reales

- cupones;
- descuentos;
- degustaciones;
- visitas/experiencias;
- AOVE;
- productos locales;
- merchandising Mágina Aventura;
- colaboraciones futuras.

Los premios físicos usan reserva y validación QR.

---

## 11. Cosechas y AOVE virtual

El aceite no es moneda.

Puede existir un sistema de `Cosechas` como colección histórica y emocional:

- Primera Cosecha;
- Cosecha de una temporada;
- Cosecha de un municipio/evento;
- AOVE Legendario de Mágina;
- Cosecha del Centenario.

Una cosecha puede conceder insignia, objeto visual o aceitunas, pero el AOVE virtual se trata como recuerdo/coleccionable.

---

## 12. Ledger y saldo

El saldo de aceitunas debe ser consecuencia de movimientos auditables.

Tipos conceptuales:

- `grant`: concesión;
- `reserve`: bloqueo para un canje;
- `release`: liberación de una reserva;
- `spend`: gasto definitivo;
- `refund`: devolución compensatoria;
- `admin_adjustment`: corrección excepcional y auditada.

No se debe editar el saldo de un usuario directamente como fuente primaria de verdad.

Cada movimiento debe conservar:

- usuario;
- importe;
- signo/tipo;
- fuente;
- clave idempotente;
- fecha;
- actor cuando proceda;
- referencia a recompensa/reserva/canje cuando proceda.

---

## 13. Flujo de compra digital

```text
usuario selecciona objeto
→ backend valida disponibilidad/requisitos/saldo
→ cargo atómico en ledger
→ entitlement del objeto
→ auditoría
→ UI confirma desbloqueo
```

La operación debe ser idempotente y evitar comprar accidentalmente dos veces un objeto no repetible.

---

## 14. Flujo de premio físico

### Reserva

Al pulsar `Canjear`:

1. validar usuario y recompensa;
2. validar requisitos;
3. comprobar saldo disponible;
4. comprobar stock;
5. crear reserva;
6. bloquear aceitunas;
7. reservar una unidad de stock;
8. generar credencial de canje.

La reserva no debe consumir definitivamente las aceitunas hasta completar la entrega, salvo que la política de producto futura decida otro modelo explícito.

### QR

El QR representa una credencial de canje de un solo uso.

No debe contener PII, saldo ni información sensible en texto plano.

Preferencia de diseño:

- token opaco de alta entropía;
- servidor conserva únicamente la representación necesaria para validarlo de forma segura;
- token ligado a una reserva concreta;
- token revocable;
- expiración configurable.

El móvil del usuario puede mostrar un QR previamente generado sin conexión. El terminal del comercio/almazara requiere conexión en V1 para validar y consumir el canje.

### Escaneo

El escaneo no debe entregar automáticamente el premio.

Flujo recomendado:

```text
ESCANEAR
→ VALIDAR
→ mostrar premio + estado
→ personal confirma ENTREGA
→ CONSUMIR
```

Esto evita que una lectura accidental destruya el derecho de canje.

### Estados

Reserva:

```text
reserved → redeemed
         → cancelled
         → expired
```

Credencial/token:

```text
active → consumed
       → revoked
       → expired
```

Los estados terminales no son reversibles mediante edición normal.

### Entrega

La confirmación final debe producir una operación atómica equivalente a:

```text
validar token
+ validar reserva
+ validar partner autorizado
+ consumir token
+ marcar reserva redeemed
+ confirmar gasto de aceitunas
+ finalizar stock
+ crear registro de redemption
+ auditoría
```

Un QR consumido no puede canjearse una segunda vez.

---

## 15. Cancelación y caducidad

Si una reserva se cancela o expira antes del canje:

- el token queda revocado/expirado;
- el stock reservado vuelve a estar disponible;
- las aceitunas bloqueadas se liberan mediante movimiento compensatorio;
- se conserva la historia de la operación.

Nunca se debe borrar una reserva histórica para simular que no existió.

---

## 16. Almazaras y colaboradores

El sistema debe admitir partners con uno o varios puntos de entrega.

Un operador de partner solo puede validar recompensas que le correspondan según permisos y configuración.

El escáner debe mostrar únicamente la información necesaria para entregar el premio:

- premio;
- variante/SKU cuando aplique;
- estado de la reserva;
- estado del token;
- confirmación de entrega.

No necesita conocer el saldo completo del usuario ni su historial de actividad.

---

## 17. Auditoría

Las operaciones de valor deben producir trazabilidad.

Eventos auditables mínimos:

- concesión de aceitunas;
- reserva creada;
- token emitido/reemitido/revocado;
- escaneo válido/inválido;
- confirmación de entrega;
- canje consumido;
- cancelación;
- expiración;
- liberación/refund;
- ajuste administrativo;
- cambios relevantes de stock/precio.

La auditoría debe poder distinguir usuario, sistema, operador de partner y administrador.

---

## 18. Integración con Plan 07A–07D

El trabajo existente 07A–07D sigue siendo la frontera de Mágina Aventura para producir recompensas a partir de progresión validada:

- 07A proyecta candidatos de concesión de aceitunas;
- 07B proyecta eventos versionados/idempotentes para integración;
- 07C aplica la puerta de validación;
- 07D compone validación, ledger candidate y outbox plan.

El nuevo módulo de economía/redemption consume esas concesiones ya autorizadas. No debe reimplementar la lógica GPS, antifraude o de XP.

---

## 19. Contratos de dominio nuevos

La implementación deberá aislar al menos estos conceptos:

- `OliveWallet` / proyección de saldo;
- `OliveLedgerEntry`;
- `RewardCatalogItem`;
- `RewardEligibility`;
- `RewardReservation`;
- `RedemptionCredential`;
- `RewardRedemption`;
- `Partner` / `RedemptionLocation`;
- `DigitalEntitlement`;
- `OliveTreeStage`;
- `OliveTreeProgressProjection`;
- `OliveTreeCosmetic` / ownership.

Los nombres definitivos pueden adaptarse al estilo del código existente, pero las responsabilidades deben permanecer separadas.

---

## 20. Idempotencia y concurrencia

Casos que deben ser seguros:

- reintentar una concesión;
- pulsar dos veces `Canjear`;
- dos usuarios intentando reservar la última unidad;
- doble escaneo del mismo QR;
- doble confirmación de entrega;
- timeout de red después de una operación que sí se ejecutó;
- tarea de expiración ejecutándose al mismo tiempo que una validación;
- reintento de webhook/evento/outbox.

La persistencia final debe utilizar transacciones/constraints apropiadas; no confiar exclusivamente en controles del cliente.

---

## 21. Experiencia de pantalla Mi Olivo

Estructura base:

### Cabecera

- nombre del olivo/usuario;
- nivel;
- etapa;
- aceitunas disponibles.

### Escena

- árbol;
- entorno personalizado;
- objetos desbloqueados;
- clima/atmósfera visual cuando proceda.

### Progreso

- barra hacia el siguiente nivel/etapa;
- próxima evolución;
- progreso significativo.

### Acciones

- Recompensas;
- Personalizar;
- Historia;
- Logros.

No mostrar demasiados números simultáneamente sobre la escena.

---

## 22. Animación de evolución

En las transiciones importantes:

1. entrar o enfocar Mi Olivo;
2. cámara/encuadre suave;
3. viento/luz controlados;
4. transformación de capas del árbol;
5. revelar nueva etapa;
6. mostrar recompensa/desbloqueo;
7. volver al control normal.

Ejemplo de copy:

```text
Tu historia ha echado raíces

OLIVO CENTENARIO
Nivel 36
+ recompensa desbloqueada
```

La animación debe poder saltarse y respetar preferencias de reducción de movimiento.

---

## 23. Principios de producto

1. Actividad real antes que tareas artificiales.
2. El árbol nunca castiga al usuario por gastar sus aceitunas.
3. Una única moneda interna.
4. Sin pay-to-win.
5. Los cosméticos no alteran validación deportiva ni rankings.
6. Recompensas valiosas requieren autoridad del servidor.
7. Saldo y stock son auditables.
8. La economía es configurable y medible.
9. El comercio ve el mínimo dato necesario.
10. El sistema debe poder crecer a más partners y recompensas sin cambiar el núcleo GPS.

---

## 24. Fuera de alcance V1

- blockchain;
- NFTs;
- intercambio de aceitunas entre usuarios;
- compraventa de aceitunas por dinero;
- cash-out;
- mercado secundario;
- validación física de premios completamente offline;
- deterioro/muerte del olivo por inactividad;
- ventajas deportivas comprables;
- árbol 3D pesado como requisito inicial.

---

## 25. Criterios de aceptación de la primera implementación

El primer vertical slice será satisfactorio cuando pueda demostrarse de extremo a extremo:

1. un usuario con una concesión válida recibe aceitunas una sola vez;
2. el saldo se deriva del ledger;
3. Mi Olivo proyecta etapa/nivel desde XP sin depender del saldo;
4. existe un catálogo con al menos un reward digital y uno físico de prueba;
5. el digital se compra de forma idempotente y queda en ownership;
6. el físico puede reservarse con bloqueo de saldo y stock;
7. se emite un token/QR opaco de un solo uso;
8. un operador autorizado puede validarlo;
9. el escaneo no consume el premio hasta confirmar entrega;
10. la entrega consume el canje exactamente una vez;
11. un segundo intento se rechaza como ya consumido;
12. cancelar/expirar libera saldo y stock correctamente;
13. todas las operaciones anteriores producen auditoría;
14. pruebas cubren concurrencia, replay e idempotencia de los estados de dominio;
15. no se modifica GPS, promo, Admin ni `main` para construir este vertical slice.
