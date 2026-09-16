import { clamp, sceneState, layerTransform } from './cinematic.js';

const cinematic = document.querySelector('[data-cinematic]');
const scenes = [...document.querySelectorAll('[data-cinematic-scene]')];
const progressBar = document.querySelector('[data-progress-bar]');
const topbar = document.querySelector('[data-topbar]');
const compactViewport = window.matchMedia('(max-width: 900px)');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let raf = 0;

function renderCinematic() {
  if (!cinematic || !scenes.length) return;

  const rect = cinematic.getBoundingClientRect();
  const scrollable = Math.max(1, cinematic.offsetHeight - window.innerHeight);
  const progress = clamp(-rect.top / scrollable);

  scenes.forEach((scene, index) => {
    const state = sceneState(progress, index, scenes.length);
    const isFinale = index === scenes.length - 1;

    scene.style.opacity = state.visibility.toFixed(3);
    scene.classList.toggle('is-active', state.active);
    scene.style.pointerEvents = state.active ? 'auto' : 'none';

    scene.querySelectorAll('[data-scene-layer]').forEach((layer) => {
      if (reduceMotion.matches) {
        layer.style.removeProperty('--layer-x');
        layer.style.removeProperty('--layer-y');
        layer.style.removeProperty('--layer-scale');
        return;
      }

      const transform = layerTransform(state.local, layer.dataset.depth, compactViewport.matches);
      layer.style.setProperty('--layer-x', `${transform.translateX.toFixed(2)}px`);
      layer.style.setProperty('--layer-y', `${transform.translateY.toFixed(2)}px`);
      layer.style.setProperty('--layer-scale', transform.scale.toFixed(4));
    });

    const copy = scene.querySelector('[data-scene-copy]');
    if (copy) {
      if (reduceMotion.matches) {
        copy.style.opacity = state.active ? '1' : '0';
        copy.style.removeProperty('transform');
      } else {
        const enter = clamp(state.local / 0.18);
        const exit = isFinale ? 1 : 1 - clamp((state.local - 0.78) / 0.18);
        const copyAlpha = state.active ? Math.min(enter, exit) : state.visibility * 0.18;
        const y = (1 - enter) * 24 - (1 - exit) * 18;
        copy.style.opacity = copyAlpha.toFixed(3);
        copy.style.transform = `translate3d(0, ${y.toFixed(2)}px, 0)`;
      }
    }

    const product = scene.querySelector('[data-scene-product]');
    if (product) {
      const productProgress = clamp((state.local - 0.16) / 0.56);
      product.style.setProperty('--product-progress', productProgress.toFixed(3));
      product.style.opacity = (reduceMotion.matches ? (state.active ? 1 : 0) : productProgress).toFixed(3);
    }
  });

  if (progressBar) {
    progressBar.style.transform = `scaleY(${Math.max(0.03, progress).toFixed(3)})`;
  }
}

function render() {
  raf = 0;
  renderCinematic();
  topbar?.classList.toggle('is-scrolled', window.scrollY > 16);
}

const requestRender = () => {
  if (!raf) raf = requestAnimationFrame(render);
};

addEventListener('scroll', requestRender, { passive: true });
addEventListener('resize', requestRender, { passive: true });
compactViewport.addEventListener?.('change', requestRender);
reduceMotion.addEventListener?.('change', requestRender);
render();

if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) entry.target.classList.add('is-visible');
    }
  }, { threshold: 0.16 });

  document.querySelectorAll('.reveal').forEach((element) => observer.observe(element));
} else {
  document.querySelectorAll('.reveal').forEach((element) => element.classList.add('is-visible'));
}

document.querySelectorAll('[data-apk-link]').forEach((link) => {
  link.addEventListener('click', (event) => {
    const href = link.getAttribute('href');
    if (!href || href === '#') {
      event.preventDefault();
      link.textContent = 'APK próximamente';
      link.setAttribute('aria-disabled', 'true');
    }
  });
});
