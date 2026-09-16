(() => {
  document.documentElement.style.setProperty('--sequence-image', 'url("assets/cinematic-sequence.webp")');

  const cinematic = document.querySelector('[data-cinematic]');
  const frames = [...document.querySelectorAll('.frame')];
  const heroCopy = document.querySelector('[data-hero-copy]');
  const storyCopy = document.querySelector('[data-story-copy]');
  const topbar = document.querySelector('[data-topbar]');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let raf = 0;

  const clamp = (n, min = 0, max = 1) => Math.min(max, Math.max(min, n));

  function render() {
    raf = 0;
    if (!cinematic || !frames.length) return;
    const rect = cinematic.getBoundingClientRect();
    const scrollable = Math.max(1, cinematic.offsetHeight - window.innerHeight);
    const progress = clamp(-rect.top / scrollable);
    const exact = progress * (frames.length - 1);
    const index = Math.min(frames.length - 1, Math.floor(exact + 0.001));

    frames.forEach((frame, i) => {
      const distance = Math.abs(i - exact);
      const alpha = clamp(1 - distance);
      frame.style.opacity = alpha.toFixed(3);
      if (!reduceMotion) {
        const zoom = 1.08 + progress * .22 + Math.max(0, i - 5) * .012;
        frame.style.transform = `scale(${zoom.toFixed(3)}) translate3d(0,0,0)`;
      }
      frame.classList.toggle('is-active', i === index || alpha > .25);
    });

    const heroFade = clamp(1 - progress / .24);
    heroCopy.style.opacity = heroFade.toFixed(3);
    if (!reduceMotion) heroCopy.style.transform = `translateY(calc(-42% + ${progress * -42}px))`;

    const storyIn = clamp((progress - .23) / .14);
    const storyOut = 1 - clamp((progress - .78) / .14);
    const storyAlpha = storyIn * storyOut;
    storyCopy.style.opacity = storyAlpha.toFixed(3);
    if (!reduceMotion) storyCopy.style.transform = `translateY(${(1 - storyIn) * 24}px)`;

    if (progress < .24) {
      storyCopy.querySelector('.story-kicker').textContent = 'TU PRÓXIMA AVENTURA';
      storyCopy.querySelector('.story-line').textContent = 'está más cerca';
    } else if (progress < .5) {
      storyCopy.querySelector('.story-kicker').textContent = 'RUTAS · MAPAS · DESCUBRIMIENTOS';
      storyCopy.querySelector('.story-line').textContent = 'entra en la experiencia';
    } else if (progress < .76) {
      storyCopy.querySelector('.story-kicker').textContent = 'LA SIERRA EN TUS MANOS';
      storyCopy.querySelector('.story-line').textContent = 'cada paso deja huella';
    } else {
      storyCopy.querySelector('.story-kicker').textContent = 'MÁGINA AVENTURA';
      storyCopy.querySelector('.story-line').textContent = 'empieza aquí';
    }

    topbar?.classList.toggle('is-scrolled', window.scrollY > 16);
  }

  const requestRender = () => {
    if (!raf) raf = requestAnimationFrame(render);
  };

  addEventListener('scroll', requestRender, { passive: true });
  addEventListener('resize', requestRender, { passive: true });
  render();

  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) entry.target.classList.add('is-visible');
    }
  }, { threshold: .16 });
  document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));

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
})();
