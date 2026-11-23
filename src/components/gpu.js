// GPU — CPU 와 같은 로직 공정(logic.js) + HBM 메모리를 인터포저 위에 함께 얹는 패키징
import { box, cyl, tube, G, R } from '../lib.js';
import { waferSteps, dicing } from './common.js';
import { logicBlock, logicCam, logicSteps } from './logic.js';

const COLOR = '#7cc04a';

export const interposer = {
  ph: '패키징', t: '인터포저 위에 GPU + HBM 실장', cam: [[11, 9.5, 12.5], [0, 0.6, 0]],
  d: 'GPU는 초당 수 TB의 메모리 대역폭이 필요해서 DRAM을 여러 장 쌓은 HBM을 GPU 바로 옆에 붙입니다. 둘은 실리콘 인터포저(미세 배선이 있는 실리콘 판) 위에서 수천 가닥의 배선으로 이어지고 (2.5D 패키징, CoWoS 등), 인터포저가 다시 패키지 기판에 얹힙니다. HBM 안의 DRAM은 실리콘 관통 전극(TSV)으로 위아래가 연결됩니다.',
  del: ['wafer'],
  add: G('pkg', [
    box('sub', [-5.2, 5.2], [0, 0.3], [-4, 4], 'pcb', { n: '패키지 기판' }),
    box('ipo', [-4.8, 4.8], [0.3, 0.45], [-3.4, 3.4], '#58c4b0', { o: 0.55, n: '실리콘 인터포저' }),
    box('gpu', [-2, 2], [0.45, 0.85], [-2.2, 2.2], COLOR, { n: 'GPU 다이', dl: 0.4 }),
    ...[[2.6, 4.4], [-4.4, -2.6]].flatMap((xr, s) => [[-2.7, -0.2], [0.2, 2.7]].flatMap((zr, t) => R(5, (k) =>
      box(`hbm.${s}.${t}.${k}`, xr, [0.45 + k * 0.17, 0.45 + k * 0.17 + 0.13], zr, k === 0 ? '#3a4a7a' : '#4f7fd8', { n: k === 0 ? 'HBM 베이스 다이' : 'HBM (DRAM 적층)', dl: 0.8 + k * 0.12 + (s * 2 + t) * 0.1 })))),
  ]),
};

const fan = (id, x) => [
  tube(`${id}.r`, x, 0, [1.6, 1.9], 2.3, 2.05, '#222834', { n: '쿨링 팬' }),
  cyl(`${id}.h`, x, 0, [1.6, 1.9], 0.6, '#394155'),
  ...R(3, (i) => box(`${id}.b${i}`, [x - 0.1, x + 0.1], [1.65, 1.8], [0, 2.0], '#394155', { dl: 0 })),
];

const card = {
  ph: '패키징', t: '그래픽카드 조립', cam: [[0, 15, 13], [0, 0, 0]],
  d: '완성된 GPU 패키지를 전원부(VRM)·VRAM과 함께 PCB에 실장하고 방열판과 팬을 붙이면 그래픽카드가 됩니다. 금색 단자는 메인보드의 PCIe 슬롯에 꽂힙니다. 아래 방열판은 내부가 보이도록 반투명으로 표현했습니다.',
  del: ['pkg'],
  add: G('mod', [
    box('pcb', [-6, 6], [0, 0.2], [-2.8, 2.8], 'pcb', { n: '그래픽카드 PCB' }),
    box('gpkg', [-1.6, 1.6], [0.2, 0.4], [-1.6, 1.6], '#2f8a55', { n: 'GPU 패키지', dl: 0.2 }),
    box('gdie', [-0.9, 0.9], [0.4, 0.55], [-0.9, 0.9], COLOR, { n: 'GPU 다이', dl: 0.3 }),
    ...R(6, (i) => box(`vram.${i}`, [-5.4 + i * 0.001 + (i % 3) * 0.9, -4.7 + (i % 3) * 0.9], [0.2, 0.32], [i < 3 ? -2.3 : 1.3, i < 3 ? -1.5 : 2.1], 'chip', { n: 'VRAM / 전원부(VRM)', dl: 0.4 })),
    ...R(16, (i) => box(`vrm.${i}`, [3 + (i % 4) * 0.7, 3.5 + (i % 4) * 0.7], [0.2, 0.45], [-2.2 + Math.floor(i / 4) * 1.1, -1.6 + Math.floor(i / 4) * 1.1], 'chip', { dl: 0.5 })),
    ...R(20, (i) => box(`gf.${i}`, [-5.3 + i * 0.3, -5.1 + i * 0.3], [0.2, 0.23], [-2.8, -2.0], 'gold', { n: 'PCIe 금 단자', dl: 0.8 })),
    box('hs', [-5.6, 5.6], [0.7, 1.6], [-2.6, 2.6], '#3a4458', { o: 0.4, n: '방열판', dl: 1 }),
    ...fan('fan0', -2.9), ...fan('fan1', 2.9),
  ]),
};

export default {
  id: 'gpu', name: 'GPU', sub: '그래픽 · AI 가속기', cat: '로직', kw: '그래픽 그래픽카드 graphics ai hbm 엔비디아 nvidia 가속기 로직',
  about: '수천 개의 작은 코어로 병렬 연산을 하는 로직 반도체. 트랜지스터 공정은 CPU와 같고, HBM 메모리를 함께 얹는 패키징이 특징입니다.',
  steps: [
    ...waferSteps(COLOR, logicBlock, logicCam),
    ...logicSteps(),
    dicing(COLOR), interposer, card,
  ],
};
