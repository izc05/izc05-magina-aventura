# MA-001 · CUADROS / LAS VIÑAS
## Ficha Maestra de Aventura · RC1

**Estado:** CONTENT DESIGN ADVANCED · FIELD VALIDATION PENDING · PUBLICATION BLOCKED  
**Municipio:** Bedmar y Garcíez · Sierra Mágina · Jaén  
**Tipo:** Circular  
**Base oficial:** Sendero Las Viñas  
**Objetivo:** Primera aventura maestra de Mágina Aventura. Debe fijar el estándar para el resto de rutas.

> Este documento NO modifica la Master Spec RC1 ni el plan de integración. Define el contenido y los datos de MA-001.

---

## 1. IDENTIDAD

**Nombre principal:** Cuadros · Las Viñas  
**Nombre de aventura provisional:** *Cuadros: agua, piedra y frontera*  
**Código:** MA-001  
**Tema narrativo:** cómo el agua, la geología, el paisaje cultivado y la historia defensiva han dado forma al valle de Cuadros.

**Promesa al usuario:**
> Recorre el valle de Cuadros mientras descubres de dónde nace su agua, lees la montaña en sus rocas, alcanzas un antiguo torreón de vigilancia y terminas junto al santuario y la Cueva del Agua.

---

## 2. DATOS DE RUTA

### Fuente oficial
- Circular.
- 8,720 km.
- 3 horas estimadas.
- Dificultad media.
- Inicio: Área Recreativa de Cuadros.
- El sendero figura actualmente como **cerrado temporalmente / fuera de servicio temporalmente** en la Ventana del Visitante de la Junta de Andalucía.

### Track comunitario de control aportado
- Rol: CONTROL_ONLY.
- Origen: descarga del usuario desde Wikiloc.
- Geometría KML original: 776 puntos.
- Distancia calculada: ~8,987 km.
- Altitud mínima: ~567,5 m.
- Altitud máxima: ~916,9 m.
- Inicio del track: 37.787831, -3.408336.
- Tiempo registrado en TCX: 2 h 56 min 48 s.
- No sustituye al track oficial.

### Jerarquía
1. OFFICIAL_TRACK = canónico cuando se importe y contraste.
2. CONTROL_TRACK = KML de 776 puntos aportado.
3. FIELD_TRACK = grabación propia durante validación física.

---

## 3. ESTRUCTURA DE EXPERIENCIA

La aventura se divide narrativamente en cinco actos:

### ACTO I · EL AGUA
Área Recreativa → Río Cuadros → Los Sistillos.

### ACTO II · LA SUBIDA
Cruce → pinar → ascenso → punto alto.

### ACTO III · EL PAISAJE Y LA PIEDRA
Cornicabra / cultivos → panorámica → formaciones geológicas → Fresneda.

### ACTO IV · LA FRONTERA
Descenso → Torreón de Cuadros → interpretación histórica.

### ACTO V · MEMORIA Y REGRESO
Santuario → Cueva del Agua → molino / entorno bajo → regreso.

---

## 4. CHECKPOINTS CANÓNICOS CANDIDATOS

No se congelarán coordenadas ni radios definitivos hasta cruzar:
OFFICIAL_TRACK + CONTROL_TRACK + FIELD_VALIDATION.

### CP00 · El Umbral de Cuadros
**Función:** inicio / briefing / seguridad.  
**Localización control:** km 0,000 aprox.  
**Altitud control:** ~571 m.  
**Contenido:** presentación del valle y misión.  
**Validar:** acceso, cierre, aparcamiento, panel, cobertura, GPS, estado del firme.

### CP01 · La Primera Decisión
**Función:** navegación.  
**Waypoint control:** “cruce senderos”.  
**Km control:** ~1,315.  
**Altitud:** ~608 m.  
**Contenido:** aprender a leer el recorrido y confirmar el camino correcto.  
**Validar:** señalización real, ramales, visibilidad, seguridad, posible activación desde camino equivocado.

### CP02 · Los Sistillos · Donde nace el agua
**Función:** descubrimiento natural.  
**Km exacto:** pendiente.  
**Contenido:** nacimiento del agua / funcionamiento kárstico explicado de forma sencilla.  
**Validar:** qué surgencia es observable desde el sendero, acceso y comportamiento estacional.

### CP03 · La Subida
**Función:** transición de aventura.  
**Ubicación:** inicio de la subida fuerte tras la zona de río / pinar.  
**Km exacto:** pendiente.  
**Contenido:** “Hasta aquí has seguido el agua. Ahora toca ganar altura.”  
**Validar:** punto inequívoco y seguro.

### CP04 · Sobre el Valle
**Función:** recompensa panorámica.  
**Punto alto del control:** km ~3,120.  
**Altitud control máxima:** ~916,9 m.  
**Contenido:** lectura del paisaje de Sierra Mágina.  
**Validar:** mejor mirador real, no necesariamente el punto geométricamente más alto.

### CP05 · Paisaje Cultivado
**Waypoint control:** “olivar”.  
**Km control:** ~3,106.  
**Altitud:** ~916,5 m.  
**Función:** paisaje natural + actividad humana.  
**Contenido:** monte mediterráneo, cultivos y transformación del paisaje.  
**Nota:** cualquier relato específico sobre antiguas viñas / filoxera necesita fuente histórica antes de publicarse.

### CP06 · La Memoria de la Piedra
**Función:** geología.  
**Ubicación:** tramo descendente entre zona alta y Fresneda.  
**Km exacto:** pendiente de elegir el mejor punto observable.  
**Contenido:** garganta y rocas carbonatadas jurásicas/cretácicas; leer estratos y relieve.  
**Regla:** el fenómeno explicado debe ser visible desde un punto seguro del itinerario.

### CP07 · Fuente de la Fresneda
**Waypoint control:** “pilar fresnedilla”.  
**Km control:** ~4,570.  
**Altitud:** ~796,5 m.  
**Función:** agua + caminos tradicionales.  
**Estado de potabilidad:** UNKNOWN hasta señal / comprobación actual.  
**Validar:** nombre local exacto, caudal, cartel, accesibilidad, potabilidad indicada.

### CP08 · El Vigía de Cuadros
**Waypoint control:** “torreon”.  
**Km control:** ~6,804.  
**Altitud control:** ~685 m.  
**Función:** gran checkpoint patrimonial.  
**Contenido:** torre de vigilancia, frontera y vistas del valle.  
**Validar:** ramal, bordes, protección, acceso, estado, punto seguro de activación.

### CP09 · El Santuario
**Función:** patrimonio social y religioso.  
**Posición cartográfica publicada:** entorno 37.79015, -3.40899.  
**Proyección sobre track control:** entorno del último km; verificar físicamente.  
**Contenido:** devoción documentada desde al menos el siglo XVI; santuario levantado en 1615 según fuentes locales.  
**Regla:** el checkpoint debe completarse desde espacio público exterior; nunca exigir entrar o interferir con actos religiosos.

### CP10 · La Cueva del Agua
**Waypoint control:** “cueva del agua”.  
**Km control:** ~8,263.  
**Altitud:** ~573 m.  
**Función:** cierre natural de la aventura.  
**Contenido:** erosión, agua y cavidades.  
**Regla de seguridad:** entrar en la cueva o caminar por el río NO será necesario para completar MA-001.

### FINAL · Regreso a Cuadros
**Distancia control:** ~8,987 km.  
**Función:** cierre, XP, resumen de descubrimientos y recompensa.

---

## 5. POI / DESCUBRIMIENTOS SECUNDARIOS

No todos serán paradas obligatorias.

- Área Recreativa de Cuadros.
- Adelfal / vegetación de ribera.
- Río Cuadros.
- Los Sistillos.
- Cornicabra.
- Pinar de pino carrasco.
- Panorámica de Sierra Mágina.
- Olivar / paisaje cultivado.
- Formaciones geológicas del valle.
- Fuente / Pilar de la Fresneda.
- GR-7 / caminos tradicionales si se confirma sobre el recorrido.
- Torreón de Cuadros.
- Santuario de Nuestra Señora de Cuadros.
- Molino medieval / Casa Molino.
- Cueva del Agua.
- “Túnel” del track comunitario: POI candidato, naturaleza exacta pendiente de inspección.

---

## 6. MICROHISTORIAS PROPUESTAS

### Agua
**Título:** “La montaña también bebe”  
Idea: explicar que parte del agua de lluvia se infiltra en las rocas y reaparece en manantiales.

### Cornicabra
**Título:** “El otoño cambia de color”  
Idea: identificar la cornicabra y su cambio cromático; nunca exigir recolectar o tocar vegetación.

### Geología
**Título:** “Páginas de piedra”  
Idea: los estratos y la garganta permiten explicar millones de años de historia geológica sin convertir la aventura en una clase académica.

### Torreón
**Título:** “El vigía del paso”  
Base histórica: el lugar de Cuadros aparece en documentación medieval; la torre existente se relaciona con la vigilancia y defensa del paso por la sierra.  
No dramatizar batallas concretas sin fuente.

### Santuario
**Título:** “Cinco siglos de devoción”  
Base: las Relaciones de Felipe II de 1575 ya mencionan la devoción a la Virgen de Cuadros; fuentes locales sitúan la construcción del santuario en 1615.

### Cueva del Agua
**Título:** “Cuando el río esculpe la roca”  
Idea: explicar cómo el agua modifica la roca y crea formas y cavidades.

---

## 7. IMÁGENES NECESARIAS

### Producción mínima para RC1
1. **COVER** · panorámica potente de Cuadros / Torreón / valle.
2. **START** · Área Recreativa + panel oficial.
3. **NATURE** · río / adelfal.
4. **WATER** · Los Sistillos.
5. **TRAIL** · tramo representativo de ascenso/pinar.
6. **VIEWPOINT** · panorámica de la zona alta.
7. **BOTANY** · cornicabra claramente identificable.
8. **GEOLOGY** · formación rocosa/estratos observables.
9. **WATER** · Fuente/Pilar de la Fresneda.
10. **HERITAGE** · Torreón exterior + panorama.
11. **HERITAGE** · Santuario exterior.
12. **NATURE** · Cueva del Agua desde punto seguro.
13. **HERITAGE** · molino si se confirma y es visible.
14. **NAVIGATION** · cruces/señales que puedan causar dudas.

### Procedencia preferida
1. fotografías propias durante validación;
2. fotografías aportadas por usuarios con permiso;
3. material institucional con licencia/permiso compatible;
4. otras imágenes sólo como referencia editorial hasta aclarar derechos.

**Importante:** las capturas de la app aportadas hasta ahora sirven como referencia UX, no como banco de fotografías de MA-001.

---

## 8. JUEGO / PROGRESIÓN PILOTO

Valores aún de diseño, no congelados:

- Completar MA-001 → XP principal.
- Checkpoints → XP moderado.
- Descubrimientos secundarios → XP pequeño.
- Primera aventura en Bedmar → insignia.
- Completar todos los descubrimientos → insignia de colección.
- Aportación útil validada → reputación de colaborador.

No se premiará velocidad.

### Insignia piloto
**“Guardián de Cuadros”**  
Condición candidata: completar MA-001 + descubrir todos los puntos patrimoniales/naturales principales.

---

## 9. INCENTIVO LOCAL PILOTO

No asociar todavía a un negocio concreto sin acuerdo.

### Ejemplo
**Recompensa “He completado Cuadros”**
- Condición: aventura completada correctamente.
- Beneficio orientativo: 10–15 % de descuento o producto/consumición definida por comercio colaborador.
- Zona: Bedmar.
- Canje: código/QR único o verificación desde app.
- Caducidad: configurable.
- Fraude: una recompensa por usuario/campaña según condiciones.

Objetivo: que terminar una aventura también pueda conducir al usuario hacia los comercios del municipio.

---

## 10. EXPERIENCIA DEL USUARIO

### Antes de empezar
Portada → mapa 2D/3D → distancia → desnivel → dificultad → tiempo → estado de acceso → seguridad → “Iniciar aventura”.

### Navegando
Mapa + posición + track + siguiente CP + distancia + dirección + alerta relevante.

### Al entrar en checkpoint
Foto / visual → título → microhistoria → elemento a observar → descubrimiento desbloqueado → XP → continuar.

### Al terminar
Resumen:
- distancia;
- tiempo;
- desnivel;
- checkpoints;
- descubrimientos;
- XP;
- insignias;
- posición/ranking si corresponde;
- fotografías;
- recompensa disponible;
- opción de aportar incidencia/foto.

---

## 11. 3D

MA-001 deberá quedar preparada para:
- terreno 3D;
- track sobre relieve;
- POI elevados sobre terreno;
- perfil de elevación sincronizado;
- cursor mapa ↔ perfil;
- replay del recorrido;
- vista previa del itinerario.

Requisito previo: geometría limpia y altitud consistente. El 3D no sustituye a la calidad de los datos.

---

## 12. DATOS COMUNITARIOS

Con consentimiento:
- track GPS;
- fotos;
- incidencias;
- estado de señalización;
- obstáculos;
- cambios visibles;
- fuentes;
- observaciones.

Se almacenan como datos comunitarios y no alteran automáticamente la ruta canónica.

---

## 13. SEGURIDAD

### Gate actual
**PUBLICATION_BLOCKED**

Motivo:
- La ficha oficial de Las Viñas figura como “CERRADO TEMPORALMENTE / FUERA DE SERVICIO TEMPORALMENTE”.

### Para pasar a READY_FOR_RC1
- reapertura oficial;
- acceso comprobado;
- track completo recorrido;
- checkpoints comprobados;
- riesgos documentados;
- señalización revisada;
- fuentes revisadas;
- fotografías propias;
- cobertura GPS/móvil comprobada;
- discrepancias track oficial/control/campo resueltas.

---

## 14. CHECKLIST DE VALIDACIÓN FÍSICA

Por checkpoint:
- fecha y hora;
- lat/lon;
- precisión GPS;
- altitud;
- foto aproximación;
- foto principal;
- foto salida;
- foto señal;
- estado del firme;
- riesgo caída;
- riesgo agua;
- riesgo tráfico;
- cobertura;
- elemento observable;
- radio candidato;
- ¿se activa desde otro camino?;
- discrepancias;
- resultado PASS / REVIEW / FAIL.

En ruta completa:
- grabar track GPS;
- medir duración;
- registrar pausas;
- comprobar cruces;
- comprobar track offline;
- documentar cierre/obras;
- confirmar nombres locales;
- confirmar agua y señalización.

---

## 15. FUENTES PRIORITARIAS

- Junta de Andalucía · Ventana del Visitante · Sendero Las Viñas.
- Jaén Paraíso Interior · Sendero Las Viñas.
- Junta de Andalucía · Torreón de Cuadros.
- Ayuntamiento de Bedmar y Garcíez · patrimonio/fiestas.
- Tracks comunitarios: sólo CONTROL.
- Inspección propia: FIELD.

---

## 16. ESTADO PARA EL PROYECTO

**Identidad:** definida.  
**Tema narrativo:** definido.  
**Track control:** disponible.  
**Track oficial:** fuente canónica localizada / debe incorporarse y contrastarse.  
**Checkpoints:** candidatos avanzados.  
**POI:** inventario avanzado.  
**Narrativa:** primera versión lista.  
**Imágenes:** shot list lista; producción definitiva pendiente.  
**Incentivo local:** modelo piloto definido; partner pendiente.  
**3D:** datos requeridos definidos.  
**Campo:** pendiente.  
**Publicación:** bloqueada hasta reapertura + validación.

---

# PRINCIPIO MA-001

> **No será una ruta con textos pegados encima.**
>
> **Será una aventura en la que el paisaje va explicándose mientras el usuario lo recorre.**
