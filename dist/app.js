const slides = [...document.querySelectorAll('.slide')];
const links = [...document.querySelectorAll('.sidebar nav a')];
const counter = document.querySelector('#slide-counter');
const deck = document.querySelector('main');
let slideIndex = 0;
let locked = false;

const selectSlide = slide => {
  const index = slides.indexOf(slide);
  if (index < 0) return;
  slideIndex = index;
  links.forEach(link => {
    const active = link.getAttribute('href') === `#${slide.id}`;
    link.classList.toggle('active', active);
    active ? link.setAttribute('aria-current', 'location') : link.removeAttribute('aria-current');
  });
  if (counter) counter.textContent = `الشريحة ${index + 1} من ${slides.length}`;
};

const observer = new IntersectionObserver(entries => {
  entries.filter(entry => entry.isIntersecting)
    .sort((a, b) => b.intersectionRatio - a.intersectionRatio)
    .slice(0, 1)
    .forEach(entry => selectSlide(entry.target));
}, { root: deck, threshold: [.45, .65] });
slides.forEach(slide => observer.observe(slide));

const goTo = (index, behavior = 'smooth') => {
  const next = Math.max(0, Math.min(slides.length - 1, index));
  slideIndex = next;
  const top = slides[next].offsetTop - deck.offsetTop;
  if (behavior === 'instant') {
    const previous = deck.style.scrollBehavior;
    deck.style.scrollBehavior = 'auto';
    deck.scrollTo({ top, behavior: 'auto' });
    requestAnimationFrame(() => { deck.style.scrollBehavior = previous; });
  } else {
    deck.scrollTo({ top, behavior });
  }
  selectSlide(slides[next]);
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

deck.addEventListener('wheel', event => {
  if (event.target.closest('video,audio,details')) return;
  const scrollableSlide = event.target.closest('#books,#resources');
  if (scrollableSlide) {
    const maxScroll = scrollableSlide.scrollHeight - scrollableSlide.clientHeight;
    const canScrollDown = event.deltaY > 0 && scrollableSlide.scrollTop < maxScroll;
    const canScrollUp = event.deltaY < 0 && scrollableSlide.scrollTop > 0;
    if (canScrollDown || canScrollUp) {
      event.preventDefault();
      scrollableSlide.scrollTop += event.deltaY;
      return;
    }
  }
  event.preventDefault();
  if (locked || Math.abs(event.deltaY) < 8) return;
  const direction = event.deltaY > 0 ? 1 : -1;
  if ((direction > 0 && slideIndex === slides.length - 1) || (direction < 0 && slideIndex === 0)) return;
  locked = true;
  goTo(slideIndex + direction);
  window.setTimeout(() => { locked = false; }, 650);
}, { passive: false });

let touchStartY = null;
deck.addEventListener('touchstart', event => { touchStartY = event.changedTouches[0].clientY; }, { passive: true });
deck.addEventListener('touchend', event => {
  if (touchStartY === null || event.target.closest('video,audio,details,#books,#resources')) return;
  const delta = touchStartY - event.changedTouches[0].clientY;
  touchStartY = null;
  if (Math.abs(delta) < 42 || locked) return;
  const direction = delta > 0 ? 1 : -1;
  if ((direction > 0 && slideIndex === slides.length - 1) || (direction < 0 && slideIndex === 0)) return;
  locked = true;
  goTo(slideIndex + direction);
  window.setTimeout(() => { locked = false; }, 650);
}, { passive: true });

window.addEventListener('keydown', event => {
  if (!['ArrowDown', 'PageDown', 'ArrowUp', 'PageUp'].includes(event.key)) return;
  event.preventDefault();
  goTo(slideIndex + (['ArrowDown', 'PageDown'].includes(event.key) ? 1 : -1));
});

document.querySelectorAll('audio,video').forEach(media => media.addEventListener('play', () => {
  document.querySelectorAll('audio,video').forEach(other => { if (other !== media) other.pause(); });
}));

const calendar = document.querySelector('#calendar-grid');
for (let i = 0; i < 21; i++) {
  const date = new Date(Date.UTC(2026, 8, 29 + i));
  const day = document.createElement('div');
  day.className = 'day';
  day.innerHTML = `<small>اليوم ${i + 1}</small><span>${date.getUTCDate()} ${date.getUTCMonth() === 8 ? 'سبتمبر' : 'أكتوبر'}</span>`;
  calendar.append(day);
}

const hashIndex = slides.findIndex(slide => `#${slide.id}` === window.location.hash);
if (hashIndex >= 0) window.setTimeout(() => { window.scrollTo(0, 0); goTo(hashIndex, 'instant'); }, 0);
else selectSlide(slides[0]);
