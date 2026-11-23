// HBM (High Bandwidth Memory) — DRAM 다이에 TSV 를 뚫어 수직으로 쌓는 3D 적층 메모리
import { box, cyl, tube, slab, sph, G, R } from '../lib.js';
import { waferSteps, dicing } from './common.js';
import { interposer } from './gpu.js';

const B = (a) => G('blk', a);
const COLOR = '#4f7fd8';
const TX = [-2.4, 0, 2.4], TZ = [-2, 0, 2];
const tsv = TX.flatMap((x, i) => TZ.map((z, j) => [x, z, i, j]));
const holes = tsv.map(([x, z]) => [x, z, 0.5]);
const XR = [-4, 4], ZR = [-3.2, 3.2];
const cam1 = [[10, 7, 11], [0, -0.2, 0]];
const NL = 8, TOP = 0.45 + NL * 0.35;

const block = B([
  box('sub0', XR, [-1.4, -1.1], ZR, 'si'),
  slab('subt', XR, [-1.1, 0], ZR, [], 'si', { n: '실리콘 (DRAM 다이)' }),
]);

const steps = [
  {
    ph: 'TSV 형성', t: 'TSV 홀 식각',
    d: 'HBM의 핵심은 칩을 위아래로 관통하는 구멍, TSV(Through-Silicon Via)입니다. 딥 반응성 이온 식각(DRIE)으로 실리콘에 머리카락보다 훨씬 가는 깊은 구멍을 한 칩에 수천~수만 개 뚫습니다. 구멍이 많을수록 데이터 통로(대역폭)가 늘어납니다.',
    add: B([slab('subt', XR, [-1.1, 0], ZR, holes, 'si', { n: '실리콘 (DRAM 다이)' }), ...tsv.map(([x, z, i, j]) => cyl(`void.${i}.${j}`, x, z, [-1.1, 0], 0.5, 'void', { o: 0.8, n: 'TSV 홀', dl: (i + j) * 0.1 }))]),
  },
  {
    ph: 'TSV 형성', t: '절연막 + 구리 채움',
    d: '구멍 벽면에 산화막(절연)과 확산 방지 배리어를 입히고, 구리(Cu)를 도금으로 가득 채웁니다. 절연막은 구리 기둥이 실리콘과 합선되는 것을 막습니다. 이제 칩을 관통하는 수직 전선이 생겼습니다.',
    del: R(9, (n) => `void.${Math.floor(n / 3)}.${n % 3}`),
    add: B(tsv.flatMap(([x, z, i, j]) => [
      tube(`lin.${i}.${j}`, x, z, [-1.1, 0], 0.5, 0.42, 'ox', { n: '절연 라이너 (SiO₂)', dl: (i + j) * 0.08 }),
      cyl(`cu.${i}.${j}`, x, z, [-1.1, 0.35], 0.42, 'cu', { n: 'TSV 구리 기둥', dl: 0.3 + (i + j) * 0.08 }),
    ])),
  },
  {
    ph: 'TSV 형성', t: 'DRAM 회로 + 마이크로범프', cam: [[10.5, 7.5, 11.5], [0, 0.2, 0]],
    d: '위쪽에는 앞에서 본 것과 같은 DRAM 셀·배선 회로를 만들고(DRAM 페이지 참고), TSV 윗면에 마이크로범프를 올립니다. 범프는 지름이 수십 μm로 일반 솔더볼보다 훨씬 작아 한 칩에 수만 개를 배치할 수 있습니다.',
    add: B([
      slab('ckt', XR, [0, 0.35], ZR, holes, COLOR, { o: 0.6, n: 'DRAM 셀·배선 회로 층' }),
      ...tsv.map(([x, z, i, j]) => sph(`ub.${i}.${j}`, x, 0.5, z, 0.2, 'solder', { n: '마이크로범프', dl: 0.3 + (i + j) * 0.06 })),
    ]),
  },
  {
    ph: 'TSV 형성', t: '웨이퍼 박막화 (백그라인딩)', cam: [[10, 5, 11], [0, -0.2, 0]],
    d: '캐리어 웨이퍼에 임시로 붙인 뒤 뒷면을 갈아 실리콘을 수십 μm까지 얇게 만들면 TSV 구리 기둥의 아래쪽 끝이 드러납니다. 얇을수록 적층 높이가 낮아져 열도 잘 빠집니다. 얇은 웨이퍼는 쉽게 휘고 깨져서 가장 까다로운 공정입니다.',
    del: ['sub0'],
    add: B(tsv.map(([x, z, i, j]) => sph(`bb.${i}.${j}`, x, -1.25, z, 0.2, 'solder', { n: '뒷면 범프', dl: 0.5 + (i + j) * 0.06 }))),
  },
  dicing(COLOR),
  {
    ph: '적층', t: '다이 적층 (TSV + 마이크로범프)', cam: [[10, 7, 12], [0, 1.5, 0]],
    d: '얇게 만든 DRAM 다이를 한 장씩 정렬해 쌓습니다 (이 모델은 8단, 실제 HBM3E는 8~12단, HBM4는 16단까지). 위 다이의 범프가 아래 다이의 TSV에 닿아 모든 층이 하나의 수직 버스로 연결됩니다. 맨 아래에는 컨트롤을 담당하는 베이스(로직) 다이가 놓입니다.',
    del: ['wafer'],
    add: G('stack', [
      box('base', [-4, 4], [0, 0.35], [-3.2, 3.2], '#3a4a7a', { n: '베이스 다이 (로직·PHY)' }),
      ...R(NL, (k) => box(`d.${k}`, [-3.6, 3.6], [0.45 + k * 0.35, 0.7 + k * 0.35], [-2.8, 2.8], COLOR, { o: 0.65, n: 'DRAM 다이', dl: 0.2 + k * 0.25 })),
      ...tsv.map(([x, z, i, j]) => cyl(`col.${i}.${j}`, x, z, [0.35, TOP], 0.14, 'cu', { n: 'TSV (관통 전극)', dl: 0.4 + (i + j) * 0.1 })),
      ...tsv.flatMap(([x, z, i, j]) => R(NL, (k) => sph(`mb.${i}.${j}.${k}`, x, 0.4 + k * 0.35, z, 0.1, 'solder', { n: '마이크로범프', dl: 0.5 + k * 0.25 }))),
    ]),
  },
  {
    ph: '적층', t: '몰딩 (언더필 일괄 충진)',
    d: '적층된 다이 사이 빈틈을 수지로 한 번에 채우고 (MR-MUF 등) 굳혀 하나의 덩어리로 만듭니다. 수지는 열을 잘 전달하면서 다이를 단단히 고정합니다. 이렇게 완성된 스택이 "HBM 칩" 한 개입니다.',
    add: G('stack', [box('mold', [-4.1, 4.1], [0.35, TOP + 0.15], [-3.3, 3.3], 'mold', { o: 0.25, n: '몰딩 수지 (MUF)', dl: 0.3 })]),
  },
  { ...interposer, t: 'GPU 옆 인터포저에 실장', d: 'HBM 스택은 GPU 바로 옆 실리콘 인터포저에 올려 수천 가닥의 배선으로 연결됩니다 (2.5D 패키징). 짧은 거리를 매우 넓은 버스로 연결하기 때문에 DRAM 모듈(DIMM)보다 수 배~수십 배 빠르고 전력 효율도 높아 AI 가속기의 필수 부품이 되었습니다.', del: ['stack'] },
];

export default {
  id: 'hbm', name: 'HBM', sub: 'AI용 고대역폭 메모리 · 3D 적층 DRAM', cat: '메모리', kw: 'high bandwidth memory tsv 적층 dram ai 고대역폭 하이닉스 삼성 엔비디아',
  about: 'DRAM 다이를 수직으로 쌓고 TSV로 관통 연결한 초고속 메모리. 구멍 뚫기 → 얇게 갈기 → 쌓기 → GPU 옆에 붙이기까지 만들어 봅니다.',
  steps: [...waferSteps(COLOR, block, cam1), ...steps],
};
