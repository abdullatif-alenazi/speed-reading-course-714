const calendar = document.querySelector('#calendar-grid');
for (let i = 0; i < 21; i++) {
  const date = new Date(Date.UTC(2026, 8, 29 + i));
  const day = document.createElement('div');
  day.className = 'day';
  const label = document.createElement('small');
  label.textContent = `اليوم ${i + 1}`;
  const text = document.createElement('span');
  text.textContent = `${date.getUTCDate()} ${date.getUTCMonth() === 8 ? 'سبتمبر' : 'أكتوبر'}`;
  day.append(label, text);
  calendar.append(day);
}
const links = [...document.querySelectorAll('nav a')];
const observer = new IntersectionObserver(entries => {
  for (const entry of entries) {
    if (entry.isIntersecting) {
      for (const link of links) {
        const active = link.getAttribute('href') === `#${entry.target.id}`;
        link.classList.toggle('active', active);
        if (active) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      }
    }
  }
}, {rootMargin: '-5% 0px -65% 0px', threshold: 0});
document.querySelectorAll('main section[id]').forEach(section => observer.observe(section));
document.querySelectorAll('audio,video').forEach(media => media.addEventListener('play', () => {
  document.querySelectorAll('audio,video').forEach(other => { if (other !== media) other.pause(); });
}));
