import { createViewer } from './engine.js';
import { parts, soon } from './components/index.js';

const $ = (s) => document.querySelector(s);
const viewer = createViewer($('#c'));
let part = parts[0], idx = 0, timer = null;

const tabs = $('#tabs');
tabs.innerHTML = parts.map((p) => `<button data-id="${p.id}"><b>${p.name}</b><small>${p.sub}</small></button>`).join('') +
  soon.map((s) => `<button disabled title="준비 중"><b>${s}</b><small>준비 중</small></button>`).join('');
tabs.onclick = (e) => { const b = e.target.closest('button[data-id]'); if (b) select(b.dataset.id, 0); };

function select(id, i) {
  part = parts.find((p) => p.id === id) || parts[0];
  [...tabs.children].forEach((b) => b.classList.toggle('on', b.dataset.id === part.id));
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
  if (e.key === 'ArrowRight') go(idx + 1); else if (e.key === 'ArrowLeft') go(idx - 1);
  else if (e.key === ' ') { e.preventDefault(); play(); }
});

const [h, n] = location.hash.slice(1).split('/');
select(h, (+n || 1) - 1);
