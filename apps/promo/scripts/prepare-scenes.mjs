import { copyFile, mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const promoDir = fileURLToPath(new URL('../', import.meta.url));
const scenesDir = path.join(promoDir, 'assets', 'scenes');
const indexPath = path.join(promoDir, 'index.html');

const sceneSources = [
  { id: '01', file: 'Paisaje_de_olivar_24J_01.jpg' },
  { id: '02', file: 'Paisaje_de_olivar_24J_05.jpg' },
  { id: '03', file: 'Castillo_Albanchez_de_M%C3%A1gina_24J_01.jpg' },
  { id: '04', file: 'Sierra_M%C3%A1gina_24J_01.jpg' },
  { id: '05', file: 'Pico_M%C3%A1gina_-_Ja%C3%A9n-.jpg' },
  { id: '06', file: 'V%C3%A9rtice_geod%C3%A9sico_de_pico_M%C3%A1gina.jpg' },
  { id: '07', file: 'Sierra_M%C3%A1gina_24J_01.jpg' },
  { id: '08', file: 'Pico_M%C3%A1gina_-_Ja%C3%A9n-.jpg' },
  { id: '09', file: 'V%C3%A9rtice_geod%C3%A9sico_de_pico_M%C3%A1gina.jpg' },
].map((scene) => ({
  ...scene,
  source: `https://commons.wikimedia.org/wiki/Special:Redirect/file/${scene.file}`,
}));

const runtimeSourceToLocal = new Map([
  ['Paisaje_de_olivar_24J_01.jpg', 'scene-01.webp'],
  ['Paisaje_de_olivar_24J_05.jpg', 'scene-02.webp'],
  ['Castillo_Albanchez_de_M%C3%A1gina_24J_01.jpg', 'scene-03.webp'],
  ['Sierra_M%C3%A1gina_24J_01.jpg', 'scene-04.webp'],
  ['Pico_M%C3%A1gina_-_Ja%C3%A9n-.jpg', 'scene-05.webp'],
  ['V%C3%A9rtice_geod%C3%A9sico_de_pico_M%C3%A1gina.jpg', 'scene-06.webp'],
]);

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: 'inherit' });
    child.once('error', reject);
    child.once('exit', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} exited with code ${code}`));
    });
  });
}

async function fetchSource(url) {
  const response = await fetch(`${url}?width=1920`, {
    redirect: 'follow',
    headers: {
      'User-Agent': 'MaginaAventuraPromo/1.0 (https://github.com/izc05/izc05-magina-aventura)',
    },
  });
  if (!response.ok) throw new Error(`Unable to download ${url}: HTTP ${response.status}`);
  const contentType = response.headers.get('content-type') ?? '';
  if (!contentType.startsWith('image/')) throw new Error(`Unexpected content type for ${url}: ${contentType}`);
  return Buffer.from(await response.arrayBuffer());
}

async function prepareImages() {
  await mkdir(scenesDir, { recursive: true });
  const encodedBySource = new Map();

  for (const scene of sceneSources) {
    const output = path.join(scenesDir, `scene-${scene.id}.webp`);
    const existing = encodedBySource.get(scene.source);
    if (existing) {
      await copyFile(existing, output);
      continue;
    }

    const sourceBuffer = await fetchSource(scene.source);
    const temporary = path.join(scenesDir, `.scene-${scene.id}.source.jpg`);
    await writeFile(temporary, sourceBuffer);
    try {
      await run('ffmpeg', [
        '-hide_banner', '-loglevel', 'error', '-y',
        '-i', temporary,
        '-vf', 'scale=1920:-2:force_original_aspect_ratio=decrease',
        '-c:v', 'libwebp', '-preset', 'photo', '-quality', '82',
        output,
      ]);
    } finally {
      await rm(temporary, { force: true });
    }

    const info = await stat(output);
    if (info.size < 10_000) throw new Error(`Generated scene-${scene.id}.webp is unexpectedly small (${info.size} bytes)`);
    encodedBySource.set(scene.source, output);
  }
}

function localiseFrame(html, scene, number) {
  const framePattern = new RegExp(`<div class="frame(?<active> is-active)?" data-scene-frame="${number}"[^>]*></div>`);
  const match = html.match(framePattern);
  if (!match) throw new Error(`Unable to locate cinematic frame ${number}`);
  let tag = match[0];
  tag = tag.replace(/\sdata-photo-source="[^"]*"/, '');
  tag = tag.replace(/style="[^"]*"/, (style) => style
    .replace(/--scene-image:url\('[^']+'\)/, `--scene-image:url('assets/scenes/scene-${scene.id}.webp')`)
    .replace(/--scene-image-mobile:url\('[^']+'\)/, `--scene-image-mobile:url('assets/scenes/scene-${scene.id}.webp')`));
  tag = tag.replace(` data-scene-frame="${number}"`, ` data-scene-frame="${number}" data-photo-source="${scene.source}"`);
  return html.replace(match[0], tag);
}

function localiseRuntimeSceneImages(html) {
  return html.replace(
    /--scene-image:url\('https:\/\/commons\.wikimedia\.org\/wiki\/Special:Redirect\/file\/([^?']+)\?width=\d+'\)/g,
    (full, file) => {
      const local = runtimeSourceToLocal.get(file);
      if (!local) throw new Error(`No local runtime mapping for ${file}`);
      return `--scene-image:url('assets/scenes/${local}')`;
    },
  );
}

async function prepareIndex() {
  let html = await readFile(indexPath, 'utf8');
  html = html
    .replace('  <link rel="preconnect" href="https://commons.wikimedia.org" />\n', '')
    .replace('  <link rel="preconnect" href="https://upload.wikimedia.org" crossorigin />\n', '');

  sceneSources.forEach((scene, index) => {
    html = localiseFrame(html, scene, index + 1);
  });
  html = localiseRuntimeSceneImages(html);
  html = html.replace(
    'Fotografías de Sierra Mágina adaptadas mediante encuadre, zoom y superposición para esta presentación.',
    'Fotografías de Sierra Mágina servidas desde copias locales WebP optimizadas durante el despliegue; se mantienen encuadre, autoría y licencias de las fuentes originales.',
  );
  await writeFile(indexPath, html);
}

await prepareImages();
await prepareIndex();
console.log('Prepared 9 local Sierra Mágina WebP scenes and localised promo runtime media.');
