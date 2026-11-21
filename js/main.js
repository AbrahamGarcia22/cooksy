/* ============================================================
   CONFIGURACIÓN: para añadir / quitar / reordenar secciones
   solo edita este arreglo y crea el archivo HTML en /sections
   ============================================================ */
const SECTIONS = [
  { id: 'inicio',          title: 'Inicio',                 file: 'sections/inicio.html' },
  { id: 'introduccion',    title: 'Introducción',           file: 'sections/introduccion.html' },
  { id: 'diagnostico',     title: 'Diagnóstico',            file: 'sections/diagnostico.html' },
  { id: 'importancia',     title: 'Alimentación saludable', file: 'sections/importancia.html' },
  { id: 'plato',           title: 'Plato del Bien Comer',   file: 'sections/plato.html' },
  { id: 'desayuno',        title: 'Desayuno y lunch',       file: 'sections/desayuno.html' },
  { id: 'micronutrientes', title: 'Hierro y calcio',        file: 'sections/micronutrientes.html' },
  { id: 'actividad',       title: 'Actividad física',       file: 'sections/actividad.html' },
  { id: 'cierre',          title: 'Cierre del curso',       file: 'sections/cierre.html' },
  { id: 'agradecimientos', title: 'Agradecimientos',        file: 'sections/agradecimientos.html' },
];

const view = document.getElementById('view');
const nav = document.getElementById('nav');
const menuBtn = document.getElementById('menuBtn');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const pageInfo = document.getElementById('pageInfo');
const bar = document.getElementById('progressBar');
const cache = {};
let current = -1, busy = false;

/* ---------- Menú ---------- */
nav.innerHTML = SECTIONS.map(s => `<a href="#${s.id}" data-id="${s.id}">${s.title}</a>`).join('');
menuBtn.addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  menuBtn.setAttribute('aria-expanded', open);
});
nav.addEventListener('click', () => {
  nav.classList.remove('open');
  menuBtn.setAttribute('aria-expanded', false);
});

/* ---------- Carga de secciones ---------- */
async function getHTML(file) {
  if (cache[file]) return cache[file];
  const res = await fetch(file);
  if (!res.ok) throw new Error(res.status);
  return (cache[file] = await res.text());
}

async function show(index) {
  if (busy || index === current || index < 0 || index >= SECTIONS.length) return;
  busy = true;
  const dir = index > current ? 'forward' : 'back';
  const s = SECTIONS[index];

  // Salida suave
  view.classList.remove('forward', 'back');
  view.classList.add('leaving', dir);
  await new Promise(r => setTimeout(r, current === -1 ? 0 : 280));

  let html;
  try { html = await getHTML(s.file); }
  catch (e) {
    html = `<section class="section"><div class="card"><h2>No se pudo cargar la sección</h2>
      <p>Abre el proyecto con un servidor local (por ejemplo la extensión <b>Live Server</b> de VS Code
      o <code>python -m http.server</code>), ya que los navegadores bloquean <code>fetch</code> en archivos <code>file://</code>.</p></div></section>`;
  }
  view.innerHTML = html;
  fixImages(view);
  window.scrollTo({ top: 0, behavior: 'instant' });

  // Entrada suave: se coloca en posición inicial y luego se libera
  view.classList.remove('leaving');
  view.classList.add('entering', dir);
  void view.offsetWidth;
  view.classList.remove('entering', 'forward', 'back');
  observeReveal();

  current = index;
  document.title = `${s.title} | Hábitos saludables en la infancia`;
  nav.querySelectorAll('a').forEach(a => a.classList.toggle('active', a.dataset.id === s.id));
  prevBtn.disabled = index === 0;
  nextBtn.disabled = index === SECTIONS.length - 1;
  pageInfo.textContent = `${index + 1} / ${SECTIONS.length}`;
  bar.style.width = `${((index + 1) / SECTIONS.length) * 100}%`;
  busy = false;
}

function route() {
  const id = location.hash.replace('#', '') || SECTIONS[0].id;
  const i = SECTIONS.findIndex(s => s.id === id);
  show(i === -1 ? 0 : i);
}

/* ---------- Navegación ---------- */
const go = d => { const i = current + d; if (SECTIONS[i]) location.hash = SECTIONS[i].id; };
prevBtn.addEventListener('click', () => go(-1));
nextBtn.addEventListener('click', () => go(1));
window.addEventListener('hashchange', route);
document.addEventListener('keydown', e => {
  if (e.target.matches('input, textarea')) return;
  if (e.key === 'ArrowRight') go(1);
  if (e.key === 'ArrowLeft') go(-1);
});

/* ---------- Animación al hacer scroll ---------- */
let io;
function observeReveal() {
  io && io.disconnect();
  io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }), { threshold: 0.12 });
  view.querySelectorAll('.reveal').forEach((el, i) => {
    el.style.transitionDelay = `${(i % 4) * 80}ms`;
    io.observe(el);
  });
}

/* ---------- Imagen de respaldo si aún no existe el archivo ---------- */
function fixImages(root) {
  root.querySelectorAll('img').forEach(img => {
    img.addEventListener('error', () => {
      const ph = document.createElement('div');
      ph.className = 'img-placeholder';
      ph.dataset.emoji = img.dataset.emoji || '🖼️';
      ph.innerHTML = `<small>Reemplaza: ${img.getAttribute('src')}</small>`;
      img.replaceWith(ph);
    }, { once: true });
  });
}

route();
