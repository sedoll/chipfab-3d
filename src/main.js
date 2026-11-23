import { createViewer } from './engine.js';
import { parts } from './components/index.js';

const $ = (s) => document.querySelector(s);
const viewer = createViewer($('#c'));
let part = parts[0], idx = 0, timer = null;

// ── 검색 가능한 부품 선택 박스 ──
const pop = $('#pop'), q = $('#q'), opts = $('#opts');
let shown = [], act = 0;
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
function renderOpts() {
  const t = q.value.trim().toLowerCase();
  shown = parts.filter((p) => [p.name, p.sub, p.cat, p.kw, p.id].join(' ').toLowerCase().includes(t));
  act = Math.max(0, Math.min(act, shown.length - 1));
  opts.innerHTML = shown.length
    ? shown.map((p, i) => `${i && shown[i - 1].cat === p.cat ? '' : `<h4>${esc(p.cat)}</h4>`}<button role="option" data-i="${i}" class="${i === act ? 'act' : ''}${p.id === part.id ? ' on' : ''}"><b>${esc(p.name)}</b><small>${esc(p.sub)}</small></button>`).join('')
    : '<p class="none">검색 결과가 없습니다</p>';
  opts.querySelector('.act')?.scrollIntoView({ block: 'nearest' });
}
function openPop(open) {
  pop.hidden = !open; $('#pick').setAttribute('aria-expanded', open);
  if (open) { q.value = ''; act = Math.max(0, parts.indexOf(part)); renderOpts(); q.focus(); }
}
$('#pick').onclick = () => openPop(pop.hidden);
q.oninput = () => { act = 0; renderOpts(); };
opts.onclick = (e) => { const b = e.target.closest('button[data-i]'); if (b) choose(+b.dataset.i); };
function choose(i) { if (shown[i]) { openPop(false); select(shown[i].id, 0); } }
q.onkeydown = (e) => {
  if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); act = (act + (e.key === 'ArrowDown' ? 1 : -1) + shown.length) % (shown.length || 1); renderOpts(); }
  else if (e.key === 'Enter') choose(act);
  else if (e.key === 'Escape') { openPop(false); $('#pick').focus(); }
};
document.addEventListener('pointerdown', (e) => { if (!pop.hidden && !e.target.closest('#picker')) openPop(false); });

function select(id, i) {
  part = parts.find((p) => p.id === id) || parts[0];
  $('#pn').textContent = part.name; $('#ps').textContent = part.sub;
  $('#about').textContent = part.about;
  $('#list').innerHTML = part.steps.map((s, k) => `${k && part.steps[k - 1].ph === s.ph ? '' : `<h4>${s.ph}</h4>`}<button data-i="${k}"><i>${k + 1}</i>${s.t}</button>`).join('');
  go(i);
}

function go(i, auto) {
  if (!auto) stop();
  idx = Math.max(0, Math.min(part.steps.length - 1, i));
  const s = part.steps[idx];
  viewer.show(part.steps, idx);
  history.replaceState(null, '', `#${part.id}/${idx + 1}`);
  $('#ph').textContent = `${s.ph} · ${idx + 1}/${part.steps.length}`;
  $('#t').textContent = s.t; $('#d').textContent = s.d;
  const seen = new Map(); // 이 단계에서 새로 등장한 재료 범례
  (s.add || []).forEach((p) => p.n && !seen.has(p.n) && seen.set(p.n, p.c));
  $('#legend').innerHTML = [...seen].slice(0, 7).map(([n, c]) => `<span><i style="background:${c}"></i>${n}</span>`).join('');
  $('#bar').style.width = `${((idx + 1) / part.steps.length) * 100}%`;
  $('#prev').disabled = idx === 0; $('#next').disabled = idx === part.steps.length - 1;
  document.querySelectorAll('#list button').forEach((b) => b.classList.toggle('on', +b.dataset.i === idx));
  document.querySelector('#list button.on')?.scrollIntoView({ block: 'nearest' });
}

function stop() { clearInterval(timer); timer = null; $('#play').textContent = '▶ 자동 재생'; }
function play() {
  if (timer) return stop();
  if (idx === part.steps.length - 1) go(0);
  $('#play').textContent = '⏸ 멈춤';
  timer = setInterval(() => (idx < part.steps.length - 1 ? go(idx + 1, true) : stop()), 5500);
}

$('#list').onclick = (e) => { const b = e.target.closest('button[data-i]'); if (b) go(+b.dataset.i); };
$('#prev').onclick = () => go(idx - 1);
$('#next').onclick = () => go(idx + 1);
$('#play').onclick = play;
addEventListener('keydown', (e) => {
  if (e.target.closest('#picker')) return; // 검색창 입력 중엔 단계 단축키 무시
  if (e.key === 'ArrowRight') go(idx + 1); else if (e.key === 'ArrowLeft') go(idx - 1);
  else if (e.key === ' ') { e.preventDefault(); play(); }
});

const [h, n] = location.hash.slice(1).split('/');
select(h, (+n || 1) - 1);
