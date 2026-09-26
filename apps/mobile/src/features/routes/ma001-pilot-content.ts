export type Ma001CheckpointContent = Readonly<{
  id: string;
  title: string;
  objective: string;
  body: string;
  interaction: string;
  safety: string;
  xp: number;
  fieldStatus: 'pending';
}>;

export const ma001Chapters = [
  { id: 'ma001-ch-agua', title: 'El agua', start: 'CP00', end: 'CP02' },
  { id: 'ma001-ch-subida', title: 'La subida', start: 'CP03', end: 'CP04' },
  { id: 'ma001-ch-paisaje-piedra', title: 'El paisaje y la piedra', start: 'CP05', end: 'CP07' },
  { id: 'ma001-ch-frontera', title: 'La frontera', start: 'CP08', end: 'CP08' },
  { id: 'ma001-ch-memoria-regreso', title: 'Memoria y regreso', start: 'CP09', end: 'FINAL' },
] as const;

export const ma001CheckpointContent: Ma001CheckpointContent[] = [
  {
    id: 'CP00', title: 'El Umbral de Cuadros',
    objective: 'Presentar el valle y sus cuatro hilos: agua, montaña, paisaje humano e historia.',
    body: 'Estás entrando en uno de los parajes más singulares de Bedmar. Seguirás el río, ganarás altura y regresarás a Cuadros.',
    interaction: 'Comenzar aventura', safety: 'No salirse del sendero ni tocar o recolectar vegetación.', xp: 0, fieldStatus: 'pending',
  },
  {
    id: 'CP01', title: 'La Primera Decisión',
    objective: 'Confirmar que la persona lee el terreno y la señalización física.',
    body: 'Varios caminos pueden parecer posibles. Sigue Las Viñas y confirma la señalización antes de continuar.',
    interaction: 'Confirmación discreta de itinerario correcto', safety: 'Detenerse sólo en un punto seguro.', xp: 20, fieldStatus: 'pending',
  },
  {
    id: 'CP02', title: 'Los Sistillos · Donde aparece el agua',
    objective: 'Convertir un nacimiento de agua en una lección de paisaje.',
    body: 'La montaña almacena, conduce y devuelve el agua al paisaje. El punto físico exacto se decidirá en campo.',
    interaction: 'Ordenar: lluvia → roca → circulación subterránea → nacimiento', safety: 'No afirmar potabilidad ni acercarse al cauce.', xp: 100, fieldStatus: 'pending',
  },
  {
    id: 'CP03', title: 'La Subida',
    objective: 'Cambiar el ritmo narrativo de río a montaña.',
    body: 'Hasta aquí el agua ha marcado el camino. Ahora el sendero gana altura y cambia el paisaje.',
    interaction: 'Desbloqueo caminando, sin parada obligatoria', safety: 'No obligar a detenerse en una pendiente.', xp: 20, fieldStatus: 'pending',
  },
  {
    id: 'CP04', title: 'Sobre el Valle',
    objective: 'Dar una recompensa después del ascenso y enseñar a leer el paisaje.',
    body: 'Desde las zonas altas aparecen laderas, cultivos, barrancos y montañas de Sierra Mágina.',
    interaction: 'Hotspots panorámicos: valle, cultivos y sierra', safety: 'Validar espacio seguro para detenerse y horizonte visible.', xp: 100, fieldStatus: 'pending',
  },
  {
    id: 'CP05', title: 'El Paisaje que Cambia',
    objective: 'Mostrar que Mágina también es un territorio trabajado durante generaciones.',
    body: 'La vegetación natural convive con el olivar, una de las grandes señas visuales y económicas de la comarca.',
    interaction: 'Observar el cambio de paisaje', safety: 'No publicar historias agrícolas específicas sin fuente adicional.', xp: 40, fieldStatus: 'pending',
  },
  {
    id: 'CP06', title: 'Páginas de Piedra',
    objective: 'Explicar geología sin exigir conocimientos previos.',
    body: 'El río Cuadros ha excavado una garganta sobre rocas carbonatadas del Jurásico y del Cretácico.',
    interaction: 'Señalar dónde se distinguen mejor las capas de roca', safety: 'No recoger roca ni acercarse a paredes o bordes.', xp: 120, fieldStatus: 'pending',
  },
  {
    id: 'CP07', title: 'Fresneda · El agua no siempre se bebe',
    objective: 'Introducir una regla práctica de seguridad.',
    body: 'Que una fuente tenga agua no significa automáticamente que sea potable. Lleva tu propia reserva.',
    interaction: 'Elegir la opción segura: llevar agua propia y seguir la señalización', safety: 'No declarar potabilidad sin señalización oficial.', xp: 60, fieldStatus: 'pending',
  },
  {
    id: 'CP08', title: 'El Vigía de Cuadros',
    objective: 'Relacionar el paisaje con la historia fronteriza de Bedmar.',
    body: 'El Torreón necesitaba ver y ser visto: controlar pasos y comunicar peligro.',
    interaction: 'Elegir la función principal: control del paso', safety: 'Validar ramal, protecciones y punto de lectura seguro.', xp: 150, fieldStatus: 'pending',
  },
  {
    id: 'CP09', title: 'Cinco siglos de devoción',
    objective: 'Pasar del patrimonio defensivo al patrimonio humano y comunitario.',
    body: 'Las fuentes sitúan la devoción a la Virgen de Cuadros en 1575 y el santuario actual en 1615.',
    interaction: 'Línea temporal: 1575 → 1615 → hoy', safety: 'Completar desde espacio exterior público sin interferir con celebraciones.', xp: 100, fieldStatus: 'pending',
  },
  {
    id: 'CP10', title: 'La Cueva del Agua',
    objective: 'Cerrar el arco narrativo regresando al agua.',
    body: 'El agua, el tiempo y la roca modelan gargantas, huecos y formas del valle de Cuadros.',
    interaction: 'Deslizar: agua + tiempo + roca → paisaje', safety: 'No entrar en cavidades ni caminar por el agua.', xp: 120, fieldStatus: 'pending',
  },
  {
    id: 'FINAL', title: 'Has leído el valle',
    objective: 'Cerrar la aventura y resumir lo aprendido.',
    body: 'Has completado MA-001: agua, piedra, paisaje humano, frontera y memoria de Cuadros.',
    interaction: 'Mostrar resumen, checkpoints, descubrimientos y aportaciones', safety: 'La recompensa queda pendiente de validación oficial.', xp: 250, fieldStatus: 'pending',
  },
];

export function getMa001CheckpointContent(id: string): Ma001CheckpointContent | null {
  return ma001CheckpointContent.find((checkpoint) => checkpoint.id === id) ?? null;
}
