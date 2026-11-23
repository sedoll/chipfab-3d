// 반도체 부품이 공통으로 쓰는 단계: 웨이퍼 제작 → 다이싱 → 패키징
import { box, cyl, tube, sph, wire, G, R } from '../lib.js';

const WAFER_CAM = [[0, 9.5, 9.5], [0, 0, 0]];

// 웨이퍼 위 다이 배열 (pitch 로 간격 조절, 원 안쪽만)
const dies = (color, pitch, y, g) => {
  const out = [];
  for (let i = -7; i <= 7; i++) for (let j = -7; j <= 7; j++) {
    const x = i * 0.75, z = j * 0.75;
    if (Math.hypot(Math.abs(x) + 0.33, Math.abs(z) + 0.33) > 4.7) continue;
    const hl = i === 0 && j === 0;
    out.push(box(`die.${i}.${j}`, [x * pitch / 0.75 - 0.3, x * pitch / 0.75 + 0.3], [y, y + 0.08], [z * pitch / 0.75 - 0.3, z * pitch / 0.75 + 0.3], hl ? '#ffd84a' : color, { n: hl ? '선택한 다이 (확대할 칩)' : '다이 (칩 1개)', g }));
  }
  return out;
};

// 웨이퍼 제작 + "한 칩을 확대" 까지. block: 확대 후 보여줄 셀 영역 파트 배열
export const waferSteps = (dieColor, block, blockCam) => [
  {
    ph: '웨이퍼', t: '실리콘 잉곳 성장', cam: [[11, 6, 13], [0, 3, 0]],
    d: '모래(SiO₂)를 정제해 만든 초고순도 폴리실리콘을 석영 도가니에서 녹인 뒤, 씨앗 결정을 천천히 돌리며 끌어올려 단결정 실리콘 기둥(잉곳)을 만듭니다 (초크랄스키법). 순도는 99.9999999%(9N) 이상입니다.',
    add: G('ingot', [
      tube('crucible', 0, 0, [-1.2, 1.5], 3, 2.8, '#566178', { n: '석영 도가니', o: 0.5 }),
      cyl('melt', 0, 0, [-1.2, 0], 2.8, '#ff9a3c', { n: '용융 실리콘 (1,400℃+)', em: '#ff6a00' }),
      cyl('ingot', 0, 0, [0, 6], 2, 'si', { n: '단결정 실리콘 잉곳' }),
      cyl('shoulder', 0, 0, [6, 7.2], 2, 'si', { rt: 0.3 }),
      cyl('seed', 0, 0, [7.2, 8.6], 0.15, '#aab4c8', { n: '씨앗 결정 (회전하며 상승)' }),
    ]),
  },
  {
    ph: '웨이퍼', t: '웨이퍼 절단·연마', cam: WAFER_CAM,
    d: '잉곳을 다이아몬드 와이어 톱으로 약 0.8mm 두께로 얇게 썰고 표면을 거울처럼 연마(CMP)합니다. 이 얇은 원판이 웨이퍼이며 모든 반도체 공정의 출발점입니다. 300mm(12인치) 웨이퍼가 가장 널리 쓰입니다.',
    del: ['ingot'],
    add: G('wafer', R(3, (i) => cyl(`wafer.${i}`, 0, 0, [i * 0.9, i * 0.9 + 0.25], 5, 'si', { n: '웨이퍼', dl: i * 0.15 }))),
  },
  {
    ph: '웨이퍼', t: '웨이퍼 위의 수천 개 칩', cam: WAFER_CAM,
    d: '웨이퍼 한 장에는 똑같은 칩(다이)이 수백~수천 개 만들어집니다. 앞으로의 모든 공정은 웨이퍼 전체에 동시에 진행됩니다. 노란색으로 표시한 다이 하나의 메모리 셀을 현미경처럼 확대해서 살펴봅니다.',
    del: ['wafer.1', 'wafer.2'], set: { 'wafer.0': { o: 1 } },
    add: dies(dieColor, 0.75, 0.25, 'wafer'),
  },
  {
    ph: '웨이퍼', t: '셀 영역 확대', cam: blockCam,
    d: '확대한 셀 영역입니다. 실제 셀은 수십 nm 크기이며, 이 모델은 학습용으로 단순화한 일부분만 보여줍니다. 모든 층은 아래부터 한 층씩 쌓아 올립니다. 마우스로 돌려보고(드래그), 확대(휠)해 보세요.',
    del: ['wafer'], add: block,
  },
];

// 다이싱 + 패키징 (nDies: 한 패키지 안에 쌓는 다이 수)
export const packageSteps = (dieColor, nDies, note) => [
  {
    ph: '패키징', t: '웨이퍼 테스트 · 다이싱', cam: WAFER_CAM,
    d: '프로브 카드로 웨이퍼 상태의 칩을 전수 테스트해 불량을 표시(번인·EDS)한 뒤, 다이아몬드 톱이나 레이저로 칩을 하나씩 잘라냅니다 (다이싱). 양품 다이만 다음 단계로 갑니다.',
    del: ['blk'],
    add: [...G('wafer', [cyl('tape', 0, 0, [-0.05, 0.05], 5.4, '#556079', { n: '다이싱 테이프', o: 0.35 })]), ...dies(dieColor, 0.95, 0.05, 'wafer')],
  },
  {
    ph: '패키징', t: '패키징 (다이 접착·와이어 본딩·몰딩)', cam: [[9, 8.5, 11], [0.5, 0.6, 0]],
    d: `양품 다이를 기판에 붙이고(다이 어태치) 금선으로 연결(와이어 본딩)한 뒤, 에폭시 몰딩 컴파운드로 감싸고 아래에 솔더볼을 붙입니다 (BGA 패키지). ${note}`,
    del: ['wafer'], add: G('pkg', pkg(dieColor, nDies)),
  },
];

function pkg(color, n) {
  const top = 0.35 + n * 0.3;
  const out = [
    box('sub', [-4, 4], [0, 0.35], [-3, 3], 'pcb', { n: '패키지 기판 (PCB)' }),
    box('mold', [-3.6, 3.6], [0.35, top + 0.6], [-2.8, 2.8], 'mold', { o: 0.3, n: '에폭시 몰드' }),
  ];
  R(n, (k) => {
    const x0 = -2.2 + 0.4 * k, y0 = 0.35 + 0.3 * k;
    out.push(box(`pdie.${k}`, [x0, x0 + 4], [y0, y0 + 0.26], [-1.8, 1.8], color, { n: '다이', dl: k * 0.25 }));
    [-1.2, 0, 1.2].forEach((z, j) => out.push(wire(`wb.${k}.${j}`, [[x0 + 0.15, y0 + 0.26, z], [(x0 - 3.3) / 2, y0 + 0.75, z], [-3.3, 0.35, z]], 0.035, 'gold', { n: '본딩 와이어 (금)', dl: 0.5 + k * 0.25 })));
  });
  for (let i = 0; i < 7; i++) for (let j = 0; j < 5; j++) out.push(sph(`ball.${i}.${j}`, -3 + i, -0.2, -2 + j, 0.22, 'solder', { n: '솔더볼' }));
  return out;
}
