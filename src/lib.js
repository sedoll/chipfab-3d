// 부품(파트) 생성 헬퍼. 모든 파트는 "바닥 중심" 기준 p, 크기 d 를 가진 평범한 객체입니다.
// 새 부품을 추가할 땐 이 헬퍼로 파트를 만들고 steps 배열에 넣기만 하면 됩니다.

// [이름, 색, 금속여부]
export const M = {
  si: ['실리콘 기판 (Si)', '#8f9bb3'],
  ox: ['산화막 (SiO₂)', '#7cc4f0'],
  sin: ['질화막 (Si₃N₄)', '#35b8a0'],
  poly: ['폴리실리콘', '#d4bf5a'],
  resist: ['포토레지스트', '#ee6a8a'],
  n: ['n+ 도핑 영역', '#f4923f'],
  w: ['텅스텐 (W)', '#b9bfcc', 1],
  cu: ['구리 (Cu)', '#e8873c', 1],
  tin: ['TiN 하부 전극', '#7d8fc7', 1],
  tin2: ['TiN 상부 전극', '#a8b8ee', 1],
  hik: ['고유전체 (High-k)', '#f2e26b'],
  mask: ['마스크 (유리)', '#9fb4d6'],
  chrome: ['마스크 패턴 (크롬)', '#2b3040'],
  uv: ['노광 빛', '#b78cff'],
  ion: ['이온 빔', '#ffd84a'],
  blk: ['블로킹 산화막', '#a5d8ff'],
  trap: ['전하 트랩층 (Si₃N₄)', '#d96bd0'],
  tun: ['터널 산화막', '#8fe0c8'],
  ch: ['채널 폴리실리콘', '#e6eaf2'],
  cmos: ['주변회로 (CMOS)', '#5aa3c8'],
  void: ['식각된 빈 공간', '#05070c'],
  pcb: ['PCB 기판', '#2f8a55'],
  gold: ['금 단자', '#f1c84b', 1],
  mold: ['에폭시 몰드', '#4a5670'],
  solder: ['솔더볼', '#c9ced8', 1],
  chip: ['패키지 칩', '#171b25'],
  elec: ['전자 (e⁻)', '#ffe45c'],
};

const mk = (s, id, p, d, m, o = {}) => ({ id, s, p, d, c: M[m]?.[1] ?? m, n: M[m]?.[0], mt: M[m]?.[2], ...o });
const mid = (a) => (a[0] + a[1]) / 2;

export const box = (id, [x0, x1], [y0, y1], [z0, z1], m, o) =>
  mk('box', id, [mid([x0, x1]), y0, mid([z0, z1])], [x1 - x0, y1 - y0, z1 - z0], m, o);
// o.rt = 윗면 반지름 (원뿔/테이퍼)
export const cyl = (id, x, z, [y0, y1], r, m, o) => mk('cyl', id, [x, y0, z], [r, y1 - y0, o?.rt ?? r], m, o);
export const tube = (id, x, z, [y0, y1], ro, ri, m, o) => mk('tube', id, [x, y0, z], [ro, ri, y1 - y0], m, o);
// holes: [[x, z, r], ...] (월드 좌표) — 구멍 뚫린 판
export const slab = (id, [x0, x1], [y0, y1], [z0, z1], holes, m, o) =>
  mk('slab', id, [mid([x0, x1]), y0, mid([z0, z1])], [x1 - x0, y1 - y0, z1 - z0, holes], m, o);
export const sph = (id, x, y, z, r, m, o) => mk('sph', id, [x, y, z], [r], m, o);
export const wire = (id, pts, r, m, o) => mk('wire', id, [0, 0, 0], [pts, r], m, o);

// 배열의 모든 파트에 그룹 태그(g)를 붙임 → 이후 step 의 del: ['그룹'] 으로 한 번에 삭제
export const G = (g, arr) => arr.map((p) => ({ ...p, g }));
// i = 0..n-1
export const R = (n, f) => Array.from({ length: n }, (_, i) => f(i));
