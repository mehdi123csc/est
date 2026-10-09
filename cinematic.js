/* Cinematic scroll effects only; store.js remains responsible for store behavior. */
(() => {
  'use strict';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const header = document.querySelector('.cinematic-header');
  const hero = document.querySelector('.cinematic-hero');
  const layers = [...document.querySelectorAll('.cinematic-layer')];
  const reveals = document.querySelectorAll('.cinematic-reveal, [data-reveal]');
  const categories = document.querySelectorAll('.cinematic-category');

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, {threshold: 0.14, rootMargin: '0px 0px -4% 0px'});
    reveals.forEach(el => observer.observe(el));
  } else {
    reveals.forEach(el => el.classList.add('is-visible'));
  }

  if (reduceMotion) return;

  let queued = false;
  function update() {
    queued = false;
    const y = window.scrollY || 0;
    if (header) header.classList.toggle('is-scrolled', y > 24);

    if (hero) {
      const rect = hero.getBoundingClientRect();
      const progress = Math.max(0, Math.min(1, -rect.top / Math.max(1, rect.height)));
      const image = hero.querySelector('.heroImage');
      if (image) image.style.transform = `scale(${1.08 + progress * 0.07}) translate3d(0,${progress * 12}px,0)`;
    }

    layers.forEach(layer => {
      if (hero && hero.contains(layer)) return;
      const rect = layer.getBoundingClientRect();
      if (rect.bottom < -100 || rect.top > innerHeight + 100) return;
      const distance = (rect.top + rect.height / 2 - innerHeight / 2) / innerHeight;
      const shift = Math.max(-16, Math.min(16, distance * -16));
      layer.style.transform = `translate3d(0,${shift}px,0) scale(1.06)`;
    });
  }
  function schedule() {
    if (!queued) {
      queued = true;
      requestAnimationFrame(update);
    }
  }
  addEventListener('scroll', schedule, {passive:true});
  addEventListener('resize', schedule, {passive:true});
  update();

  categories.forEach(button => {
    button.addEventListener('pointermove', event => {
      if (innerWidth < 761) return;
      const rect = button.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      const image = button.querySelector('.category-photo');
      if (image) image.style.transform = `scale(1.09) rotateX(${y * -2.4}deg) rotateY(${x * 2.4}deg) translate3d(${x * -8}px,${y * -8}px,0)`;
    });
    button.addEventListener('pointerleave', () => {
      const image = button.querySelector('.category-photo');
      if (image) image.style.transform = '';
    });
  });
})();
