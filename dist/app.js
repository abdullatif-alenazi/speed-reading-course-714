const slides = [...document.querySelectorAll('.slide')];
if (window.location.search) history.replaceState(null, '', `${window.location.pathname}${window.location.hash}`);
const links = [...document.querySelectorAll('.sidebar nav a')];
const counter = document.querySelector('#slide-counter');
const deck = document.querySelector('main');
let slideIndex = 0;
let locked = false;
let lockTimer = null;
let scrollFrame = null;
let activeSlide = null;
let isProgrammaticNavigation = false;

const revealSlide = (slide, initialDelay = 0) => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const targets = [...slide.querySelectorAll('.slide-content > *')];
  targets.forEach((target, index) => {
    target.getAnimations().forEach(animation => animation.cancel());
    target.style.opacity = '0';
    target.style.transform = 'translateY(28px) scale(.985)';
    target.style.filter = 'blur(9px)';
    target.animate([
      { opacity: 0, transform: 'translateY(28px) scale(.985)', filter: 'blur(9px)' },
      { opacity: 1, transform: 'translateY(0) scale(1)', filter: 'blur(0)' },
    ], {
      duration: 780,
      delay: initialDelay + index * 115,
      easing: 'cubic-bezier(.22, 1, .36, 1)',
      fill: 'forwards',
    });
  });
};

const selectSlide = (slide, revealDelay = 0) => {
  const index = slides.indexOf(slide);
  if (index < 0) return;
  slideIndex = index;
  links.forEach(link => {
    const active = link.getAttribute('href') === `#${slide.id}`;
    link.classList.toggle('active', active);
    active ? link.setAttribute('aria-current', 'location') : link.removeAttribute('aria-current');
  });
  if (counter) counter.textContent = `الشريحة ${index + 1} من ${slides.length}`;
  slides.forEach(item => item.classList.toggle('is-active', item === slide));
  if (activeSlide !== slide) {
    if (activeSlide) activeSlide.querySelectorAll('.slide-content > *').forEach(target => {
      target.getAnimations().forEach(animation => animation.cancel());
      target.style.removeProperty('opacity');
      target.style.removeProperty('transform');
      target.style.removeProperty('filter');
    });
    activeSlide = slide;
    revealSlide(slide, revealDelay);
  }
};

const observer = new IntersectionObserver(entries => {
  if (isProgrammaticNavigation) return;
  entries.filter(entry => entry.isIntersecting)
    .sort((a, b) => b.intersectionRatio - a.intersectionRatio)
    .slice(0, 1)
    .forEach(entry => selectSlide(entry.target));
}, { root: deck, threshold: [.45, .65] });
slides.forEach(slide => observer.observe(slide));

const easeOutQuint = value => 1 - Math.pow(1 - value, 5);
const smoothScrollTo = (top, duration = 360, onComplete = () => {}) => {
  if (scrollFrame) cancelAnimationFrame(scrollFrame);
  const previousBehavior = deck.style.scrollBehavior;
  deck.style.scrollBehavior = 'auto';
  const start = deck.scrollTop;
  const distance = top - start;
  const startedAt = performance.now();
  const step = now => {
    const progress = Math.min(1, (now - startedAt) / duration);
    deck.scrollTop = start + distance * easeOutQuint(progress);
    if (progress < 1) scrollFrame = requestAnimationFrame(step);
    else {
      scrollFrame = null;
      deck.style.scrollBehavior = previousBehavior;
      onComplete();
    }
  };
  scrollFrame = requestAnimationFrame(step);
};

const goTo = (index, behavior = 'smooth') => {
  const next = Math.max(0, Math.min(slides.length - 1, index));
  slideIndex = next;
  const top = slides[next].offsetTop - deck.offsetTop;
  isProgrammaticNavigation = true;
  if (behavior === 'instant') {
    const previous = deck.style.scrollBehavior;
    deck.style.scrollBehavior = 'auto';
    deck.scrollTo({ top, behavior: 'auto' });
    requestAnimationFrame(() => {
      deck.style.scrollBehavior = previous;
      isProgrammaticNavigation = false;
    });
  } else smoothScrollTo(top, 360, () => { isProgrammaticNavigation = false; });
  // تبدأ حركة المحتوى قرب اكتمال الانتقال، كي لا تنتهي قبل ظهور السلايد.
  selectSlide(slides[next], behavior === 'instant' ? 0 : 160);
};

document.querySelectorAll('a[href^="#"]').forEach(link => link.addEventListener('click', event => {
  const id = link.getAttribute('href').slice(1);
  const index = slides.findIndex(slide => slide.id === id);
  if (index < 0) return;
  event.preventDefault();
  goTo(index);
  history.replaceState(null, '', `#${id}`);
  closeMenu();
}));

const menu = document.querySelector('.sidebar');
const menuToggle = document.querySelector('.menu-toggle');
const menuClose = document.querySelector('.menu-close');
const menuBackdrop = document.querySelector('.menu-backdrop');
const openMenu = () => {
  menu.classList.add('open');
  menuBackdrop.hidden = false;
  menuToggle.setAttribute('aria-expanded', 'true');
};
const closeMenu = () => {
  menu.classList.remove('open');
  menuBackdrop.hidden = true;
  menuToggle.setAttribute('aria-expanded', 'false');
};
menuToggle.addEventListener('click', () => menu.classList.contains('open') ? closeMenu() : openMenu());
menuClose.addEventListener('click', closeMenu);
menuBackdrop.addEventListener('click', closeMenu);

const holdSlideLock = (cooldown = 480) => {
  locked = true;
  if (lockTimer) window.clearTimeout(lockTimer);
  lockTimer = window.setTimeout(() => {
    locked = false;
    lockTimer = null;
  }, cooldown);
};

const moveSlide = (direction, cooldown = 480) => {
  if (locked) return;
  const next = slideIndex + direction;
  if (next < 0 || next >= slides.length) return;
  holdSlideLock(cooldown);
  goTo(next);
};

const canContinuePast = (slide, direction) => {
  const maxScroll = slide.scrollHeight - slide.clientHeight;
  return maxScroll <= 2 || (direction > 0 ? slide.scrollTop >= maxScroll - 2 : slide.scrollTop <= 2);
};

deck.addEventListener('wheel', event => {
  if (event.target.closest('video,audio,details')) return;
  const scrollableSlide = event.target.closest('#books,#resources');
  if (scrollableSlide) {
    const maxScroll = scrollableSlide.scrollHeight - scrollableSlide.clientHeight;
    const canScrollDown = event.deltaY > 0 && scrollableSlide.scrollTop < maxScroll - 2;
    const canScrollUp = event.deltaY < 0 && scrollableSlide.scrollTop > 2;
    if (canScrollDown || canScrollUp) {
      event.preventDefault();
      scrollableSlide.scrollTop += event.deltaY;
      return;
    }
  }
  event.preventDefault();
  if (locked) {
    // تمديد القفل ما دامت عجلة الماوس ترسل دفعة الحركة نفسها.
    holdSlideLock(480);
    return;
  }
  if (Math.abs(event.deltaY) < 8) return;
  const direction = event.deltaY > 0 ? 1 : -1;
  moveSlide(direction, 480);
}, { passive: false });

let touchStartY = null;
deck.addEventListener('touchstart', event => { touchStartY = event.changedTouches[0].clientY; }, { passive: true });
deck.addEventListener('touchend', event => {
  if (touchStartY === null || event.target.closest('video,audio,details')) return;
  const delta = touchStartY - event.changedTouches[0].clientY;
  touchStartY = null;
  if (Math.abs(delta) < 42) return;
  const direction = delta > 0 ? 1 : -1;
  const scrollableSlide = event.target.closest('#books,#resources');
  if (scrollableSlide && !canContinuePast(scrollableSlide, direction)) return;
  moveSlide(direction);
}, { passive: true });

window.addEventListener('keydown', event => {
  if (!['ArrowDown', 'PageDown', 'ArrowUp', 'PageUp'].includes(event.key)) return;
  event.preventDefault();
  moveSlide(['ArrowDown', 'PageDown'].includes(event.key) ? 1 : -1);
});

document.querySelectorAll('audio,video').forEach(media => media.addEventListener('play', () => {
  document.querySelectorAll('audio,video').forEach(other => { if (other !== media) other.pause(); });
}));

const calendar = document.querySelector('#calendar-grid');
if (calendar) {
  for (let i = 0; i < 21; i++) {
    const date = new Date(Date.UTC(2026, 8, 29 + i));
    const day = document.createElement('div');
    day.className = 'day';
    day.innerHTML = `<small>اليوم ${i + 1}</small><span>${date.getUTCDate()} ${date.getUTCMonth() === 8 ? 'سبتمبر' : 'أكتوبر'}</span>`;
    calendar.append(day);
  }
}

if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
const hashIndex = slides.findIndex(slide => `#${slide.id}` === window.location.hash);
window.setTimeout(() => {
  window.scrollTo(0, 0);
  if (hashIndex >= 0) goTo(hashIndex, 'instant');
  else {
    deck.scrollTop = 0;
    selectSlide(slides[0]);
  }
}, 0);
