(() => {
  document.documentElement.style.setProperty('--sequence-image', 'url("assets/cinematic-sequence.webp")');

  const cinematic = document.querySelector('[data-cinematic]');
  const frames = [...document.querySelectorAll('.frame')];
  const heroCopy = document.querySelector('[data-hero-copy]');
  const storySteps = [...document.querySelectorAll('[data-story-step]')];
  const topbar = document.querySelector('[data-topbar]');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const compactViewport = window.matchMedia('(max-width: 900px)');
  let raf = 0;

  const clamp = (n, min = 0, max = 1) => Math.min(max, Math.max(min, n));

  function render() {
    raf = 0;
    if (!cinematic || !frames.length) return;

    const rect = cinematic.getBoundingClientRect();
    const scrollable = Math.max(1, cinematic.offsetHeight - window.innerHeight);
    const progress = clamp(-rect.top / scrollable);
    const exactFrame = progress * (frames.length - 1);
    const frameIndex = Math.min(frames.length - 1, Math.floor(exactFrame + 0.001));

    frames.forEach((frame, index) => {
      const distance = Math.abs(index - exactFrame);
      const alpha = clamp(1 - distance);
      frame.style.opacity = alpha.toFixed(3);

      if (!reduceMotion) {
        const zoom = 1.08 + progress * 0.22 + Math.max(0, index - 5) * 0.012;
        frame.style.transform = `scale(${zoom.toFixed(3)}) translate3d(0,0,0)`;
      }

      frame.classList.toggle('is-active', index === frameIndex || alpha > 0.25);
    });

    const heroFade = clamp(1 - progress / 0.22);
    heroCopy.style.opacity = heroFade.toFixed(3);
    heroCopy.style.pointerEvents = heroFade > 0.15 ? 'auto' : 'none';

    if (!reduceMotion) {
      heroCopy.style.transform = compactViewport.matches
        ? `translate3d(0, ${Math.round(progress * -22)}px, 0)`
        : `translateY(calc(-42% + ${progress * -42}px))`;
    }

    if (storySteps.length) {
      const storyStart = 0.25;
      const storyEnd = 0.92;
      const storyProgress = clamp((progress - storyStart) / (storyEnd - storyStart));
      const exactStory = storyProgress * (storySteps.length - 1);
      const entering = clamp((progress - 0.21) / 0.07);
      const leaving = 1 - clamp((progress - 0.93) / 0.05);
      const sequenceAlpha = entering * leaving;

      storySteps.forEach((step, index) => {
        const distance = Math.abs(index - exactStory);
        const alpha = clamp(1 - distance * 1.35) * sequenceAlpha;
        step.style.opacity = alpha.toFixed(3);
        step.style.pointerEvents = alpha > 0.55 ? 'auto' : 'none';
        step.classList.toggle('is-current', alpha > 0.55);

        if (!reduceMotion) {
          const offset = (index - exactStory) * 28;
          const scale = 0.985 + alpha * 0.015;
          step.style.transform = `translate3d(0, ${offset}px, 0) scale(${scale.toFixed(3)})`;
        }
      });
    }

    topbar?.classList.toggle('is-scrolled', window.scrollY > 16);
  }

  const requestRender = () => {
    if (!raf) raf = requestAnimationFrame(render);
  };

  addEventListener('scroll', requestRender, { passive: true });
  addEventListener('resize', requestRender, { passive: true });
  compactViewport.addEventListener?.('change', requestRender);
  render();

  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) entry.target.classList.add('is-visible');
    }
  }, { threshold: 0.16 });

  document.querySelectorAll('.reveal').forEach((element) => observer.observe(element));

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
