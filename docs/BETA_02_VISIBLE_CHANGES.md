# Aventura Mágina Android Beta 02

## Diferencias visibles respecto a Beta 01

Beta 02 mantiene el arranque, recovery, diagnóstico, navegación y lenguaje visual de Beta 01, pero hace más utilizable el recorrido desde la apertura de la aplicación hasta el inicio de una aventura.

En Home/Explorar, el inventario de rutas se consume como una colección y no como una única ruta destacada. La búsqueda filtra por título, municipio y descripción, y los filtros de dificultad (`Todos`, `Fácil`, `Moderada` y `Difícil`) son interactivos. Cada ruta disponible conserva la tarjeta visual existente y conduce a su ficha mediante el mismo flujo de Expo Router.

La ficha de ruta conserva la ilustración de paisaje existente y añade una identificación visible de la imagen de ruta, un resumen de exploración con checkpoints, discoveries y avisos de seguridad, un bloque de meteorología preparado para una futura fuente de datos y un itinerario visible de checkpoints/discoveries. Los markers de discoveries solo se dibujan cuando existen coordenadas en la definición versionada de la aventura; no se inventan posiciones a partir de hints incompletos.

La pantalla `Preparar aventura` conserva el control real de permisos y el arranque offline-first, y añade el alcance de progresión antes de pulsar el botón: número de objetivos y desglose de checkpoints y discoveries cuando la definición versionada está disponible.

Durante la aventura, el mapa sigue siendo el elemento protagonista. Además del track oficial, el track del usuario y su posición GPS, Beta 02 muestra checkpoints y discoveries con estados visuales: dorado/azul cuando están pendientes y oliva cuando el motor ya los ha desbloqueado. La fuente de coordenadas es la definición de aventura y el estado desbloqueado procede del estado persistido del Adventure Engine; el motor no fue modificado.

## Límites deliberados

La auditoría de Beta 01 confirmó que el inventario de producción continúa cerrado cuando no hay contenido editorial verificado. Beta 02 no convierte datos sintéticos en rutas reales ni inventa fotografías, meteorología, geometría o posiciones. En la APK QA, el contenido sintético existente mantiene su identificación `TEST DATA`; en producción, la aplicación conserva el estado seguro de “sin rutas verificadas”.

La recuperación de aventura y la pantalla de diagnóstico permanecen intactas. No se modificaron los workflows de GitHub, no se añadió una arquitectura paralela y no se fusionó ningún PR.
