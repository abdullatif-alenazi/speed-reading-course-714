const slides = [...document.querySelectorAll('.slide')];
const links = [...document.querySelectorAll('.sidebar nav a')];
const counter = document.querySelector('#slide-counter');

const selectSlide = slide => {
  const index = slides.indexOf(slide);
  if (index < 0) return;
  links.forEach(link => {
    const active = link.getAttribute('href') === `#${slide.id}`;
    link.classList.toggle('active', active);
    active ? link.setAttribute('aria-current', 'location') : link.removeAttribute('aria-current');
  });
  counter.textContent = `الشريحة ${index + 1} من ${slides.length}`;
};

const observer = new IntersectionObserver(entries => {
  entries.filter(entry => entry.isIntersecting)
    .sort((a, b) => b.intersectionRatio - a.intersectionRatio)
    .slice(0, 1)
    .forEach(entry => selectSlide(entry.target));
}, { threshold: [.45, .65] });
slides.forEach(slide => observer.observe(slide));

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
